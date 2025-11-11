# ⚡ Quick Start: Deploy no GitHub + Netlify

Guia rápido para colocar o SGM no ar em 10 minutos!

## 🎯 Resumo Rápido

1. **GitHub**: Criar repositório e fazer push
2. **Render.com**: Deploy do backend (API)
3. **Netlify**: Deploy do frontend (Next.js)

---

## 📦 1. GitHub (2 minutos)

### Criar Repositório

1. Acesse [github.com/new](https://github.com/new)
2. Nome: `sgm-sistema-gestao-manutencao`
3. **NÃO** marque README ou .gitignore
4. Clique em **"Create repository"**

### Enviar Código

```bash
cd C:\Workspace\sgm
git init
git add .
git commit -m "Initial commit: SGM"
git remote add origin https://github.com/carloska24/sgm-sistema-gestao-manutencao.git
git branch -M main
git push -u origin main
```

✅ **Substitua `SEU_USUARIO` pelo seu usuário do GitHub!**

---

## 🔧 2. Backend no Render.com (3 minutos)

### Criar Web Service

1. Acesse [render.com](https://render.com) e faça login com GitHub
2. Clique em **"New +"** → **"Web Service"**
3. Conecte seu repositório do GitHub
4. Configure:
   - **Name**: `sgm-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### Variáveis de Ambiente

No painel do Render, adicione:

```env
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://seu-site.netlify.app
DB_PATH=./sgm.db
JWT_SECRET=seu_secret_super_seguro_aqui
JWT_EXPIRATION=24h
```

⚠️ **Anote a URL do backend** (ex: `https://sgm-backend.onrender.com`)

---

## 🌐 3. Frontend na Netlify (3 minutos)

### Conectar ao GitHub

1. Acesse [netlify.com](https://www.netlify.com) e faça login com GitHub
2. Clique em **"Add new site"** → **"Import an existing project"**
3. Selecione **"Deploy with GitHub"**
4. Autorize e selecione o repositório `sgm-sistema-gestao-manutencao`

### Configurar Build

O arquivo `netlify.toml` já está configurado! Apenas verifique:

- **Base directory**: `nextjs-frontend`
- **Build command**: `npm install && npm run build`
- **Publish directory**: `.next`

### Variáveis de Ambiente

No painel da Netlify, adicione:

```env
NEXT_PUBLIC_API_URL=https://sgm-backend.onrender.com/api
```

⚠️ **Substitua pela URL real do seu backend!**

### Deploy

1. Clique em **"Deploy site"**
2. Aguarde o build (2-5 minutos)
3. Anote a URL do site (ex: `https://seu-site.netlify.app`)

---

## 🔄 4. Atualizar URLs (1 minuto)

### No Render (Backend)

Atualize a variável `FRONTEND_URL`:

```env
FRONTEND_URL=https://seu-site.netlify.app
```

Reinicie o serviço no Render.

---

## ✅ 5. Testar

1. Acesse a URL da Netlify
2. Teste o login
3. Verifique se tudo está funcionando

---

## 🎉 Pronto!

Seu sistema está no ar!

**URLs:**

- Frontend: `https://seu-site.netlify.app`
- Backend: `https://sgm-backend.onrender.com`

---

## 📚 Documentação Completa

Para mais detalhes, consulte:

- **[DEPLOY.md](./DEPLOY.md)** - Guia completo e detalhado
- **[GITHUB_SETUP.md](./GITHUB_SETUP.md)** - Setup do GitHub

---

## 🆘 Problemas?

### CORS Error

- Verifique se `FRONTEND_URL` no Render está correto
- Reinicie o backend após alterar

### API não conecta

- Verifique `NEXT_PUBLIC_API_URL` na Netlify
- Verifique se o backend está rodando no Render

### Build falha

- Verifique os logs do build
- Certifique-se de que todas as dependências estão no `package.json`

---

**Boa sorte! 🚀**
