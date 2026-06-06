# Banco de dados

O schema oficial está em **`supabase/migrations/`**, no padrão do seu projeto Supabase (`public.*`, `auth.users`, `timestamptz`, `uuid`).

## Como aplicar

No **SQL Editor** do Supabase, execute **um arquivo só**:

**`supabase/full_schema.sql`** (schema + funções + seed completo)

Ou, se preferir em partes, os arquivos em `supabase/migrations/` na ordem numérica.

A tabela `public.todos` existente **não é alterada**.

## Auth

Cadastro, login, Google, reset de senha e verificação de e-mail usam **Supabase Auth** (`auth.users`). O app usa `public.profiles` + trigger `handle_new_user`.

No dashboard Supabase: **Authentication → Providers → Google** (e Redirect URLs do seu frontend).

## Variáveis no frontend

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Copie de `.env.example`.
