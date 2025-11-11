# 🖥️ Setup em Novo PC - Guia Completo

## 📋 Resumo Rápido

```bash
# 1. Clonar
git clone https://github.com/carloska24/sgm-sistema-gestao-manutencao.git
cd sgm

# 2. Criar arquivos .env
cp backend/env.example backend/.env
cp nextjs-frontend/.env.example nextjs-frontend/.env.local

# 3. Editar com valores reais
code backend/.env
code nextjs-frontend/.env.local

# 4. Instalar e rodar
npm install
npm start
```

---

## 🔧 Pré-Requisitos

Certifique-se que tem instalado:

- [ ] **Node.js 16+**: [Download](https://nodejs.org/)
- [ ] **Git**: [Download](https://git-scm.com/)
- [ ] **Editor**: VS Code, Sublime, etc
- [ ] **Conta GitHub**: Para clonar (opcional se usar HTTPS)

### Verificar Versões

```bash
# Windows PowerShell / CMD
node --version
npm --version
git --version
```

---

## 📥 Passo 1: Clonar o Repositório

### Opção A: HTTPS (Mais Fácil)

```bash
# Clonar com HTTPS
git clone https://github.com/carloska24/sgm-sistema-gestao-manutencao.git

# Entrar na pasta
cd sgm
```

### Opção B: SSH (Mais Seguro)

```bash
# Primeiro, configurar SSH no GitHub
# https://docs.github.com/en/authentication/connecting-to-github-with-ssh

# Depois clonar com SSH
git clone git@github.com:carloska24/sgm-sistema-gestao-manutencao.git
cd sgm
```

---

## 🔐 Passo 2: Criar Arquivos .env

### Backend

```bash
# Entrar na pasta backend
cd backend

# Copiar exemplo para arquivo real
# Windows CMD:
copy env.example .env

# Windows PowerShell:
Copy-Item env.example .env

# Linux/Mac:
cp env.example .env

# Voltar para pasta raiz
cd ..
```

### Frontend

```bash
# Entrar na pasta frontend
cd nextjs-frontend

# Criar .env.local
# Windows CMD:
copy .env.example .env.local

# Windows PowerShell:
Copy-Item .env.example .env.local

# Linux/Mac:
cp .env.example .env.local

# Voltar
cd ..
```

---

## ✏️ Passo 3: Editar .env com Valores Reais

### Backend (.env)

```bash
# Abrir com VS Code
code backend/.env

# Ou com outro editor
nano backend/.env
```

**Preencher com valores reais:**

```env
NODE_ENV=development
PORT=3001
JWT_SECRET=gere-uma-chave-segura-aqui
DATABASE_URL=./sgm.db
GEMINI_API_KEY=sua-chave-gemini-opcional
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env.local)

```bash
code nextjs-frontend/.env.local
```

**Conteúdo:**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

---

## 💾 Passo 4: Instalar Dependências

```bash
# Instalar dependências do backend
cd backend
npm install
cd ..

# Instalar dependências do frontend
cd nextjs-frontend
npm install
cd ..

# Ou fazer tudo de uma vez:
npm install --prefix backend
npm install --prefix nextjs-frontend
```

---

## 🚀 Passo 5: Iniciar o Projeto

### Terminal 1: Backend

```bash
cd backend
npm start
# Ou: npm run dev
```

**Esperado:**
```
✓ Server running on http://localhost:3001
✓ Database initialized
```

### Terminal 2: Frontend

```bash
cd nextjs-frontend
npm run dev
```

**Esperado:**
```
✓ Ready in 2.5s
✓ Open http://localhost:3000
```

---

## ✅ Verificação

Tudo funcionando? Verifique:

- [ ] Backend rodando em `http://localhost:3001`
- [ ] Frontend rodando em `http://localhost:3000`
- [ ] Banco de dados criado (`backend/sgm.db`)
- [ ] Nenhuma pasta `.env` visível em `git status`
- [ ] Consegue fazer login

```bash
# Verificar que .env está ignorado:
git status  # Não deve mostrar .env
```

---

## 🆘 Problemas Comuns

### Erro: "npm: command not found"

**Solução:** Node.js não está instalado
```bash
# Baixar de: https://nodejs.org/
# Reinstalar Node.js
```

### Erro: ".env not found"

**Solução:** Arquivos .env não foram criados
```bash
# Criar manualmente:
cd backend && cp env.example .env
cd ../nextjs-frontend && cp .env.example .env.local
```

### Erro: "Port 3001 already in use"

**Solução:** Outra aplicação está usando a porta
```bash
# Windows: Matar processo
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac:
lsof -i :3001
kill -9 <PID>

# Ou usar porta diferente:
PORT=3002 npm start
```

### Erro: "Cannot find module 'express'"

**Solução:** Dependências não instaladas
```bash
cd backend
npm install
```

### Erro: "CORS error"

**Solução:** URLs não conferem
```env
# Verificar frontend .env.local:
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Verificar backend .env:
CORS_ORIGIN=http://localhost:3000
```

---

## 📁 Estrutura Esperada

Após setup completo:

```
sgm/
├── .git/                    (repositório)
├── .gitignore               (regras de ignorar)
├── backend/
│   ├── .env                 (criado ✅)
│   ├── env.example          (modelo)
│   ├── node_modules/        (instalado)
│   ├── sgm.db               (criado ao rodar)
│   └── package.json
├── nextjs-frontend/
│   ├── .env.local           (criado ✅)
│   ├── .env.example         (modelo)
│   ├── .next/               (gerado ao rodar)
│   ├── node_modules/        (instalado)
│   └── package.json
├── SEGURANCA_GITHUB.md      (guia)
├── COMO_CONFIGURAR_ENV.md   (guia)
└── SETUP_NOVO_PC.md         (este arquivo)
```

---

## 🔑 Valores Padrão para Desenvolvimento

Se não souber o que preencher:

```env
# Backend .env
NODE_ENV=development
PORT=3001
JWT_SECRET=dev-secret-change-in-production
DATABASE_URL=./sgm.db
GEMINI_API_KEY=
CORS_ORIGIN=http://localhost:3000

# Frontend .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

⚠️ **Nota:** Estes são valores DEFAULT. Para produção, usar valores reais!

---

## 📊 Script Automático (Opcional)

### Windows PowerShell

Criar arquivo `setup.ps1`:

```powershell
# Clone
git clone https://github.com/carloska24/sgm-sistema-gestao-manutencao.git
cd sgm

# Criar .env files
Copy-Item backend/env.example backend/.env
Copy-Item nextjs-frontend/.env.example nextjs-frontend/.env.local

# Instalar
npm install --prefix backend
npm install --prefix nextjs-frontend

Write-Host "✅ Setup completo!"
Write-Host "Edite os arquivos .env e depois rode:"
Write-Host "  Terminal 1: cd backend && npm start"
Write-Host "  Terminal 2: cd nextjs-frontend && npm run dev"
```

Executar:
```bash
powershell -ExecutionPolicy Bypass -File setup.ps1
```

### Linux/Mac

Criar arquivo `setup.sh`:

```bash
#!/bin/bash

# Clone
git clone https://github.com/carloska24/sgm-sistema-gestao-manutencao.git
cd sgm

# Criar .env files
cp backend/env.example backend/.env
cp nextjs-frontend/.env.example nextjs-frontend/.env.local

# Instalar
npm install --prefix backend
npm install --prefix nextjs-frontend

echo "✅ Setup completo!"
echo "Edite os arquivos .env e depois rode:"
echo "  Terminal 1: cd backend && npm start"
echo "  Terminal 2: cd nextjs-frontend && npm run dev"
```

Executar:
```bash
chmod +x setup.sh
./setup.sh
```

---

## 🔄 Atualizações Futuras

Quando seu repositório for atualizado:

```bash
# Puxar as últimas mudanças
git pull origin main

# Verificar se há novos arquivos .env.example
git status

# Se houver, verificar as mudanças
git diff nextjs-frontend/.env.example

# Instalar novas dependências
npm install --prefix backend
npm install --prefix nextjs-frontend
```

---

## 📝 Checklist Final

Antes de começar a desenvolver:

- [ ] Git clonado
- [ ] Arquivos `.env` criados (não visíveis em `git status`)
- [ ] Valores `.env` preenchidos
- [ ] `npm install` executado
- [ ] Backend rodando na porta 3001
- [ ] Frontend rodando na porta 3000
- [ ] Consegue fazer login no app
- [ ] Leu o README.md principal
- [ ] Entendeu a estrutura do projeto

---

## 🆘 Ainda com Dúvidas?

1. Ler `SEGURANCA_GITHUB.md`
2. Ler `COMO_CONFIGURAR_ENV.md`
3. Verificar logs de erro
4. Avisar o líder do projeto
5. Consultar documentação oficial

---

## 📚 Links Úteis

- [Node.js Download](https://nodejs.org/)
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Help](https://docs.github.com)
- [Next.js Setup](https://nextjs.org/docs/getting-started)
- [Express.js Guide](https://expressjs.com/)

---

**Última atualização:** Novembro 2025  
**Status:** ✅ Pronto para Usar

