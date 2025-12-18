import os
import google.generativeai as genai
from groq import Groq
from supabase import create_client, Client
from dotenv import load_dotenv
import requests
from bs4 import BeautifulSoup
import time

load_dotenv()

# Configuration
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not all([SUPABASE_URL, SUPABASE_KEY, GOOGLE_API_KEY, GROQ_API_KEY]):
    print("Error: Missing environment variables. Please check backend/.env")

# Initialize Clients
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
genai.configure(api_key=GOOGLE_API_KEY)
groq_client = Groq(api_key=GROQ_API_KEY)

class RAGService:
    def __init__(self):
        self.embedding_model = "models/text-embedding-004"
        self.llm_model = "llama-3.3-70b-versatile"

    def split_text(self, text: str, chunk_size: int = 1000, overlap: int = 200):
        """
        Simple overlapping chunk splitter to keep context.
        """
        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start += chunk_size - overlap
        
        return chunks

    def get_embedding(self, text: str, task_type: str = "retrieval_document", title: str = ""):
        """
        Generates embeddings using Gemini's text-embedding-004.
        """
        # Clean text to avoid newlines breaking basic embedding calls
        clean_text = text.replace("\n", " ")
        
        try:
            # text-embedding-004 supports retrieval_document and retrieval_query task types
            result = genai.embed_content(
                model=self.embedding_model,
                content=clean_text,
                task_type=task_type,
                title=title if task_type == "retrieval_document" else None
            )
            return result['embedding']
        except Exception as e:
            print(f"Embedding Error: {e}")
            raise e

    def ingest_file(self, user_id: str, filename: str, content: str):
        """
        Processes a file, chunks it, embeds it, and stores it in Supabase.
        """
        print(f"Ingesting file: {filename} for user: {user_id}")
        
        chunks = self.split_text(content)
        
        for i, chunk in enumerate(chunks):
            # Generate embedding
            # We add a small delay to avoid hitting strict per-second rate limits on free tier
            time.sleep(0.5) 
            
            embedding = self.get_embedding(
                chunk, 
                task_type="retrieval_document",
                title=filename
            )

            # Insert into Supabase
            data = {
                "user_id": user_id,
                "content": chunk,
                "metadata": {
                    "source": filename, 
                    "type": "document",
                    "chunk_index": i
                },
                "embedding": embedding
            }
            
            supabase.table("documents").insert(data).execute()
            
        return {"status": "success", "chunks_processed": len(chunks)}

    def ingest_url(self, user_id: str, url: str):
        """
        Scrapes a URL, processes text, embeds, and stores.
        """
        print(f"Crawling URL: {url}")
        
        try:
            response = requests.get(url, headers={"User-Agent": "Cortex-Bot/1.0"})
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Remove scripts and styles
            for script in soup(["script", "style"]):
                script.decompose()
                
            text = soup.get_text()
            # Clean up whitespace
            lines = (line.strip() for line in text.splitlines())
            clean_text = '\n'.join(chunk for chunk in lines if chunk)
            
            title = soup.title.string if soup.title else url
            
            return self.ingest_file(user_id, title, clean_text)
            
        except Exception as e:
            print(f"Crawl failed: {e}")
            raise Exception(f"Failed to crawl URL: {str(e)}")

    def chat(self, user_id: str, message: str):
        """
        RAG Pipeline:
        1. Embed User Query
        2. Search Vector DB
        3. Synthesize Answer with Groq
        """
        
        # 1. Embed Query
        query_embedding = self.get_embedding(
            message, 
            task_type="retrieval_query"
        )

        # 2. Search Supabase (RPC call)
        # Ensure you have the 'match_documents' function in Supabase
        response = supabase.rpc(
            "match_documents",
            {
                "query_embedding": query_embedding,
                "match_threshold": 0.5, # Lowered slightly for better recall
                "match_count": 5,
                "filter_user_id": user_id
            }
        ).execute()
        
        matches = response.data
        
        context_str = ""
        sources = []
        
        if matches:
            for match in matches:
                context_str += f"---\nSource: {match['metadata'].get('source', 'Unknown')}\nContent: {match['content']}\n"
                sources.append({"title": match['metadata'].get('source', 'Unknown')})

        # 3. Generate Response
        system_prompt = f"""You are Cortex, an advanced private intelligence assistant.
        Use the following Context to answer the User Query.
        
        Rules:
        1. Only use the provided Context. If the answer isn't there, say "I don't have that information in my knowledge base."
        2. Be professional, concise, and architectural in tone.
        3. Cite your sources implicitly if possible.
        
        Context:
        {context_str}
        """

        completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            model=self.llm_model,
            temperature=0.1, # Low temperature for factual accuracy
        )

        return {
            "response": completion.choices[0].message.content,
            "sources": sources
        }

rag_service = RAGService()