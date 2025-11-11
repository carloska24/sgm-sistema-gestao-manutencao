# ========================================
# Script para Fazer Backup do Ambiente Local
# ========================================
# Uso: powershell -ExecutionPolicy Bypass -File backup-ambiente.ps1

Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Backup do Ambiente Local - SGM" -ForegroundColor Cyan
Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Criar pasta de backup
$backupDir = "../sgm-ambiente-backup-$(Get-Date -Format 'yyyy-MM-dd_HH-mm-ss')"
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "📁 Pasta de backup criada: $backupDir" -ForegroundColor Green
Write-Host ""

# 1. Copiar .env do backend
Write-Host "📋 Copiando backend/.env..." -ForegroundColor Yellow
if (Test-Path "backend/.env") {
    Copy-Item "backend/.env" "$backupDir/backend-env.txt"
    Write-Host "  ✅ backend/.env copiado" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  backend/.env não encontrado" -ForegroundColor Yellow
}

# 2. Copiar .env.local do frontend
Write-Host "📋 Copiando nextjs-frontend/.env.local..." -ForegroundColor Yellow
if (Test-Path "nextjs-frontend/.env.local") {
    Copy-Item "nextjs-frontend/.env.local" "$backupDir/frontend-env.txt"
    Write-Host "  ✅ nextjs-frontend/.env.local copiado" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  nextjs-frontend/.env.local não encontrado" -ForegroundColor Yellow
}

# 3. Copiar banco de dados
Write-Host "💾 Copiando backend/sgm.db..." -ForegroundColor Yellow
if (Test-Path "backend/sgm.db") {
    Copy-Item "backend/sgm.db" "$backupDir/sgm.db"
    Write-Host "  ✅ backend/sgm.db copiado" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  backend/sgm.db não encontrado" -ForegroundColor Yellow
}

# 4. Copiar package-lock.json (para npm ci)
Write-Host "📦 Copiando package-lock.json..." -ForegroundColor Yellow
if (Test-Path "backend/package-lock.json") {
    Copy-Item "backend/package-lock.json" "$backupDir/backend-package-lock.json"
    Write-Host "  ✅ backend/package-lock.json copiado" -ForegroundColor Green
}

if (Test-Path "nextjs-frontend/package-lock.json") {
    Copy-Item "nextjs-frontend/package-lock.json" "$backupDir/frontend-package-lock.json"
    Write-Host "  ✅ nextjs-frontend/package-lock.json copiado" -ForegroundColor Green
}

# 5. Salvar versões
Write-Host "📝 Salvando versões..." -ForegroundColor Yellow
$versionsFile = "$backupDir/VERSOES.txt"

@"
Versões do Sistema
==================
Data do Backup: $(Get-Date)

Node.js:
$(node --version)

NPM:
$(npm --version)

Git:
$(git --version)

Git Branch:
$(git branch --show-current)

Git Commit:
$(git log -1 --oneline)

Sistema Operacional:
$([Environment]::OSVersion)
"@ | Out-File -FilePath $versionsFile -Encoding UTF8

Write-Host "  ✅ Versões salvas em VERSOES.txt" -ForegroundColor Green

# 6. Criar arquivo de instruções
Write-Host "📖 Criando instruções de restauração..." -ForegroundColor Yellow
$instructionsFile = "$backupDir/COMO_RESTAURAR.txt"

@"
Como Restaurar o Ambiente no Novo PC
=====================================

1. PREPARAR NOVO PC
   - Instalar Node.js (mesma versão em VERSOES.txt)
   - Instalar Git
   - Clonar repositório:
     git clone https://github.com/carloska24/sgm-sistema-gestao-manutencao.git
     cd sgm

2. RESTAURAR .ENV
   - Copiar backend-env.txt para backend/.env
   - Copiar frontend-env.txt para nextjs-frontend/.env.local

3. RESTAURAR BANCO DE DADOS
   - Copiar sgm.db para backend/sgm.db

4. INSTALAR DEPENDÊNCIAS
   - cd backend && npm ci
   - cd ../nextjs-frontend && npm ci

5. INICIAR
   - Terminal 1: cd backend && npm start
   - Terminal 2: cd nextjs-frontend && npm run dev

6. VERIFICAR
   - http://localhost:3000
   - Deve estar igual ao PC antigo ✅

SEGURANÇA
=========
⚠️  NÃO commitar estes arquivos no GitHub
⚠️  Guardá-los em local seguro
⚠️  Não compartilhar via email/Slack
✅  Usar Drive/Cloud pessoal
✅  Usar pendrive criptografado
"@ | Out-File -FilePath $instructionsFile -Encoding UTF8

Write-Host "  ✅ Instruções criadas em COMO_RESTAURAR.txt" -ForegroundColor Green

# 7. Listar arquivos
Write-Host ""
Write-Host "📂 Arquivos de Backup:" -ForegroundColor Cyan
Get-ChildItem -Path $backupDir -Recurse | ForEach-Object {
    $size = if ($_.PSIsContainer) { "" } else { " ({0:N0} KB)" -f ($_.Length / 1KB) }
    Write-Host "   ✅ $($_.Name)$size" -ForegroundColor Green
}

# 8. Resumo
Write-Host ""
Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  ✅ Backup Concluído!" -ForegroundColor Green
Write-Host "════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📍 Localização do backup:" -ForegroundColor Yellow
Write-Host "   $((Resolve-Path $backupDir).Path)" -ForegroundColor Cyan
Write-Host ""
Write-Host "📝 Próximos passos:" -ForegroundColor Yellow
Write-Host "   1. Guardar pasta em local seguro" -ForegroundColor White
Write-Host "   2. Ler COMO_RESTAURAR.txt" -ForegroundColor White
Write-Host "   3. NO NOVO PC: Restaurar arquivos" -ForegroundColor White
Write-Host ""
Write-Host "🔒 Segurança:" -ForegroundColor Yellow
Write-Host "   - NÃO commitar no GitHub" -ForegroundColor Red
Write-Host "   - NÃO enviar por email" -ForegroundColor Red
Write-Host "   - GUARDAR em local seguro" -ForegroundColor Green
Write-Host ""

