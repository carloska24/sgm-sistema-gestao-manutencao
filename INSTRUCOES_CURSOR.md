# 🤖 Instruções para o Cursor AI - SGM

## O Que é Este Projeto?

**SGM** = Sistema de Gestão de Manutenção (Maintenance Management System)

Uma aplicação full-stack para gerenciar:
- ✅ Manutenção Preventiva, Corretiva e Preditiva
- ✅ Equipamentos (cadastro e histórico)
- ✅ Checklists de manutenção (com IA)
- ✅ Chamados e ordens de serviço
- ✅ Planos de manutenção

---

## Como Usar o Cursor Neste Projeto

### 1. Ao Abrir o Projeto

O Cursor vai ler:
- `.cursorrules` - Regras e padrões do projeto
- `.cursorignore` - Arquivos a ignorar
- Este arquivo - Instruções especiais

**O que o Cursor já sabe:**
- Estrutura do projeto (Next.js + Express)
- Stack tecnológico (TypeScript, Tailwind, SQLite)
- Convenções de código
- Segurança (não commitir .env)

### 2. Fazer Perguntas ao Cursor

**Boas perguntas:**
```
"Quero adicionar um novo campo 'situação' no equipamento. 
O campo deve ter valores: ativo, inativo, manutenção.
Preciso atualizar: banco de dados, backend, frontend."

"Como estruturo um novo formulário no padrão deste projeto?"

"Qual é o padrão de nomeação de componentes aqui?"
```

**Perguntas ruins:**
```
"Fazer um campo" ← Muito vago

"Adicionar funcionalidade" ← Sem contexto
```

### 3. Quando Pedir Ajuda

**Contexto que ajuda:**
```
Arquivo: nextjs-frontend/app/equipment/page.tsx
Linha: 45-60
Erro: 'photo_url' is not defined

Tenho este código:
[COLE O CÓDIGO]

Quero fazer isto:
[DESCREVA O QUE QUER]

Esperado: [O QUE DEVERIA ACONTECER]
Atual: [O QUE ESTÁ ACONTECENDO]
```

---

## Estrutura Rápida

### Backend (`backend/`)
```
routes/
├── auth.js          → Login/logout (JWT)
├── users.js         → Usuários (inclui photo_url)
├── equipment.js     → Equipamentos
├── checklists.js    → Checklists
├── maintenance.js   → Ordens de manutenção
└── calls.js         → Chamados/Kanban

middleware/
├── auth.js          → JWT verificação

database.js         → SQLite setup + queries
server.js           → Express app
```

### Frontend (`nextjs-frontend/`)
```
app/
├── dashboard/       → Dashboard principal
├── equipment/       → Gerenciar equipamentos
├── checklists/      → Ver checklists (card-by-card)
├── maintenance/     → Ordens de manutenção
├── users/[id]/edit/ → Editar perfil + foto
└── login/           → Autenticação

components/
├── layout/
│   ├── Header.tsx   → Topo com avatar do user
│   └── Sidebar.tsx  → Menu esquerdo
└── ...

contexts/
├── AuthContext.tsx  → User + reloadUser()
└── LayoutContext.tsx

lib/
├── api.ts           → API client com cache
└── cache.ts         → Cache utility
```

---

## Padrões Importantes

### Backend Route
```javascript
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    // 1. Buscar dados
    const data = await get('SELECT ... FROM ...', [req.params.id]);
    
    // 2. Validar
    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Não encontrado'
      });
    }
    
    // 3. Responder
    res.json({
      success: true,
      data: data
    });
  } catch (error) {
    next(error);
  }
});
```

### Frontend Component
```typescript
'use client';

import { useState, useEffect } from 'react';
import { fetchData } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import MainLayout from '@/components/layout/MainLayout';

export default function Page() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const result = await fetchData('/endpoint');
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      {/* Seu conteúdo */}
    </MainLayout>
  );
}
```

---

## Segurança - MUITO IMPORTANTE

### ❌ NUNCA fazer:
```typescript
const API_KEY = "sk-12345"; // ❌ Secret no código!
const DB_PASSWORD = "senha"; // ❌ No código!

// Usar assim:
const API_KEY = process.env.GEMINI_API_KEY; // ✅ Variável de ambiente
```

### ✅ SEMPRE fazer:
```bash
# Verificar antes de commit
git status  # .env NÃO deve aparecer

# Usar .env.example para documentar
# backend/env.example (com valores de exemplo)

# Nunca fazer:
git add .env
git push  # .env está no .gitignore automaticamente
```

---

## Funcionalidades Recentes Implementadas

### 1. Upload de Foto de Perfil
- **Arquivo**: `nextjs-frontend/app/users/[id]/edit/page.tsx`
- **Backend**: Suporta campo `photo_url` (LONGTEXT)
- **Feature**: Compressão automática de imagem
- **Auth**: `reloadUser()` no AuthContext após salvar
- **Display**: Avatar no Header com fallback a iniciais

### 2. Checklist Card-by-Card
- **Arquivo**: `nextjs-frontend/app/checklists/page.tsx`
- **Display**: Um card por vez, navegação horizontal
- **Controle**: Setas, teclado (esquerda/direita), quantidade de itens
- **UX**: Snap scroll, indicador visual

### 3. Cabeçalho Moderno
- **Arquivo**: `nextjs-frontend/components/layout/Header.tsx`
- **Avatar**: Mostra foto do usuário ou primeira letra do nome
- **Menu**: Dropdown com opções de perfil e logout
- **Status**: Indicador de usuário online

---

## Tarefas Comuns

### Adicionar um Campo no Banco
```javascript
// backend/database.js
db.run(`ALTER TABLE equipamentos ADD COLUMN novo_campo TEXT`, () => {});
```

### Chamar API do Backend
```typescript
// Frontend
const data = await fetchData('/equipamentos/123');
const result = await postData('/equipamentos', { nome: 'Novo' });
await putData('/equipamentos/123', { nome: 'Atualizado' });
```

### Validar com Zod
```javascript
// Backend
const createSchema = z.object({
  nome: z.string().min(3),
  status: z.enum(['ativo', 'inativo']),
  foto: z.string().optional()
});

const data = createSchema.parse(req.body);
```

### Componente Reutilizável
```typescript
// nextjs-frontend/components/ui/Card.tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export default function Card({ title, children, className }: CardProps) {
  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

---

## Debugging com Cursor

### Quando Há Erro

**Forneça ao Cursor:**
1. Nome do arquivo
2. Mensagem de erro completa
3. Linhas de código envolvidas
4. O que estava tentando fazer

**Exemplo:**
```
Arquivo: backend/routes/users.js
Erro: TypeError: Cannot read property 'photo_url' of undefined
Código:
  const user = await get('SELECT id, username FROM users WHERE id = ?', [userId]);
  console.log(user.photo_url); // ← Erro aqui

O que estava tentando: Retornar a foto do usuário
```

### Verificações Comuns

```bash
# Backend rodando?
curl http://localhost:3001/api/

# Frontend rodando?
Open http://localhost:3000

# .env criado?
cat backend/.env
cat nextjs-frontend/.env.local

# Banco de dados existe?
ls -la backend/sgm.db

# Dependências instaladas?
ls backend/node_modules
```

---

## Tecnologias Chave

| Tecnologia | Uso | Documentação |
|-----------|-----|--------------|
| Next.js | Frontend framework | [nextjs.org](https://nextjs.org) |
| Express | Backend framework | [expressjs.com](https://expressjs.com) |
| TypeScript | Type safety | [typescriptlang.org](https://www.typescriptlang.org) |
| Tailwind | Styling | [tailwindcss.com](https://tailwindcss.com) |
| SQLite | Database | [sqlite.org](https://sqlite.org) |
| Gemini API | AI checklists | [ai.google.dev](https://ai.google.dev) |
| Framer Motion | Animations | [framer.com/motion](https://www.framer.com/motion) |
| JWT | Authentication | [jwt.io](https://jwt.io) |

---

## Commandos Úteis Que Cursor Pode Usar

```bash
# Desenvolvimento
npm run dev              # Rodar ambos
cd backend && npm start  # Backend
cd nextjs-frontend && npm run dev  # Frontend

# Build
npm run build --prefix backend
npm run build --prefix nextjs-frontend

# Linting
npm run lint --prefix nextjs-frontend

# Verificar segurança
git status              # Confirmar .env não está
grep -r "password" backend/  # Procurar senhas no código
```

---

## Próximas Features Sugeridas

- [ ] Relatórios com gráficos
- [ ] Notificações em tempo real
- [ ] Integração com WhatsApp
- [ ] Exportar dados para PDF/Excel
- [ ] Modo offline (PWA)
- [ ] Múltiplos usuários simultâneos
- [ ] Histórico de alterações
- [ ] Busca avançada

---

## Perguntas Frequentes para o Cursor

**P: Como adiciono um novo endpoint?**
A: Crie arquivo em `backend/routes/novo.js`, exporte router, importe em `server.js`

**P: Como adiciono uma nova página?**
A: Crie `nextjs-frontend/app/nova/page.tsx`, adicione ao Sidebar

**P: Como faço validação?**
A: Use Zod no backend, validação nativa no frontend

**P: Onde fica a lógica de autenticação?**
A: Backend: `backend/middleware/auth.js`, Frontend: `nextjs-frontend/contexts/AuthContext.tsx`

**P: Como lido com imagens grandes?**
A: Comprima no cliente, envie como base64, armazene em LONGTEXT

---

## Contato com AI

Quando o Cursor pedir contexto adicional:
1. Forneça nomes de arquivos completos
2. Cole trechos de código relevantes
3. Descreva o fluxo esperado
4. Mencione erros específicos
5. Compartilhe logs se houver

---

**Este projeto foi otimizado para trabalhar com AI Assistants**  
**Última atualização**: Novembro 2025  
**Status**: ✅ Pronto para Desenvolvimento

