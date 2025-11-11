# ========================================
# Script para Restaurar o Ambiente Local
# ========================================
# Uso: powershell -ExecutionPolicy Bypass -File restaurar-ambiente.ps1
# EXECUTAR NA PASTA: C:\Workspace\sgm

Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Restaurar Ambiente - SGM" -ForegroundColor Cyan
Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Verificar se está na pasta certa
if (-not (Test-Path "backend") -or -not (Test-Path "nextjs-frontend")) {
    Write-Host "❌ ERRO: Execute este script na pasta raiz do projeto (C:\Workspace\sgm)" -ForegroundColor Red
    Write-Host "Pasta atual: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Pasta correta encontrada" -ForegroundColor Green
Write-Host ""

# Solicitar caminho do backup
Write-Host "📁 Caminho do Backup" -ForegroundColor Yellow
$backupPath = Read-Host "Digite o caminho da pasta de backup (ex: C:\Caminho\sgm-ambiente-backup-2024-01-01_10-30-45)"

# Verificar se backup existe
if (-not (Test-Path $backupPath)) {
    Write-Host "❌ ERRO: Pasta de backup não encontrada: $backupPath" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pasta de backup encontrada" -ForegroundColor Green
Write-Host ""

# 1. Restaurar .env backend
Write-Host "🔐 Restaurando backend/.env..." -ForegroundColor Yellow
$backendEnvFile = "$backupPath/backend-env.txt"
if (Test-Path $backendEnvFile) {
    Copy-Item $backendEnvFile "backend/.env" -Force
    Write-Host "  ✅ backend/.env restaurado" -ForegroundColor Green
    
    # Verificar se contém valores reais
    $content = Get-Content "backend/.env" | Select-String "seu\|example\|fake" -i
    if ($content) {
        Write-Host "  ⚠️  ATENÇÃO: .env pode conter valores de exemplo" -ForegroundColor Yellow
        Write-Host "     Verifique e preencha com valores reais!" -ForegroundColor Yellow
    }
} else {
    Write-Host "  ⚠️  backend-env.txt não encontrado no backup" -ForegroundColor Yellow
}
Write-Host ""

# 2. Restaurar .env frontend
Write-Host "🔐 Restaurando nextjs-frontend/.env.local..." -ForegroundColor Yellow
$frontendEnvFile = "$backupPath/frontend-env.txt"
if (Test-Path $frontendEnvFile) {
    Copy-Item $frontendEnvFile "nextjs-frontend/.env.local" -Force
    Write-Host "  ✅ nextjs-frontend/.env.local restaurado" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  frontend-env.txt não encontrado no backup" -ForegroundColor Yellow
}
Write-Host ""

# 3. Restaurar banco de dados
Write-Host "💾 Restaurando backend/sgm.db..." -ForegroundColor Yellow
$dbFile = "$backupPath/sgm.db"
if (Test-Path $dbFile) {
    # Fazer backup do banco atual (se existir)
    if (Test-Path "backend/sgm.db") {
        Write-Host "  ⚠️  Banco atual será sobrescrito" -ForegroundColor Yellow
        $confirm = Read-Host "  Deseja continuar? (S/N)"
        if ($confirm -ne "S" -and $confirm -ne "s") {
            Write-Host "  ❌ Restauração cancelada" -ForegroundColor Red
            exit 0
        }
    }
    
    Copy-Item $dbFile "backend/sgm.db" -Force
    Write-Host "  ✅ backend/sgm.db restaurado" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  sgm.db não encontrado no backup (será criado novo)" -ForegroundColor Yellow
}
Write-Host ""

# 4. Verificar versões
Write-Host "📝 Verificando Versões..." -ForegroundColor Yellow
$versionsFile = "$backupPath/VERSOES.txt"
if (Test-Path $versionsFile) {
    Write-Host ""
    Write-Host "  Versões esperadas (do PC antigo):" -ForegroundColor Cyan
    Get-Content $versionsFile | Select-String "Node\|NPM\|Git|Sistema" | ForEach-Object {
        Write-Host "  $_" -ForegroundColor White
    }
    Write-Host ""
    
    Write-Host "  Versões atuais (este PC):" -ForegroundColor Cyan
    Write-Host "  Node: $(node --version)" -ForegroundColor White
    Write-Host "  NPM: $(npm --version)" -ForegroundColor White
    Write-Host "  Git: $(git --version)" -ForegroundColor White
} else {
    Write-Host "  ⚠️  VERSOES.txt não encontrado" -ForegroundColor Yellow
}
Write-Host ""

# 5. Instalar dependências com npm ci
Write-Host "📦 Instalando Dependências (npm ci)..." -ForegroundColor Yellow
Write-Host ""

Write-Host "  Backend..." -ForegroundColor Cyan
Push-Location backend
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Erro ao instalar dependências do backend" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "  ✅ Backend dependências instaladas" -ForegroundColor Green
Pop-Location

Write-Host ""
Write-Host "  Frontend..." -ForegroundColor Cyan
Push-Location nextjs-frontend
npm ci
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ❌ Erro ao instalar dependências do frontend" -ForegroundColor Red
    Pop-Location
    exit 1
}
Write-Host "  ✅ Frontend dependências instaladas" -ForegroundColor Green
Pop-Location

Write-Host ""

# 6. Verificação final
Write-Host "✅ Verificação Final..." -ForegroundColor Yellow
Write-Host ""

$checks = @{
    "backend/.env" = Test-Path "backend/.env"
    "nextjs-frontend/.env.local" = Test-Path "nextjs-frontend/.env.local"
    "backend/node_modules" = Test-Path "backend/node_modules"
    "nextjs-frontend/node_modules" = Test-Path "nextjs-frontend/node_modules"
    "backend/sgm.db" = Test-Path "backend/sgm.db"
}

foreach ($check in $checks.GetEnumerator()) {
    $status = if ($check.Value) { "✅" } else { "⚠️" }
    Write-Host "  $status $($check.Name)" -ForegroundColor $(if ($check.Value) { "Green" } else { "Yellow" })
}

Write-Host ""

# 7. Instruções finais
Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Restauração Concluída!" -ForegroundColor Green
Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Próximos Passos:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  1. Verificar .env files:" -ForegroundColor White
Write-Host "     code backend/.env" -ForegroundColor Cyan
Write-Host "     code nextjs-frontend/.env.local" -ForegroundColor Cyan
Write-Host ""
Write-Host "  2. Terminal 1 (Backend):" -ForegroundColor White
Write-Host "     cd backend && npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "  3. Terminal 2 (Frontend):" -ForegroundColor White
Write-Host "     cd nextjs-frontend && npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  4. Abrir no navegador:" -ForegroundColor White
Write-Host "     http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
Write-Host "  5. Fazer login com credenciais" -ForegroundColor White
Write-Host ""

Write-Host "🔒 IMPORTANTE:" -ForegroundColor Red
Write-Host "  - Arquivos .env contêm informações sensíveis" -ForegroundColor White
Write-Host "  - NUNCA commitar .env para GitHub" -ForegroundColor White
Write-Host "  - Verificar que git status não mostra .env" -ForegroundColor White
Write-Host ""

Write-Host "✅ Ambiente Restaurado com Sucesso!" -ForegroundColor Green
Write-Host ""

