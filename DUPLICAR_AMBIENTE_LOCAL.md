# 🔄 Duplicar Ambiente Local - Guia Completo

## 🎯 Objetivo

Fazer o **novo PC** ter exatamente o **mesmo ambiente** que este PC atual, incluindo:
- ✅ Mesmo código
- ✅ Mesmas dependências (npm packages)
- ✅ Mesmos valores de configuração (.env)
- ✅ Mesmos dados de teste (banco de dados)
- ✅ Mesmo histórico Git

---

## 📋 Pré-Requisitos

- Git instalado
- Node.js instalado (mesma versão)
- Acesso ao repositório GitHub
- Arquivo `.env` do PC atual
- Arquivo `sgm.db` do PC atual (banco de dados)

---

## 🔍 Passo 1: Coletar Informações do PC Atual

### Versões

```bash
# Windows CMD ou PowerShell
node --version
npm --version
git --version

# Salvar em um arquivo para referência:
echo Node version: && node --version > versoes.txt
echo NPM version: && npm --version >> versoes.txt
echo Git version: && git --version >> versoes.txt
```

### Arquivo .env Atual

```bash
# Copiar seu .env atual para um backup seguro
# NÃO commitar! Apenas usar como referência

# Criar um arquivo com os VALORES (sem expor no GitHub):
backend/.env → salvar em local seguro
nextjs-frontend/.env.local → salvar em local seguro
```

### Banco de Dados Atual

```bash
# Copiar o arquivo do banco:
backend/sgm.db → salvar em local seguro
```

---

## 💾 Passo 2: Preparar Arquivo de Configuração

Crie um arquivo `AMBIENTE_LOCAL.md` com as informações:

```markdown
# Configuração Local - PC Desenvolvimento

## Versões
- Node: v18.17.0
- NPM: 9.8.1
- Git: 2.40.0

## Variáveis de Ambiente

### Backend (.env)
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=seu-secret-aqui
DATABASE_URL=./sgm.db
GEMINI_API_KEY=sua-chave-aqui
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

## URLs Locais
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- API: http://localhost:3001/api

## Banco de Dados
- Arquivo: backend/sgm.db
- Tipo: SQLite
- Dados de teste: SIM

## Usuários de Teste
- Username: admin
- Email: admin@sgm.com
- Senha: admin123

## Status
- ✅ Frontend rodando
- ✅ Backend rodando
- ✅ Banco de dados sincronizado
```

---

## 🔐 Passo 3: Copiar Valores .env SEGURAMENTE

### Opção A: Arquivo Protegido (Recomendado)

```bash
# 1. Criar pasta segura (fora do git)
mkdir ../ambiente-backup
cd ../ambiente-backup

# 2. Copiar arquivos .env
copy ../sgm/backend/.env ./backend-env.txt
copy ../sgm/nextjs-frontend/.env.local ./frontend-env.txt

# 3. Arquivos criados:
ambiente-backup/
├── backend-env.txt      (valores reais)
├── frontend-env.txt     (valores reais)
└── Não é versionado no Git!
```

### Opção B: Drive/Cloud Pessoal

```bash
# Guardar em:
- Google Drive (pessoal)
- OneDrive (pessoal)
- Dropbox (pessoal)
- Pendrive criptografado
- ⚠️ NUNCA no GitHub!
```

---

## 💾 Passo 4: Copiar Banco de Dados

### Fazer Backup do sgm.db

```bash
# 1. Localizar o arquivo
# Caminho: backend/sgm.db

# 2. Fazer backup
copy backend\sgm.db ..\..\sgm-banco-backup\sgm.db

# 3. Ou compactar
tar -czf sgm-db-backup.tar.gz backend/sgm.db
# ou usar WinRAR/7Zip

# 4. Armazenar em local seguro (mesmo que .env)
```

---

## 🔄 Passo 5: No Novo PC - Clonar

```bash
# 1. Clonar repositório
git clone https://github.com/carloska24/sgm-sistema-gestao-manutencao.git
cd sgm

# 2. Verificar versões
node --version    # Deve ser v18.17.0 (ou similar)
npm --version     # Deve ser 9.8.1 (ou similar)
git --version     # Deve ser 2.40.0 (ou similar)

# Se forem diferentes:
# - Atualizar Node.js
# - Usar nvm (Node Version Manager) para múltiplas versões
```

---

## 🔐 Passo 6: Restaurar Configurações .env

### Backend

```bash
# 1. Entrar na pasta
cd backend

# 2. Opção A: Copiar do backup
copy C:\Seu\Caminho\Backup\backend-env.txt .env

# 2. Opção B: Criar manualmente
# Abrir editor e preencher valores (mesmos que tinham)
code .env

# 3. Verificar (não commitar!)
git status  # .env NÃO deve aparecer

# 4. Voltar
cd ..
```

### Frontend

```bash
# 1. Entrar na pasta
cd nextjs-frontend

# 2. Opção A: Copiar do backup
copy C:\Seu\Caminho\Backup\frontend-env.txt .env.local

# 2. Opção B: Criar manualmente
code .env.local

# 3. Verificar
git status  # .env.local NÃO deve aparecer

# 4. Voltar
cd ..
```

---

## 💾 Passo 7: Restaurar Banco de Dados

### Copiar Banco Atual

```bash
# 1. Ter o arquivo sgm.db do PC antigo

# 2. Copiar para novo PC
copy C:\Seu\Backup\sgm.db .\backend\sgm.db

# 3. Ou restaurar de backup compactado
tar -xzf sgm-db-backup.tar.gz
```

### Ou Criar Novo (Sem Dados Anteriores)

```bash
# Deixar a aplicação criar um novo banco:
# npm start vai auto-criar um novo sgm.db

# Backend vai criar as tabelas automaticamente
```

---

## 📦 Passo 8: Instalar Dependências (Exatamente Iguais)

### Usar package-lock.json para Reproduzir

```bash
# 1. Backend
cd backend
npm ci  # "ci" = Clean Install (reproduz exatamente)

# NÃO usar "npm install" (pode atualizar versões)

# 2. Frontend
cd ../nextjs-frontend
npm ci

# 3. Voltar
cd ..
```

---

## 🚀 Passo 9: Verificar Se Tudo Está Igual

### Comparar Estrutura

```bash
# 1. Versões devem ser iguais
node --version
npm --version

# 2. Verificar .env
cat backend/.env          # Valores iguais
cat nextjs-frontend/.env.local  # Valores iguais

# 3. Verificar banco
dir backend/sgm.db        # Arquivo existe
```

### Comparar Git

```bash
# Histórico deve ser idêntico
git log --oneline | head -10

# Deve mostrar mesmos commits
```

### Comparar node_modules

```bash
# Versões instaladas devem ser iguais
npm list --depth=0  # No backend
npm list --depth=0  # No frontend

# Comparar com PC antigo
# Devem ser idênticas
```

---

## ✅ Passo 10: Teste Final

### Terminal 1: Backend

```bash
cd backend
npm start

# Esperado:
# ✓ Server running on http://localhost:3001
# ✓ Database connected
# ✓ Mesmo banco de dados carregado
```

### Terminal 2: Frontend

```bash
cd nextjs-frontend
npm run dev

# Esperado:
# ✓ Ready in 2.5s
# ✓ Open http://localhost:3000
```

### No Navegador

```bash
# 1. Abrir http://localhost:3000
# 2. Fazer login com mesmas credenciais
# 3. Ver mesmos dados (se copiou o banco)
# 4. Tudo igual ao PC antigo ✅
```

---

## 📊 Checklist de Duplicação

- [ ] Node.js mesma versão
- [ ] NPM mesma versão
- [ ] Repositório clonado
- [ ] Arquivos .env copiados (mesmos valores)
- [ ] Banco de dados copiado (sgm.db)
- [ ] `npm ci` executado (ambos)
- [ ] Backend rodando
- [ ] Frontend rodando
- [ ] Login funciona
- [ ] Dados aparecem (mesmos do PC antigo)
- [ ] Sem erros no console

---

## 🔧 Troubleshooting - Diferenças

### Versões Node.js Diferentes

```bash
# Problema: Node v16 vs v18
# Solução: Instalar nvm

# Usar nvm para múltiplas versões:
nvm install 18.17.0
nvm use 18.17.0

# Ou atualizar Node.js
# https://nodejs.org/
```

### Banco de Dados com Erro

```bash
# Se sgm.db corrompido:
# 1. Deletar arquivo
del backend\sgm.db

# 2. Deixar app recriá-lo
npm start

# 3. Banco novo será criado (sem dados antigos)
```

### Dependências Conflitantes

```bash
# Se npm ci falhar:
# 1. Deletar node_modules
rm -rf backend/node_modules
rm -rf nextjs-frontend/node_modules

# 2. Deletar lock files
rm backend/package-lock.json
rm nextjs-frontend/package-lock.json

# 3. Instalar novamente
npm install --prefix backend
npm install --prefix nextjs-frontend
```

### CORS Error

```bash
# Se frontend não consegue chamar backend:
# Verificar .env do frontend:
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Verificar .env do backend:
CORS_ORIGIN=http://localhost:3000
```

---

## 📝 Arquivos Necessários para Duplicar

```
PC Antigo → Backup:
├── backend/.env                    (valores)
├── nextjs-frontend/.env.local      (valores)
├── backend/sgm.db                  (banco)
├── versoes.txt                     (versões)
└── AMBIENTE_LOCAL.md               (documentação)

Novo PC:
├── Git clone do repositório
├── Restaurar .env files
├── Restaurar sgm.db
├── npm ci (não install!)
└── ✅ Ambiente pronto
```

---

## 🔐 Segurança - O Que NÃO Fazer

```bash
❌ Não commitar .env com valores reais
❌ Não pushear sgm.db para GitHub
❌ Não compartilhar valores .env no Slack/Email
❌ Não usar git add -A (vai pegar .env)
❌ Não colocar secrets em código
```

---

## ✨ Resultado Final

Você terá em dois PCs:

```
PC 1 (Antigo)          PC 2 (Novo)
═══════════════════════════════════
✅ Backend rodando  =  ✅ Backend rodando
✅ Frontend rodando =  ✅ Frontend rodando
✅ Mesmo banco     =  ✅ Mesmos dados
✅ Mesmas versions =  ✅ Mesmas versions
✅ Mesma .env      =  ✅ Mesma .env
✅ Histórico Git   =  ✅ Mesmo histórico
```

---

## 🎯 Ordem Resumida

1. **PC Antigo:** Coletar `backend/.env`, `nextjs-frontend/.env.local`, `backend/sgm.db`
2. **Novo PC:** `git clone`
3. **Novo PC:** Restaurar `.env` files
4. **Novo PC:** Restaurar `sgm.db`
5. **Novo PC:** `npm ci` (ambos)
6. **Novo PC:** `npm start` (backend e frontend)
7. **Verificar:** Tudo igual ✅

---

## 📚 Referências Relacionadas

- `SETUP_NOVO_PC.md` - Setup básico
- `COMO_CONFIGURAR_ENV.md` - Variáveis de ambiente
- `SEGURANCA_GITHUB.md` - Segurança

---

**Última atualização:** Novembro 2025  
**Status:** ✅ Ambiente Duplicado

