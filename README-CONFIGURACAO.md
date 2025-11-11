# 🚀 Guia Rápido: Aplicar Configurações do Cursor

Este projeto contém todas as configurações necessárias para replicar o ambiente do Cursor em outros projetos.

## 📦 Arquivos de Configuração

- **`.vscode/settings.json`** - Todas as configurações do editor
- **`.vscode/extensions.json`** - Extensões recomendadas
- **`.vscode/tasks.json`** - Tarefas personalizadas (ajuste conforme necessário)
- **`.prettierrc`** - Configurações do Prettier

## 🎯 Método 1: Script Automático (Recomendado)

Use o script PowerShell para aplicar automaticamente:

```powershell
.\aplicar-configuracao-cursor.ps1 -DestinoProjeto "C:\caminho\do\novo\projeto"
```

Para instalar as extensões automaticamente também:

```powershell
.\aplicar-configuracao-cursor.ps1 -DestinoProjeto "C:\caminho\do\novo\projeto" -InstalarExtensoes
```

## 🎯 Método 2: Cópia Manual

1. **Copie a pasta `.vscode`** para a raiz do novo projeto
2. **Copie o arquivo `.prettierrc`** (se usar Prettier)
3. **Abra o Cursor** no novo projeto
4. **Recarregue a janela**: `Ctrl+Shift+P` → "Reload Window"
5. **Instale as extensões** sugeridas automaticamente

## 📋 Checklist de Instalação

- [ ] Pasta `.vscode` copiada para o novo projeto
- [ ] Arquivo `.prettierrc` copiado (se necessário)
- [ ] Cursor aberto no novo projeto
- [ ] Janela recarregada
- [ ] Extensões recomendadas instaladas
- [ ] Tema escuro aplicado
- [ ] Formatação automática funcionando

## 🔧 Ajustes Necessários

### tasks.json

O arquivo `tasks.json` contém caminhos específicos do projeto atual. Você precisará ajustar:

```json
{
  "label": "Iniciar servidor backend",
  "command": "cd SEU_CAMINHO_AQUI; npm run start",
  ...
}
```

## 📚 Documentação Completa

Para instruções detalhadas, consulte:
- **`CURSOR-ENVIRONMENT-SETUP.md`** - Guia completo com todas as informações
- **`CONFIGURACAO-CURSOR-COMPLETA.json`** - Referência rápida das configurações

## 🎨 Características do Ambiente

- ✅ Tema escuro customizado (Slate)
- ✅ Formatação automática (Prettier)
- ✅ Auto-save após 1 segundo
- ✅ Cores de sintaxe personalizadas
- ✅ Terminal PowerShell customizado
- ✅ 13 extensões recomendadas
- ✅ Configurações otimizadas para TypeScript/React

## ⚡ Comandos Úteis

### Instalar todas as extensões manualmente:

```powershell
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension formulahendry.auto-rename-tag
code --install-extension christian-kohler.path-intellisense
code --install-extension ms-playwright.playwright
code --install-extension usernamehw.errorlens
code --install-extension wayou.vscode-todo-highlight
code --install-extension aaron-bond.better-comments
code --install-extension gruntfuggly.todo-tree
code --install-extension eamodio.gitlens
code --install-extension ms-vscode.vscode-json
```

### Verificar se as configurações foram aplicadas:

1. Abra o Cursor
2. `Ctrl+Shift+P` → "Preferences: Open Settings (JSON)"
3. Verifique se as configurações estão presentes

## 🆘 Problemas Comuns

**Prettier não formata automaticamente:**
- Verifique se a extensão está instalada
- Certifique-se de que `editor.defaultFormatter` está configurado

**Cores não aparecem:**
- Recarregue a janela: `Ctrl+Shift+P` → "Reload Window"

**Extensões não são sugeridas:**
- Certifique-se de que `extensions.json` está na pasta `.vscode`
- Feche e reabra o Cursor

---

**Criado em:** 2025-01-04  
**Versão:** 1.0.0

