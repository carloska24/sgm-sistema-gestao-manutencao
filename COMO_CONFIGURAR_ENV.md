# ⚙️ Como Configurar Variáveis de Ambiente

## 🚀 Setup Rápido (5 Minutos)

### Backend

```bash
# 1. Entrar na pasta do backend
cd backend

# 2. Criar o arquivo .env
cp env.example .env

# 3. Editar .env com seus valores
# Windows:
code .env

# Linux/Mac:
nano .env
```

**Valores essenciais para .env:**
```env
NODE_ENV=development
PORT=3001
JWT_SECRET=sua_chave_super_secreta_aqui_123456789
DATABASE_URL=./sgm.db
GEMINI_API_KEY=sua_chave_gemini_opcional
```

### Frontend

```bash
# 1. Entrar na pasta
cd nextjs-frontend

# 2. Criar .env.local
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
EOF

# Ou editar manualmente:
code .env.local
```

---

## 📋 Estrutura de Pastas

```
sgm/
├── .gitignore              ✅ Arquivos ignorados
├── .env.example            ✅ Exemplo (seguro subir)
├── backend/
│   ├── .env               ❌ NUNCA subir (local)
│   ├── env.example        ✅ Exemplo
│   └── sgm.db             ❌ NUNCA subir
├── nextjs-frontend/
│   ├── .env.local         ❌ NUNCA subir (local)
│   └── .next/             ❌ NUNCA subir
└── SEGURANCA_GITHUB.md    📖 Este guia
```

---

## 🔐 Variáveis Sensíveis

### Backend (.env)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NODE_ENV` | Ambiente | `development` / `production` |
| `PORT` | Porta do servidor | `3001` |
| `JWT_SECRET` | Chave JWT (SECRETO!) | String aleatória |
| `DATABASE_URL` | Caminho do banco | `./sgm.db` |
| `GEMINI_API_KEY` | Chave API Google | Sua chave aqui |

### Frontend (.env.local)

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `NEXT_PUBLIC_API_URL` | URL da API | `http://localhost:3001/api` |

---

## ⚠️ O Que Nunca Fazer

```bash
# ❌ NUNCA commitar arquivos sensíveis
git add .env
git add backend/.env
git add sgm.db

# ❌ NUNCA fazer isso
git add -A
git commit -m "add env files"

# ❌ NUNCA colocar secrets no código
const API_KEY = "sk-abc123xyz"; // ❌ ERRADO

# ❌ NUNCA fazer push de .env
git push origin main  # Se tiver .env, será ignorado pelo .gitignore
```

---

## ✅ Como Fazer Corretamente

```bash
# 1. Criar arquivos locais (nunca commitados)
cp backend/env.example backend/.env
cp nextjs-frontend/.env.example nextjs-frontend/.env.local

# 2. Editar com valores reais
code backend/.env

# 3. Commitar apenas exemplo
git add backend/env.example
git add nextjs-frontend/.env.example
git commit -m "add env examples"

# 4. Verificar que .env está ignorado
git status  # Não deve mostrar .env

# 5. Push seguro
git push origin main
```

---

## 🔄 Compartilhando com Equipe

**Para cada novo desenvolvedor:**

1. **Clonar o repositório:**
   ```bash
   git clone https://github.com/carloska24/sgm-sistema-gestao-manutencao.git
   cd sgm
   ```

2. **Criar seus arquivos .env:**
   ```bash
   # Backend
   cp backend/env.example backend/.env
   
   # Frontend
   cp nextjs-frontend/.env.example nextjs-frontend/.env.local
   ```

3. **Preencher com valores:**
   ```bash
   # Pedir ao líder/gerente os valores reais
   # Nunca usar valores default em produção
   ```

4. **Iniciar o projeto:**
   ```bash
   npm install
   npm start
   ```

---

## 🚨 Se Acidentalmente Commitou um Secret

### Opção 1: Local (Branch Pessoal)

```bash
# 1. Remover do git
git rm --cached .env
git commit --amend

# 2. Force push (APENAS em branch pessoal!)
git push -f origin seu-branch

# 3. IMPORTANTE: Trocar a chave/senha!
```

### Opção 2: Já foi para main (Emergência!)

```bash
# 1. Trocar a chave IMEDIATAMENTE no servidor
# 2. Limpar o histórico git (complexo):
git filter-branch --tree-filter 'rm -f .env' HEAD

# 3. Force push
git push -f

# 4. Avisar a equipe
```

---

## 🛡️ Checklist de Segurança

Antes de fazer commit:

- [ ] Não há `.env` em git status
- [ ] Não há senhas em código
- [ ] Não há API keys em código
- [ ] `.gitignore` está atualizado
- [ ] Revisei `git diff --cached`
- [ ] Nenhum arquivo `.pem` ou `.key`
- [ ] Nenhum arquivo `.db` de produção

---

## 📚 Referências Rápidas

### Gerar JWT_SECRET Seguro

**Windows PowerShell:**
```powershell
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString())) | Select-Object -First 1
```

**Linux/Mac:**
```bash
openssl rand -base64 32
```

**Python:**
```python
import secrets
print(secrets.token_urlsafe(32))
```

---

## 🆘 Precisa de Ajuda?

Se tiver dúvidas:
1. Ler `SEGURANCA_GITHUB.md`
2. Verificar `.gitignore`
3. Consultar documentação oficial
4. Avisar o líder de projeto

---

**Última atualização:** Novembro 2025  
**Status:** ✅ Segurança Implementada

