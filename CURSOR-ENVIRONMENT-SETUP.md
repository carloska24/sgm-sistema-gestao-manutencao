# Configuração do Ambiente Cursor

Este arquivo contém todas as configurações necessárias para replicar o ambiente do Cursor em outro projeto.

## 📋 Instruções de Instalação

### 1. Copiar Arquivos de Configuração

Copie a pasta `.vscode` completa para a raiz do seu novo projeto:

```bash
# Copie a pasta .vscode do projeto atual para o novo projeto
cp -r .vscode /caminho/do/novo/projeto/
```

Ou no Windows PowerShell:
```powershell
Copy-Item -Path ".\.vscode" -Destination "C:\caminho\do\novo\projeto\" -Recurse
```

### 2. Instalar Extensões Recomendadas

As extensões serão sugeridas automaticamente pelo Cursor/VS Code quando você abrir o projeto. Você também pode instalar manualmente executando:

```powershell
# No PowerShell, dentro do diretório do projeto
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

### 3. Configurar Fontes (Opcional)

Para ter a melhor experiência visual, instale as seguintes fontes:

- **Inter** (para o editor)
- **Cascadia Code** ou **Fira Code** (para código com ligaduras)

Download:
- Cascadia Code: https://github.com/microsoft/cascadia-code
- Fira Code: https://github.com/tonsky/FiraCode

### 4. Verificar Configurações

Após copiar os arquivos, abra o Cursor no novo projeto e verifique:

1. ✅ O tema escuro está aplicado
2. ✅ As cores personalizadas estão ativas
3. ✅ O Prettier está formatando automaticamente ao salvar
4. ✅ As extensões foram instaladas

## 📁 Estrutura de Arquivos

```
projeto/
├── .vscode/
│   ├── settings.json      # Configurações do editor
│   ├── extensions.json    # Extensões recomendadas
│   └── tasks.json         # Tarefas personalizadas
└── CURSOR-ENVIRONMENT-SETUP.md (este arquivo)
```

## 🎨 Características do Ambiente

### Tema Visual
- Tema escuro customizado (Slate-900/800)
- Cores de sintaxe personalizadas
- Terminal com tema escuro
- Scrollbar customizada

### Funcionalidades
- ✅ Formatação automática ao salvar (Prettier)
- ✅ Auto-save após 1 segundo
- ✅ Tab size: 2 espaços
- ✅ Single quotes para JS/TS
- ✅ Word wrap ativado
- ✅ Bracket pair colorization
- ✅ Git integrado

### Extensões Principais
- **Prettier**: Formatação de código
- **ESLint**: Linting de JavaScript/TypeScript
- **Tailwind CSS IntelliSense**: Autocomplete para Tailwind
- **Error Lens**: Mostra erros inline
- **GitLens**: Melhor visualização do Git
- **Auto Rename Tag**: Renomeia tags HTML/JSX automaticamente

## ⚙️ Configurações Personalizadas

### Editor
- Fonte: Inter, Cascadia Code, Fira Code
- Tamanho: 14px
- Altura da linha: 1.6
- Tab size: 2 espaços
- Ligaduras de fonte: Ativadas

### Prettier
- Single quotes: `true`
- Trailing comma: `es5`
- Tab width: `2`
- Semi: `true`
- Print width: `100`
- Arrow parens: `avoid`

### Terminal
- Perfil padrão: PowerShell (Windows)
- Tema: Escuro customizado
- Fonte: Cascadia Code

## 🔧 Ajustes para Novos Projetos

### Atualizar tasks.json

Se você copiar o `tasks.json`, lembre-se de atualizar os caminhos específicos do projeto:

```json
{
  "label": "Iniciar servidor backend",
  "command": "cd SEU_CAMINHO_AQUI; npm run start",
  ...
}
```

### Ajustar TypeScript/JavaScript

Se seu projeto usar configurações diferentes:
- Verifique `tsconfig.json` ou `jsconfig.json`
- Ajuste as configurações de formatação no `settings.json` se necessário

## 📝 Notas

- As configurações são específicas para este ambiente de desenvolvimento
- Algumas configurações podem precisar de ajustes dependendo do tipo de projeto
- O tema escuro está otimizado para trabalhar com Slate colors (Tailwind)

## 🆘 Problemas Comuns

### Prettier não está formatando
1. Verifique se a extensão está instalada
2. Certifique-se de que `editor.defaultFormatter` está configurado
3. Verifique se há arquivo `.prettierrc` no projeto que pode estar sobrescrevendo

### Cores não aparecem corretamente
1. Recarregue a janela do Cursor: `Ctrl+Shift+P` → "Reload Window"
2. Verifique se o tema está definido como "Default Dark+"

### Extensões não são sugeridas
1. Certifique-se de que o arquivo `extensions.json` está na pasta `.vscode`
2. Feche e reabra o Cursor

