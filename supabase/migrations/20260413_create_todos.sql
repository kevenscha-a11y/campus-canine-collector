create extension if not exists pgcrypto;

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.todos enable row level security;

grant select on table public.todos to anon, authenticated;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'todos'
      and policyname = 'Allow public read access'
  ) then
    create policy "Allow public read access"
      on public.todos
      for select
      to anon, authenticated
      using (true);
  end if;
end $$;
