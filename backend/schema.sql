-- IMPORTANT: Run this entire script in the Supabase SQL Editor to fix your database schema.

-- 1. Enable Extensions
create extension if not exists vector;

-- 2. Fix 'documents' table (Schema Migration)
create table if not exists documents (
  id bigserial primary key,
  created_at timestamptz default now(),
  content text,
  metadata jsonb
);

-- Ensure user_id exists (Fixes the 400 Error)
do $$ 
begin 
  if not exists (select 1 from information_schema.columns where table_name = 'documents' and column_name = 'user_id') then
    alter table documents add column user_id uuid references auth.users;
  end if;
end $$;

-- Make sure RLS is enabled
alter table documents enable row level security;
drop policy if exists "Users manage own documents" on documents;
create policy "Users manage own documents" on documents for all using (auth.uid() = user_id);


-- 3. Fix 'document_sections' table
create table if not exists document_sections (
  id bigserial primary key,
  document_id bigint references documents(id) on delete cascade,
  content text,
  embedding vector(768)
);

alter table document_sections enable row level security;
drop policy if exists "Users manage own document sections" on document_sections;
create policy "Users manage own document sections" on document_sections for all using (
  exists (select 1 from documents where id = document_sections.document_id and user_id = auth.uid())
);


-- 4. Conversations & Messages (Safety Checks)
create table if not exists conversations (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  title text default 'New Intelligence Session',
  workspace_id text default 'personal',
  created_at timestamptz default now()
);

create table if not exists messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references conversations on delete cascade not null,
  role text check (role in ('user', 'system')),
  content text not null,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table conversations enable row level security;
alter table messages enable row level security;

drop policy if exists "Users manage own conversations" on conversations;
create policy "Users manage own conversations" on conversations for all using (auth.uid() = user_id);

drop policy if exists "Users manage own messages" on messages;
create policy "Users manage own messages" on messages for all using (
  exists (select 1 from conversations where id = messages.conversation_id and user_id = auth.uid())
);


-- 5. Search Function (RPC) - Drop and Recreate to ensure correct parameter signature
drop function if exists match_documents;

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