# Campus Canine Collector

SPA React + Supabase. Colecione doguinhos do campus escaneando QR Codes na coleira.

## Rodar

```bash
cp .env.example .env
# Preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no .env

npm install
npm run dev
```

Abre `http://localhost:8080`.

> **Nota:** O guia do Supabase com `NEXT_PUBLIC_*`, `middleware.ts` e `utils/supabase/server.ts` é para **Next.js**. Este repo é **Vite + React** — o cliente fica em `src/lib/supabase.ts` com variáveis `VITE_*`.

## Funcionalidades

- **Auth:** cadastro, login, recuperação de senha, verificação de e-mail, Google (Supabase Auth)
- **Scanner:** câmera em tempo real + código manual `CAMPUS-001` … `012`
- **Encontro:** tela estilo Pokémon, escolha de biscoito, barra de chance, animação de “shake”, sucesso/falha/shiny
- **DogDex:** entradas ocultas (`?????` + silhueta), capturados desbloqueados, modal com evolução e histórico
- **Biscoitos:** HUD sempre visível, reset diário (normal) e semanal (premium)

## Modo local (sem tabelas no Supabase)

Com auth configurado, o jogo usa **localStorage** automaticamente se as RPC/tabelas falharem, ou defina:

```env
VITE_GAME_MODE=local
```

## Banco de dados

Scripts SQL opcionais em `supabase/migrations/` — só rode se quiser persistência no Supabase.
