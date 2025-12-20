import os
import io
import json
import requests
from typing import List, Optional
from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from supabase import create_client, Client
import google.generativeai as genai
from groq import Groq
from bs4 import BeautifulSoup
from pypdf import PdfReader

# Initialize FastAPI
app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")

# CORS - Allow all for Vercel/Client communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment Variables
SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("VITE_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_ANON_KEY") or os.environ.get("VITE_SUPABASE_ANON_KEY")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
GROQ_API_KEY = os.environ.get("GROQ_API_KEY")

# Initialize Clients
if not SUPABASE_URL or not SUPABASE_KEY:
    print("Warning: Supabase credentials missing")
    supabase: Client = None
else:
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)
else:
    print("Warning: Google API Key missing")

if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
else:
    print("Warning: Groq API Key missing")
    groq_client = None

# Pydantic Models
class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class CrawlRequest(BaseModel):
    url: str

# Helper: Get Embedding
def get_embedding(text: str) -> List[float]:
    if not GOOGLE_API_KEY:
        raise HTTPException(status_code=500, detail="Server misconfiguration: No AI Key")
    # Clean text
    clean_text = text.replace("\n", " ")
    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=clean_text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"Embedding failed: {e}")
        # Re-raise to alert caller
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")

# Helper: Chunk Text
def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> List[str]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += (chunk_size - overlap)
    return chunks

# Helper: Get User ID from Header
def get_user_id(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization Header")
    try:
        token = authorization.replace("Bearer ", "")
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid Token")
        return user.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Auth Error: {str(e)}")

@app.get("/api/health")
def health_check():
    return {"status": "ok", "engine": "cortex-v1"}

@app.post("/api/chat")
async def chat_endpoint(request: ChatRequest, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    
    if not groq_client:
        raise HTTPException(status_code=500, detail="Groq Client not initialized")

    # 1. Embed query
    query_embedding = get_embedding(request.message)
    
    # 2. Search Vector DB
    matches = []
    try:
        rpc_params = {
            "query_embedding": query_embedding,
            "match_threshold": 0.5, 
            "match_count": 5,
            "filter_user_id": user_id 
        }
        
        response = supabase.rpc("match_documents", rpc_params).execute()
        matches = response.data
    except Exception as e:
        print(f"Vector search failed: {e}")
        # Continue without context if vector search fails

    # 3. Construct Context
    context_text = ""
    sources = []
    
    if matches:
        for match in matches:
            content = match.get('content', '')
            meta = match.get('source_metadata', {}) # From the joined query
            source = meta.get('source', 'Unknown') if meta else 'Unknown'
            
            context_text += f"---\nSource: {source}\nContent: {content}\n"
            if source not in sources:
                sources.append(source)
    
    # 4. Generate Response with Groq
    system_instruction = (
        "You are Cortex, an enterprise AI assistant. "
        "Answer the user query based ONLY on the provided Context below. "
        "If the answer is not in the context, say you don't know but offer general knowledge if permitted. "
        "Cite sources using [Source Name]."
    )
    
    messages = [
        {"role": "system", "content": system_instruction},
        {"role": "user", "content": f"Context Data:\n{context_text}\n\nUser Query: {request.message}"}
    ]

    completion = groq_client.chat.completions.create(
        messages=messages,
        model="llama3-70b-8192", 
        temperature=0.1,
    )
    
    return {
        "response": completion.choices[0].message.content,
        "sources": sources
    }

@app.post("/api/upload")
async def upload_document(file: UploadFile = File(...), authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    
    content = ""
    
    # Parse File
    try:
        if file.filename.lower().endswith(".pdf"):
            pdf_bytes = await file.read()
            pdf_reader = PdfReader(io.BytesIO(pdf_bytes))
            for page in pdf_reader.pages:
                extract = page.extract_text()
                if extract:
                    content += extract + "\n"
        else:
            # Assume text/md
            content = (await file.read()).decode("utf-8")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process file: {str(e)}")
        
    if not content.strip():
        raise HTTPException(status_code=400, detail="Empty document")

    # 1. Create Document Entry
    doc_metadata = {
        "source": file.filename,
        "type": "document",
        "size": f"{len(content)/1024:.1f}KB"
    }
    
    try:
        doc_insert = supabase.table("documents").insert({
            "user_id": user_id,
            "content": content, # Optional: storing full content
            "metadata": doc_metadata
        }).execute()
        
        if not doc_insert.data:
            raise HTTPException(status_code=500, detail="Failed to create document record")
            
        document_id = doc_insert.data[0]['id']

        # 2. Chunk and Embed
        chunks = chunk_text(content)
        
        for i, chunk in enumerate(chunks):
            embedding = get_embedding(chunk)
            
            section_data = {
                "document_id": document_id,
                "content": chunk,
                "embedding": embedding
            }
            supabase.table("document_sections").insert(section_data).execute()
            
        return {"status": "success", "chunks_processed": len(chunks), "filename": file.filename}
        
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/crawl")
async def crawl_url(request: CrawlRequest, authorization: str = Header(None)):
    user_id = get_user_id(authorization)
    
    try:
        resp = requests.get(request.url, timeout=10)
        soup = BeautifulSoup(resp.content, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style"]):
            script.decompose()
            
        text = soup.get_text()
        
        # Clean text
        lines = (line.strip() for line in text.splitlines())
        chunks = (phrase.strip() for line in lines for phrase in line.split("  "))
        content = '\n'.join(chunk for chunk in chunks if chunk)
        
        title = soup.title.string if soup.title else request.url

        # 1. Create Document Entry
        doc_metadata = {
            "source": request.url,
            "type": "url",
            "title": title
        }
        
        doc_insert = supabase.table("documents").insert({
            "user_id": user_id,
            "content": content,
            "metadata": doc_metadata
        }).execute()
        
        if not doc_insert.data:
            raise Exception("Failed to create document record")
            
        document_id = doc_insert.data[0]['id']
        
        # 2. Chunk and Embed
        text_chunks = chunk_text(content)
        
        for i, chunk in enumerate(text_chunks):
            embedding = get_embedding(chunk)
            
            section_data = {
                "document_id": document_id,
                "content": chunk,
                "embedding": embedding
            }
            supabase.table("document_sections").insert(section_data).execute()

        return {"status": "success", "url": request.url}

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Crawl failed: {str(e)}")