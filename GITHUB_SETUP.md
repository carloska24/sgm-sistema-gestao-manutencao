# 📦 Guia Rápido: Criar Repositório no GitHub

Este guia mostra os comandos exatos para criar e enviar seu projeto para o GitHub.

## 🚀 Passo a Passo

### 1. Criar o Repositório no GitHub

1. Acesse [github.com](https://github.com) e faça login
2. Clique no botão **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Preencha:
   - **Repository name**: `sgm-sistema-gestao-manutencao`
   - **Description**: Sistema de Gestão da Manutenção - SGM
   - **Visibility**: Escolha **Public** ou **Private**
   - ⚠️ **NÃO** marque "Add a README file"
   - ⚠️ **NÃO** marque "Add .gitignore"
5. Clique em **"Create repository"**

### 2. Executar os Comandos

Abra o terminal na pasta do projeto SGM e execute:

```bash
# Verificar se já está em um repositório git
git status

# Se não estiver inicializado, inicializar
git init

# Adicionar todos os arquivos
git add .

# Fazer commit inicial
git commit -m "Initial commit: SGM - Sistema de Gestão da Manutenção

- Frontend Next.js com TypeScript
- Backend Express com SQLite
- Sistema completo de gestão de manutenção
- Design moderno com Tailwind CSS e Framer Motion"

# Adicionar o repositório remoto (SUBSTITUA SEU_USUARIO pelo seu usuário do GitHub)
git remote add origin https://github.com/SEU_USUARIO/sgm-sistema-gestao-manutencao.git

# Renomear branch para main (se necessário)
git branch -M main

# Enviar para o GitHub
git push -u origin main
```

### 3. Verificar

Após executar os comandos:

1. Acesse seu repositório no GitHub
2. Verifique se todos os arquivos foram enviados
3. Confirme que o README.md está visível

### 4. Próximos Passos

Após criar o repositório, siga o guia de deploy:

📖 **[DEPLOY.md](./DEPLOY.md)** - Guia completo de deploy na Netlify

---

## 🔧 Comandos Úteis

### Adicionar mudanças futuras

```bash
git add .
git commit -m "Descrição das mudanças"
git push
```

### Verificar status

```bash
git status
```

### Ver histórico

```bash
git log --oneline
```

---

## ⚠️ Importante

- **Nunca** commite arquivos `.env` ou `.env.local`
- **Nunca** commite arquivos de banco de dados (`.db`, `.sqlite`)
- **Nunca** commite a pasta `node_modules/`
- Sempre revise o que está sendo adicionado com `git status` antes de commitar

---

## 🎉 Pronto!

Seu código está no GitHub e pronto para deploy!

