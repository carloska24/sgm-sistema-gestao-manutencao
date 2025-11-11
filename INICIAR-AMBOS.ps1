# SGM - Sistema de Gestão da Manutenção
# Script para iniciar Backend e Frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  SGM - Sistema de Gestão da Manutenção" -ForegroundColor Cyan
Write-Host "  Iniciando Backend e Frontend" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verifica se as dependências estão instaladas
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "[AVISO] Dependências do backend não encontradas!" -ForegroundColor Yellow
    Write-Host "Instalando dependências do backend..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao instalar dependências do backend!" -ForegroundColor Red
        Set-Location ..
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    Set-Location ..
}

if (-not (Test-Path "nextjs-frontend\node_modules")) {
    Write-Host "[AVISO] Dependências do frontend não encontradas!" -ForegroundColor Yellow
    Write-Host "Instalando dependências do frontend..." -ForegroundColor Yellow
    Set-Location nextjs-frontend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERRO] Falha ao instalar dependências do frontend!" -ForegroundColor Red
        Set-Location ..
        Read-Host "Pressione Enter para sair"
        exit 1
    }
    Set-Location ..
}

Write-Host ""
Write-Host "[INFO] Iniciando servidores..." -ForegroundColor Green
Write-Host ""

# Obtém o diretório do script
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Inicia o backend em uma nova janela
Write-Host "[INFO] Iniciando Backend na porta 3001..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\backend'; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  SGM BACKEND - Porta 3001' -ForegroundColor Cyan; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; npm run dev"

# Aguarda 3 segundos para o backend iniciar
Start-Sleep -Seconds 3

# Inicia o frontend em uma nova janela
Write-Host "[INFO] Iniciando Frontend na porta 3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath\nextjs-frontend'; Write-Host '========================================' -ForegroundColor Cyan; Write-Host '  SGM FRONTEND - Porta 3000' -ForegroundColor Cyan; Write-Host '========================================' -ForegroundColor Cyan; Write-Host ''; npm run dev"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Servidores Iniciados!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Backend:  http://localhost:3001" -ForegroundColor Yellow
Write-Host "Frontend: http://localhost:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "[INFO] Janelas separadas foram abertas para cada servidor." -ForegroundColor Cyan
Write-Host "[INFO] Para parar os servidores, feche as janelas ou pressione Ctrl+C em cada uma." -ForegroundColor Cyan
Write-Host ""
Read-Host "Pressione Enter para fechar esta janela"

