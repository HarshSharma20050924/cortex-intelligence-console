-- 1. Conversation History
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text default 'New Intelligence Session',
  workspace_id text default 'personal',
  created_at timestamptz default now()
);

-- 2. Messages Table
create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations on delete cascade not null,
  role text check (role in ('user', 'system')),
  content text not null,
  metadata jsonb, -- For sources/citations
  created_at timestamptz default now()
);

-- 3. Audit Logs (Enterprise Compliance)
create table if not exists audit_logs (
  id bigserial primary key,
  user_id uuid references auth.users not null,
  action text not null, -- e.g., 'UPLOAD', 'CHAT', 'CRAWL'
  details text,
  timestamp timestamptz default now()
);

-- Enable RLS for all
alter table conversations enable row level security;
alter table messages enable row level security;
alter table audit_logs enable row level security;

-- Policies for History
create policy "Users manage own conversations" on conversations for all using (auth.uid() = user_id);
create policy "Users manage own messages" on messages for all using (
  exists (select 1 from conversations where id = messages.conversation_id and user_id = auth.uid())
);


-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- 4. Documents Table (Metadata & ACL)
-- UPDATED: Added user_id for RLS and ownership
create table if not exists documents (
  id bigserial primary key,
  user_id uuid references auth.users not null,
  content text, -- Optional: store full text
  metadata jsonb, -- Store filename, upload date, type (url/file)
  created_at timestamptz default now()
);

-- 5. Document Sections (Chunks & Embeddings)
create table if not exists document_sections (
  id bigserial primary key,
  document_id bigint references documents(id) on delete cascade,
  content text, -- The actual chunk of text
  embedding vector(768) -- Gemini embedding-004 is 768 dimensions
);

-- Enable RLS for Documents
alter table documents enable row level security;
alter table document_sections enable row level security;

create policy "Users manage own documents" on documents for all using (auth.uid() = user_id);
create policy "Users manage own document sections" on document_sections for all using (
  exists (select 1 from documents where id = document_sections.document_id and user_id = auth.uid())
);

-- 6. Search Function for Semantic Search (RPC)
-- UPDATED: Added filter_user_id and JOIN with documents table
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  filter_user_id uuid
)
returns table (
  id bigint,
  content text,
  similarity float,
  source_metadata jsonb
)
language plpgsql
as $$
begin
  return query
  select
    document_sections.id,
    document_sections.content,
    1 - (document_sections.embedding <=> query_embedding) as similarity,
    documents.metadata as source_metadata
  from document_sections
  join documents on document_sections.document_id = documents.id
  where 1 - (document_sections.embedding <=> query_embedding) > match_threshold
  and documents.user_id = filter_user_id
  order by document_sections.embedding <=> query_embedding
  limit match_count;
end;
$$;