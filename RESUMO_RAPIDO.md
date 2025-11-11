# ⚡ Resumo Rápido - Clone em Novo PC

## Em 5 Minutos ⏱️

### 1️⃣ Clonar (1 minuto)
```bash
git clone https://github.com/carloska24/sgm-sistema-gestao-manutencao.git
cd sgm
```

### 2️⃣ Criar .env (1 minuto)
```bash
# Backend
copy backend\env.example backend\.env

# Frontend
copy nextjs-frontend\.env.example nextjs-frontend\.env.local
```

### 3️⃣ Preencher .env (2 minutos)
```bash
# Backend (.env)
NODE_ENV=development
PORT=3001
JWT_SECRET=qualquer-coisa-segura-aqui
DATABASE_URL=./sgm.db

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4️⃣ Instalar e Rodar (1 minuto)
```bash
# Instalar
npm install --prefix backend
npm install --prefix nextjs-frontend

# Terminal 1:
cd backend && npm start

# Terminal 2:
cd nextjs-frontend && npm run dev
```

✅ Abrir `http://localhost:3000` no navegador

---

## 🚀 Quando Clonar

```
┌─────────────────────┐
│  git clone ...      │
│  Baixa todos files  │
│  EXCETO .env        │ ← .gitignore protege
│  EXCETO *.db        │
│  EXCETO node_mods   │
└─────────────────────┘
         ↓
┌─────────────────────┐
│ cp .env.example     │
│ → .env              │ ← Você cria
└─────────────────────┘
         ↓
┌─────────────────────┐
│ Editar .env com     │
│ valores reais       │ ← Você preenche
└─────────────────────┘
         ↓
┌─────────────────────┐
│ npm install         │
│ npm start           │ ← Funciona!
└─────────────────────┘
```

---

## 📋 Checklist

- [ ] Git instalado
- [ ] Node.js instalado
- [ ] Repositório clonado
- [ ] Arquivos .env criados
- [ ] Valores .env preenchidos
- [ ] `npm install` executado
- [ ] Backend rodando (porta 3001)
- [ ] Frontend rodando (porta 3000)
- [ ] Login funciona

---

## ⚠️ IMPORTANTE

### ❌ Nunca Fazer
```bash
git add .env                    # ❌ .env local
git add backend/sgm.db          # ❌ banco local
git push origin main            # Sem .env
```

### ✅ Sempre Fazer
```bash
git add .env.example            # ✅ modelo
git add SEGURANCA_GITHUB.md     # ✅ documentação
git commit -m "..."             # .env ignorado automaticamente
git push origin main
```

---

## 🆘 Problemas?

### Porta em Uso
```bash
# Mudar porta
PORT=3002 npm start
```

### Dependências Faltando
```bash
npm install
```

### .env Não Encontrado
```bash
# Certifique-se que criou:
backend/.env
nextjs-frontend/.env.local
```

---

## 📚 Documentos Úteis

- `SETUP_NOVO_PC.md` - Guia detalhado
- `SEGURANCA_GITHUB.md` - Segurança
- `COMO_CONFIGURAR_ENV.md` - Variáveis
- `README.md` - Visão geral do projeto

---

## 🎯 Próximos Passos

1. Setup concluído?
   - Sim → Leia `README.md`
   - Não → Verifique problemas acima

2. Quer contribuir?
   - Leia `DESENVOLVIMENTO.md`

3. Dúvidas?
   - Consulte `SEGURANCA_GITHUB.md`

---

**Resumido para:** Clonagem rápida e segura  
**Última atualização:** Novembro 2025  
**Status:** ✅ Pronto

