
#  Cortex Intelligence Console

A high-performance, private knowledge synthesis engine built for enterprise environments. Cortex allows you to ingest proprietary data (PDFs, text files) and external web sources into a secure vector store, then query it using Retrieval-Augmented Generation (RAG) for accurate, citation-backed answers.

![Architecture](https://img.shields.io/badge/Architecture-Serverless_RAG-blue) ![Frontend](https://img.shields.io/badge/Frontend-React_19/TypeScript-61dafb) ![Backend](https://img.shields.io/badge/Backend-Python_FastAPI-009688) ![Database](https://img.shields.io/badge/Database-Supabase_PostgreSQL-3ecf8e)

**Live Demo**: [cortex-intelligence-console.vercel.app](https://cortex-intelligence-console.vercel.app)

##  Features

- **Private Knowledge Base**: Securely upload and embed your PDFs and text documents.
- **Web Intelligence**: Crawl and ingest content from any public URL.
- **Smart Chat Interface**: Ask questions in natural language and get answers grounded in your private data with source citations.
- **Enterprise-Ready Architecture**: Built with serverless principles, JWT authentication, and full audit logging.
- **Blazing Fast Inference**: Powered by Groq's LPU Inference Engine for near-instant responses.

##  System Architecture

Cortex is built on a modern, decoupled stack:

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS | Responsive UI with "Dark Enterprise" design |
| **Backend API** | Python (FastAPI) | Serverless functions hosted on Vercel |
| **Database & Auth** | Supabase (PostgreSQL + Auth) | User data, chat history, and pgvector store |
| **Embeddings** | Google Gemini (`text-embedding-004`) | State-of-the-art 768-dimension vectors |
| **LLM** | Groq (`llama-3.3-70b-versatile`) | High-speed, open-source model inference |

## Quick Start

### Prerequisites

- Node.js 18.x or higher
- Python 3.9+
- A [Supabase](https://supabase.com) account (free tier works)
- API keys for [Google AI Studio](https://makersuite.google.com/app/apikey) and [Groq](https://console.groq.com/keys)

### 1. Clone & Setup

```bash
# Clone the repository
git clone https://github.com/HarshSharma20050924/cortex-intelligence-console.git
cd cortex-intelligence-console

# Install frontend dependencies
npm install

# Install Python backend dependencies
pip install -r requirements.txt
```

### 2. Database Setup (Supabase)

1. Create a new Supabase project
2. Enable the `pgvector` extension in the SQL editor:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
3. Run the schema setup from `backend/schema.sql` to create the necessary tables and the `match_documents` function.
4. Copy your Supabase URL and keys from Project Settings → API.

### 3. Environment Configuration

Create a `.env` file in the project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# AI Service Keys
API_KEY=your-google-gemini-api-key
GROQ_API_KEY=your-groq-api-key
```

### 4. Local Development

```bash
# Start the frontend development server (Vite)
npm run dev

# In a separate terminal, start the backend server
cd backend
uvicorn main:app --reload --port 8000
```

The application will be available at `http://localhost:3000`.

### 5. Deploy to Production

Cortex is configured for seamless deployment on Vercel:

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

The `vercel.json` file already contains the proper routing configuration to handle both frontend and backend API routes.

## 🗄️ Database Schema

The system uses four main tables in Supabase:

1. **`documents`**: Stores text chunks, metadata, and vector embeddings
2. **`conversations`**: Tracks chat session metadata
3. **`messages`**: Stores all chat messages with role and content
4. **`audit_logs`**: Records all user actions for compliance

Key PostgreSQL function for vector search:
```sql
-- The match_documents function enables semantic search
SELECT * FROM match_documents(
  query_embedding => '[0.1, 0.2, ...]'::vector(768),
  match_threshold => 0.7,
  match_count => 5
);
```

##  API Reference

### `POST /api/chat`
**Purpose**: Main RAG query endpoint
**Payload**: `{"message": "Your question here"}`
**Response**:
```json
{
  "response": "Answer based on your documents...",
  "sources": ["document.pdf", "https://example.com"]
}
```

### `POST /api/upload`
**Purpose**: Process and embed uploaded documents
**Payload**: `multipart/form-data` with file
**Response**: `{"status": "success", "chunks": 42}`

### `POST /api/crawl`
**Purpose**: Ingest content from a URL
**Payload**: `{"url": "https://example.com"}`
**Response**: `{"status": "success", "chunks": 15}`

##  RAG Pipeline Details

When you ask a question, Cortex:

1. **Embeds your query** using Google's `text-embedding-004`
2. **Performs similarity search** in the vector database for the top 5 relevant chunks
3. **Constructs a context-aware prompt** with the retrieved information
4. **Generates a response** using Groq's Llama 3.3 (70B) with citations
5. **Logs the interaction** for audit and improvement

## Project Structure

```
cortex-intelligence-console/
├── api/                    # Vercel serverless API routes
├── backend/               # Python FastAPI backend
├── components/            # React components
│   ├── ChatInterface.tsx  # Main chat component
│   ├── KnowledgePanel.tsx # Document management
│   └── Cursor.tsx         # Custom interactive cursor
├── lib/                   # Utility functions
├── public/                # Static assets
├── .github/workflows/     # CI/CD configuration
├── requirements.txt       # Python dependencies
├── vercel.json           # Deployment configuration
└── vite.config.ts        # Build configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Google Gemini](https://deepmind.google/technologies/gemini/) for embedding capabilities
- [Groq](https://groq.com/) for ultra-fast LLM inference
- [Supabase](https://supabase.com/) for the complete backend platform
- [Vercel](https://vercel.com/) for seamless deployment

---

**Note**: This project is actively maintained. If you encounter any issues, please check the [GitHub Issues](https://github.com/HarshSharma20050924/cortex-intelligence-console/issues) page or create a new issue.

---

I hope this comprehensive `README.md` accurately reflects your project and provides clear instructions for users. The key improvement is the detailed setup and configuration section, which was missing from the existing documentation.
