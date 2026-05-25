# Sistema de Administração - DogDex

## Resumo

Foi implementado um sistema completo de administração que permite apenas usuários com role de **admin** realizarem as seguintes operações:

### Funcionalidades do Admin

1. **CRUD de Dogs (Cães/Pokémon)**
   - ✅ Criar novos cães
   - ✅ Editar cães existentes
   - ✅ Deletar cães (soft delete - marca como inativo)
   - ✅ Listar todos os cães (incluindo inativos)

2. **Gerenciamento de QR Codes**
   - ✅ Gerar novos QR codes para cada cão
   - ✅ Adicionar labels e dicas de localização
   - ✅ Desativar QR codes
   - ✅ Copiar tokens para clipboard

3. **Captura de Pokémon**
   - ✅ Sistema de QR code scanner já existente
   - ✅ Modo de captura ao escanear QR code
   - ✅ Desbloqueio de informações do cão ao capturar

## Arquitetura

### Backend (Supabase/PostgreSQL)

- **Migration**: `20250525120003_add_admin_roles.sql`
  - Adiciona enum `user_role` (user | admin)
  - Adiciona coluna `role` à tabela `profiles`
  - Define políticas RLS (Row Level Security) para:
    - Leitura de dogs: todos autenticados
    - Inserção de dogs: apenas admin
    - Atualização de dogs: apenas admin
    - Deleção de dogs: apenas admin
    - Operações em QR codes: mesmo padrão

- **Funções RPC existentes**:
  - `resolve_qr_encounter(token)`: Resolve QR code e retorna dados do encontro
  - `attempt_capture(token, biscuit_type)`: Tenta capturar o cão

### Frontend (React/TypeScript)

**Tipos** (`src/types/database.ts`):
- `UserRole`: "user" | "admin"
- `Dog`: Interface completa do Dog
- `DogQRCode`: Interface do QR code
- `Profile`: Interface do perfil com role

**Hooks** (`src/hooks/useUserRole.ts`):
- `useUserRole()`: Hook para verificar role do usuário
- Retorna: `role`, `isAdmin`, `loading`, `error`, `setAdminRole()`

**Serviços** (`src/services/dogService.ts`):
- `listDogs()`: Lista dogs ativos
- `listAllDogs()`: Lista todos os dogs (incluindo inativos)
- `getDog(id)`: Obtém um dog específico
- `createDog(input)`: Cria novo dog
- `updateDog(input)`: Atualiza dog
- `deactivateDog(id)`: Marca como inativo
- `createQRCode(input)`: Gera novo QR code
- `getDogQRCodes(dog_id)`: Lista QR codes de um dog
- `deactivateQRCode(id)`: Desativa QR code

**Componentes**:
- `AdminDogPanel.tsx`: Painel de CRUD com tabela e formulário modal
- `AdminQRManagement.tsx`: Gerenciamento de QR codes (modal)
- `AdminRoute.tsx`: Componente de proteção de rota (verifica admin)
- `AdminPage.tsx`: Página principal do admin

**Rota**:
- `/admin`: Página protegida do admin (requer autenticação + role admin)

## Como Usar

### 1. Atualizar Banco de Dados

Execute a migration no Supabase:
```sql
-- No SQL Editor do Supabase
-- Run: supabase/migrations/20250525120003_add_admin_roles.sql
```

### 2. Promover Usuário para Admin

No Supabase SQL Editor:
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'UUID_DO_USUARIO';
```

Ou use o hook `setAdminRole()` no código (se implementado UI).

### 3. Acessar Painel de Admin

1. Fazer login como usuário admin
2. Navegar para `/admin`
3. O painel abrirá automaticamente se for admin, caso contrário redireciona para `/`

### 4. Criar um Dog

1. Clique em "Novo Dog"
2. Preencha o formulário:
   - Dex Number (obrigatório, único)
   - Nome (obrigatório)
   - Slug (auto-formatado, obrigatório, único)
   - Raça
   - Idade
   - Descrição
   - Personalidade
   - Raridade
   - Emoji
   - URLs de imagem (sprite, silhueta, imagem grande)
3. Clique em "Criar"

### 5. Gerar QR Code para um Dog

1. Na tabela de dogs, clique em "QR Codes" (ícone de QR)
2. Clique em "Gerar QR Code"
3. (Opcional) Adicione label e dica de localização
4. Clique em "Gerar QR Code"
5. O token será mostrado - copie se necessário

### 6. Escanear QR Code e Capturar

1. Usuário comum escaneia o QR code no app (`/app` ou `/dogdex`)
2. Entra no modo de captura
3. Escolhe qual biscoito usar (normal ou premium)
4. Se capturar com sucesso, desbloqueia informações do cão na DogDex

## Fluxo Completo

```
Admin (role=admin)
    ↓
Cria novo Dog + QR Code
    ↓
Compartilha QR Code
    ↓
User (role=user)
    ↓
Escaneia QR Code na app
    ↓
Entra em modo Captura
    ↓
Captura o dog com sucesso
    ↓
Desbloqueia nome, descrição e imagem na DogDex
```

## Segurança

- ✅ Row Level Security (RLS) garante que:
  - Usuários só podem ler dogs ativos
  - Apenas admins podem criar/editar/deletar dogs
  - Apenas admins podem gerenciar QR codes

- ✅ Autenticação necessária para:
  - Escanear QR codes
  - Capturar pokémon
  - Acessar painel de admin

- ✅ No front-end:
  - Redirecionamento automático se não for admin
  - Hidden buttons/UI se não tiver permissão

## Próximos Passos (Opcional)

- [ ] UI para promover usuários a admin no painel
- [ ] Dashboard com estatísticas (captures, scans, etc)
- [ ] Histórico de tentativas de captura
- [ ] Reeditar descrição/temas quando errado

## Arquivos Criados/Modificados

### Criados
- `supabase/migrations/20250525120003_add_admin_roles.sql`
- `src/types/database.ts` (adicionado types)
- `src/hooks/useUserRole.ts` (novo)
- `src/services/dogService.ts` (novo/expandido)
- `src/components/AdminDogPanel.tsx` (novo)
- `src/components/AdminQRManagement.tsx` (novo)
- `src/components/auth/AdminRoute.tsx` (novo)
- `src/pages/admin/AdminPage.tsx` (novo)

### Modificados
- `src/App.tsx` (adicionada rota /admin)

## Testando Localmente

```bash
# 1. Aplicar migration no Supabase
# 2. Promover seu usuário:
UPDATE public.profiles SET role = 'admin' WHERE id = 'seu-user-id';

# 3. Fazer login
# 4. Acessar /admin
# 5. Criar dogs e QR codes
# 6. Testar escanear com outro usuário
```

---

**Status**: ✅ Implementado e pronto para uso
