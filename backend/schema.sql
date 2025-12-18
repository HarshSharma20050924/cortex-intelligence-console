-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Table to store document metadata
create table if not exists documents (
  id bigserial primary key,
  content text, -- Optional: store full text or just use sections
  metadata jsonb, -- Store filename, upload date, etc.
  created_at timestamptz default now()
);

-- Table to store document chunks and their embeddings
create table if not exists document_sections (
  id bigserial primary key,
  document_id bigint references documents(id) on delete cascade,
  content text, -- The actual chunk of text
  embedding vector(768) -- Gemini embedding-001 is 768 dimensions
);

-- Search function for Semantic Search (RPC)
create or replace function match_documents (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    document_sections.id,
    document_sections.content,
    1 - (document_sections.embedding <=> query_embedding) as similarity
  from document_sections
  where 1 - (document_sections.embedding <=> query_embedding) > match_threshold
  order by document_sections.embedding <=> query_embedding
  limit match_count;
end;
$$;