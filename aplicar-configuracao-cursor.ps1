# ============================================
# Script para Aplicar Configurações do Cursor
# ============================================
# Este script copia todas as configurações do ambiente Cursor
# para um novo projeto, criando o mesmo ambiente de desenvolvimento
# ============================================

param(
    [Parameter(Mandatory=$true)]
    [string]$DestinoProjeto,
    [switch]$InstalarExtensoes
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Aplicando Configurações do Cursor" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se o diretório de destino existe
if (-not (Test-Path $DestinoProjeto)) {
    Write-Host "❌ Erro: O diretório de destino não existe: $DestinoProjeto" -ForegroundColor Red
    Write-Host ""
    Write-Host "Uso: .\aplicar-configuracao-cursor.ps1 -DestinoProjeto 'C:\caminho\do\novo\projeto'" -ForegroundColor Yellow
    exit 1
}

# Obter o diretório atual (onde está o script)
$Origem = $PSScriptRoot
if (-not $Origem) {
    $Origem = Get-Location
}

$DestinoVSCode = Join-Path $DestinoProjeto ".vscode"

Write-Host "📁 Origem: $Origem" -ForegroundColor Gray
Write-Host "📁 Destino: $DestinoProjeto" -ForegroundColor Gray
Write-Host ""

# Verificar se a pasta .vscode existe na origem
$OrigemVSCode = Join-Path $Origem ".vscode"
if (-not (Test-Path $OrigemVSCode)) {
    Write-Host "❌ Erro: A pasta .vscode não foi encontrada na origem" -ForegroundColor Red
    Write-Host "   Certifique-se de executar este script na raiz do projeto atual" -ForegroundColor Yellow
    exit 1
}

# Criar pasta .vscode no destino se não existir
if (-not (Test-Path $DestinoVSCode)) {
    New-Item -ItemType Directory -Path $DestinoVSCode -Force | Out-Null
    Write-Host "✅ Pasta .vscode criada no destino" -ForegroundColor Green
} else {
    Write-Host "⚠️  A pasta .vscode já existe no destino. Arquivos serão sobrescritos." -ForegroundColor Yellow
}

# Copiar arquivos de configuração
$Arquivos = @("settings.json", "extensions.json", "tasks.json")

foreach ($Arquivo in $Arquivos) {
    $OrigemArquivo = Join-Path $OrigemVSCode $Arquivo
    $DestinoArquivo = Join-Path $DestinoVSCode $Arquivo
    
    if (Test-Path $OrigemArquivo) {
        Copy-Item -Path $OrigemArquivo -Destination $DestinoArquivo -Force
        Write-Host "✅ Copiado: $Arquivo" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Arquivo não encontrado: $Arquivo" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Configurações copiadas com sucesso!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Aviso sobre tasks.json
Write-Host "⚠️  IMPORTANTE: Verifique o arquivo tasks.json" -ForegroundColor Yellow
Write-Host "   Você pode precisar ajustar os caminhos específicos do projeto" -ForegroundColor Gray
Write-Host ""

# Instalar extensões se solicitado
if ($InstalarExtensoes) {
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "Instalando Extensões Recomendadas" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    
    $Extensoes = @(
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-typescript-next",
        "formulahendry.auto-rename-tag",
        "christian-kohler.path-intellisense",
        "ms-playwright.playwright",
        "usernamehw.errorlens",
        "wayou.vscode-todo-highlight",
        "aaron-bond.better-comments",
        "gruntfuggly.todo-tree",
        "eamodio.gitlens",
        "ms-vscode.vscode-json"
    )
    
    foreach ($Extensao in $Extensoes) {
        Write-Host "📦 Instalando: $Extensao" -ForegroundColor Gray
        & code --install-extension $Extensao 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "   ✅ Instalada" -ForegroundColor Green
        } else {
            Write-Host "   ⚠️  Já instalada ou erro" -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "✅ Extensões instaladas!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Próximos Passos:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Abra o Cursor no novo projeto: code $DestinoProjeto" -ForegroundColor White
Write-Host "2. Recarregue a janela (Ctrl+Shift+P → 'Reload Window')" -ForegroundColor White
Write-Host "3. Verifique se o tema escuro está aplicado" -ForegroundColor White
Write-Host "4. As extensões serão sugeridas automaticamente" -ForegroundColor White
Write-Host ""
Write-Host "Para instalar as extensões automaticamente, execute:" -ForegroundColor Gray
Write-Host "  .\aplicar-configuracao-cursor.ps1 -DestinoProjeto '$DestinoProjeto' -InstalarExtensoes" -ForegroundColor Yellow
Write-Host ""

