# IA Gemini - Checklists Inteligentes

Este pacote contém os arquivos necessários para analisar o assistente de IA responsável por gerar itens de checklist.

## Estrutura
- nextjs-frontend/app/checklists/page.tsx
- nextjs-frontend/app/api/generate-checklist/route.ts
- nextjs-frontend/types/index.ts
- nextjs-frontend/package.json

## Dependências relevantes
- @google/generative-ai
- Next.js 14 (App Router) e React 18

## Como executar
1. npm install
2. Defina GEMINI_API_KEY com uma chave válida do Gemini.
3. npm run dev

## Fluxo atual
- O botão  Gerar com IA em page.tsx chama POST /api/generate-checklist.
- A API monta um prompt com SYSTEM_PROMPT e usa o modelo gemini-1.5-flash.
- A resposta deve ser JSON com { itens: [ { titulo, obrigatorio } ] }.
- O frontend converte o JSON para ChecklistTemplateItem[] e preenche o formulário.

Use estes arquivos como base para depurar ou recriar a integração com o Gemini.