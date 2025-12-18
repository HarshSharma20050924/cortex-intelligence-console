from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from rag import rag_service
from supabase import create_client, Client
import os
import io
from pypdf import PdfReader
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Cortex Enterprise API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Supabase for Auth Verification
supabase: Client = create_client(
    os.getenv("SUPABASE_URL"),
    os.getenv("SUPABASE_KEY")
)

# Dependency: Verify JWT Token and return User ID
def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authentication Token")
    
    try:
        # Expected format: "Bearer <token>"
        token = authorization.split(" ")[1]
        user = supabase.auth.get_user(token)
        
        if not user or not user.user:
             raise HTTPException(status_code=401, detail="Invalid Authentication Token")
             
        return user.user.id
    except Exception as e:
        print(f"Auth Error: {e}")
        raise HTTPException(status_code=401, detail="Authentication Failed")

class ChatRequest(BaseModel):
    message: str

class UrlRequest(BaseModel):
    url: str

@app.get("/")
def read_root():
    return {"status": "Cortex Neural Link Active"}

@app.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    user_id: str = Depends(get_current_user)
):
    try:
        content_bytes = await file.read()
        filename = file.filename.lower() if file.filename else "unknown"
        text_content = ""

        # Handle PDF Files
        if filename.endswith(".pdf"):
            try:
                pdf_file = io.BytesIO(content_bytes)
                reader = PdfReader(pdf_file)
                for page in reader.pages:
                    extract = page.extract_text()
                    if extract:
                        text_content += extract + "\n"
            except Exception as e:
                print(f"PDF Parse Error: {e}")
                raise HTTPException(status_code=400, detail="Failed to parse PDF file. Ensure it is not corrupted or password protected.")
        
        # Handle Text/Code Files
        else:
            try:
                text_content = content_bytes.decode("utf-8")
            except UnicodeDecodeError:
                # Fallback for older encodings
                try:
                    text_content = content_bytes.decode("latin-1")
                except Exception:
                    raise HTTPException(status_code=400, detail="File encoding not supported. Please upload UTF-8 text or PDF.")

        if not text_content.strip():
             raise HTTPException(status_code=400, detail="File is empty or could not extract readable text.")

        # Send to RAG Engine
        return rag_service.ingest_file(user_id, file.filename or "uploaded_file", text_content)

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Upload Error: {e}")
        raise HTTPException(status_code=500, detail=f"Server Error during processing: {str(e)}")

@app.post("/crawl")
def crawl_url(
    request: UrlRequest,
    user_id: str = Depends(get_current_user)
):
    try:
        return rag_service.ingest_url(user_id, request.url)
    except Exception as e:
        print(f"Crawl Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat")
def chat_endpoint(
    request: ChatRequest,
    user_id: str = Depends(get_current_user)
):
    try:
        return rag_service.chat(user_id, request.message)
    except Exception as e:
        print(f"Chat Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)