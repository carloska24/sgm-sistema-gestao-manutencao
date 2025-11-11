# 🚀 Guia de Deploy - SGM

Este guia explica como fazer o deploy do SGM no GitHub e hospedar na Netlify.

## 📋 Pré-requisitos

- Conta no GitHub
- Conta na Netlify (gratuita)
- Conta no Render.com ou Railway (para o backend)
- Git instalado localmente

---

## 1️⃣ Criar Repositório no GitHub

### Passo 1: Criar o repositório

1. Acesse [GitHub](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Preencha:
   - **Repository name**: `sgm-sistema-gestao-manutencao` (ou outro nome)
   - **Description**: Sistema de Gestão da Manutenção
   - **Visibility**: Escolha Public ou Private
   - **NÃO** marque "Add a README file" (já temos um)
   - **NÃO** marque "Add .gitignore" (já temos um)
5. Clique em **"Create repository"**

### Passo 2: Fazer o primeiro commit

No terminal, na pasta do projeto SGM:

```bash
# Inicializar git (se ainda não foi feito)
git init

# Adicionar todos os arquivos
git add .

# Fazer commit inicial
git commit -m "Initial commit: SGM - Sistema de Gestão da Manutenção"

# Adicionar o repositório remoto (substitua SEU_USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU_USUARIO/sgm-sistema-gestao-manutencao.git

# Enviar para o GitHub
git branch -M main
git push -u origin main
```

---

## 2️⃣ Deploy do Backend (Render.com)

O backend precisa ser hospedado separadamente. Recomendamos o **Render.com** (gratuito).

### Passo 1: Criar conta no Render

1. Acesse [Render.com](https://render.com)
2. Faça login com sua conta do GitHub
3. Autorize o Render a acessar seus repositórios

### Passo 2: Criar Web Service

1. No dashboard do Render, clique em **"New +"**
2. Selecione **"Web Service"**
3. Conecte seu repositório do GitHub
4. Selecione o repositório `sgm-sistema-gestao-manutencao`
5. Configure:
   - **Name**: `sgm-backend`
   - **Region**: Escolha a mais próxima (ex: `Oregon (US West)`)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free` (para desenvolvimento)

### Passo 3: Configurar Variáveis de Ambiente

No painel do Render, vá em **"Environment"** e adicione:

```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://seu-site.netlify.app
DB_PATH=./sgm.db
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRATION=24h
```

⚠️ **IMPORTANTE**: 
- `FRONTEND_URL` será atualizado depois que você fizer o deploy do frontend na Netlify
- `JWT_SECRET` deve ser uma string aleatória e segura (ex: use `openssl rand -hex 32` no terminal)

### Passo 4: Criar Banco de Dados

1. No Render, clique em **"New +"**
2. Selecione **"PostgreSQL"** (recomendado para produção)
   - Ou mantenha SQLite (menos recomendado para produção)
3. Configure:
   - **Name**: `sgm-db`
   - **Database**: `sgm`
   - **User**: será gerado automaticamente
   - **Region**: Mesma do backend

4. Após criar, copie a **Database URL** (Connection String)

5. No backend, atualize a variável de ambiente:
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

### Passo 5: Obter URL do Backend

Após o deploy, o Render fornecerá uma URL como:
```
https://sgm-backend.onrender.com
```

⚠️ **Anote esta URL** - você precisará dela para configurar o frontend!

---

## 3️⃣ Deploy do Frontend (Netlify)

### Passo 1: Conectar ao GitHub

1. Acesse [Netlify](https://www.netlify.com)
2. Faça login com sua conta do GitHub
3. Clique em **"Add new site"** → **"Import an existing project"**
4. Selecione **"Deploy with GitHub"**
5. Autorize o Netlify a acessar seus repositórios
6. Selecione o repositório `sgm-sistema-gestao-manutencao`

### Passo 2: Configurar Build

Configure as seguintes opções:

- **Base directory**: `nextjs-frontend`
- **Build command**: `npm install && npm run build`
- **Publish directory**: `.next`

Ou use o arquivo `netlify.toml` que já está configurado!

### Passo 3: Configurar Variáveis de Ambiente

No painel da Netlify, vá em **"Site settings"** → **"Environment variables"** e adicione:

```env
NEXT_PUBLIC_API_URL=https://sgm-backend.onrender.com/api
```

⚠️ **IMPORTANTE**: Substitua `https://sgm-backend.onrender.com` pela URL real do seu backend no Render!

### Passo 4: Atualizar URL do Backend

1. Volte ao Render
2. No painel do backend, vá em **"Environment"**
3. Atualize `FRONTEND_URL` com a URL do Netlify:
   ```env
   FRONTEND_URL=https://seu-site.netlify.app
   ```
4. Reinicie o serviço

### Passo 5: Deploy

1. Na Netlify, clique em **"Deploy site"**
2. Aguarde o build (pode levar alguns minutos)
3. Após o deploy, você receberá uma URL como:
   ```
   https://seu-site.netlify.app
   ```

---

## 4️⃣ Configurações Adicionais

### Custom Domain (Opcional)

1. Na Netlify, vá em **"Domain settings"**
2. Clique em **"Add custom domain"**
3. Siga as instruções para configurar seu domínio

### Atualizar CORS no Backend

Após obter a URL da Netlify, atualize o backend no Render:

```env
FRONTEND_URL=https://seu-site.netlify.app
```

E reinicie o serviço.

---

## 5️⃣ Verificação e Testes

### Checklist

- [ ] Backend está rodando no Render
- [ ] Frontend está rodando na Netlify
- [ ] Variável `NEXT_PUBLIC_API_URL` está configurada
- [ ] Variável `FRONTEND_URL` está configurada no backend
- [ ] CORS está permitindo requisições do frontend
- [ ] Banco de dados está conectado
- [ ] Teste de login funciona

### Testar o Sistema

1. Acesse a URL do Netlify
2. Tente fazer login
3. Verifique se as requisições estão funcionando (F12 → Network)
4. Teste as funcionalidades principais

---

## 🔧 Troubleshooting

### Erro: "CORS policy: No 'Access-Control-Allow-Origin'"

- Verifique se `FRONTEND_URL` no backend está correto
- Verifique se a URL na Netlify está exatamente como configurada
- Reinicie o backend após alterar variáveis

### Erro: "Cannot connect to API"

- Verifique se `NEXT_PUBLIC_API_URL` está configurada na Netlify
- Verifique se o backend está rodando no Render
- Verifique os logs do backend no Render

### Build falha na Netlify

- Verifique os logs do build
- Certifique-se de que todas as dependências estão no `package.json`
- Verifique se o Node.js version está correto

### Banco de dados não conecta

- Verifique a `DATABASE_URL` no Render
- Verifique se o banco está ativo
- Verifique os logs do backend

---

## 📚 Recursos Adicionais

- [Documentação do Render](https://render.com/docs)
- [Documentação da Netlify](https://docs.netlify.com)
- [Documentação do Next.js](https://nextjs.org/docs)

---

## 🎉 Pronto!

Seu sistema está hospedado e funcionando! 

**URLs importantes:**
- Frontend: `https://seu-site.netlify.app`
- Backend: `https://sgm-backend.onrender.com`
- Dashboard Render: [https://dashboard.render.com](https://dashboard.render.com)
- Dashboard Netlify: [https://app.netlify.com](https://app.netlify.com)

