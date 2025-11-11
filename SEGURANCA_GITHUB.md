# 🔒 Guia de Segurança - O Que NÃO Subir para GitHub

## ⚠️ Arquivo Sensíveis - NUNCA Commitir!

### 1. **Variáveis de Ambiente (.env)**
```bash
# ❌ NUNCA commitar:
.env
.env.local
.env.production

# ✅ SEMPRE usar:
.env.example  # Com valores de exemplo
```

**Exemplo de .env.example:**
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=exemplo_de_secret
GEMINI_API_KEY=exemplo_de_api_key
DATABASE_URL=./sgm.db
```

---

### 2. **Chaves e Certificados**
```
❌ *.pem
❌ *.key
❌ *.pub
❌ *.p12
❌ .ssh/
❌ credentials.json
```

---

### 3. **Banco de Dados Local**
```
❌ *.db
❌ *.sqlite
❌ *.sqlite3
❌ sgm.db
❌ backend/sgm.db
```

---

### 4. **Informações Sensíveis**
```
❌ API Keys
❌ Senhas
❌ Tokens
❌ AWS Credentials
❌ Google Cloud Keys
❌ Chaves Privadas
```

---

## ✅ Está Configurado no .gitignore

O arquivo `.gitignore` já foi atualizado com:

```
# Environment Variables
.env
.env.local
.env.*.local

# Database
*.db
*.sqlite
sgm.db

# Secrets
*.pem
*.key
credentials.json

# Logs
*.log
npm-debug.log*

# IDE
.vscode/
.idea/

# Build
node_modules/
/.next
/build
/dist
```

---

## 📋 Passo a Passo - Como Manter Seguro

### 1. **Criar .env a partir do .env.example**
```bash
cp .env.example .env
# Editar .env com valores reais
```

### 2. **Verificar Antes de Commitar**
```bash
# Ver o que vai ser commitado
git status

# Ver o que vai subir
git diff --cached

# Procurar por secrets
git diff HEAD | grep -i "secret\|key\|password"
```

### 3. **Não Commitar Acidentalmente**
```bash
# ❌ NÃO fazer isso:
git add -A
git add .

# ✅ Fazer isso:
git add arquivo1.js
git add arquivo2.ts
git add package.json
```

### 4. **Se Acidentalmente Commitou um Secret**
```bash
# 1. Remover do histórico (IMPORTANTE!)
git rm --cached .env
git commit --amend

# 2. Forçar push (apenas se for branch pessoal)
git push -f

# 3. TROCAR A CHAVE/SENHA NO SERVIDOR!
```

---

## 🛡️ Segurança em Produção

### Para Deploy (Vercel, Netlify, Heroku, etc.)

1. **Configurar variáveis de ambiente no painel:**
   - Vercel → Settings → Environment Variables
   - Netlify → Deploy settings → Build environment
   - Heroku → Config Vars

2. **Nunca copiar .env para servidor**
3. **Usar secrets manager:**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault

---

## 📝 Arquivos que DEVEM Ir para GitHub

✅ Source code (.ts, .tsx, .js)
✅ Configuração (.json, .config.js)
✅ Documentação (.md)
✅ Tests (.test.ts)
✅ .gitignore
✅ .env.example (SEM VALORES REAIS)
✅ README.md
✅ package.json (SEM package-lock.json em alguns casos)

---

## 🔐 Checklist de Segurança

- [ ] .env adicionado a .gitignore
- [ ] .env.example criado com valores de exemplo
- [ ] Sem API keys no código
- [ ] Sem senhas em comentários
- [ ] Sem tokens hardcoded
- [ ] Sem dados pessoais
- [ ] .gitignore atualizado
- [ ] Revisar git log antes de push
- [ ] Não usar -f (force) desnecessariamente

---

## 🚨 Acidentalmente Commitou um Secret?

1. **Emergência!** Revoke a chave/token imediatamente
2. Remover do git: `git rm --cached .env`
3. Se já foi para main: `git filter-branch` (complexo)
4. Melhor: Usar serviço como [GitGuardian](https://www.gitguardian.com/) para monitorar

---

## 📚 Referências

- [GitHub: Removing Sensitive Data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
- [OWASP: Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)
- [GitGuardian: Secret Detection](https://www.gitguardian.com/)

---

**Última atualização:** Novembro 2025
**Status:** ✅ Segurança Configurada

