@echo off
chcp 65001 >nul
echo ========================================
echo   SGM - Sistema de Gestão da Manutenção
echo   Iniciando Backend e Frontend
echo ========================================
echo.

REM Verifica se as dependências estão instaladas
if not exist "backend\node_modules" (
    echo [AVISO] Dependências do backend não encontradas!
    echo Instalando dependências do backend...
    cd backend
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependências do backend!
        pause
        exit /b 1
    )
    cd ..
)

if not exist "nextjs-frontend\node_modules" (
    echo [AVISO] Dependências do frontend não encontradas!
    echo Instalando dependências do frontend...
    cd nextjs-frontend
    call npm install
    if errorlevel 1 (
        echo [ERRO] Falha ao instalar dependências do frontend!
        pause
        exit /b 1
    )
    cd ..
)

echo.
echo [INFO] Iniciando servidores...
echo.

REM Inicia o backend em uma janela separada
echo [INFO] Iniciando Backend na porta 3001...
start "SGM Backend" cmd /k "cd /d %~dp0backend && echo ======================================== && echo   SGM BACKEND - Porta 3001 && echo ======================================== && echo. && npm run dev"

REM Aguarda 3 segundos para o backend iniciar
timeout /t 3 /nobreak >nul

REM Inicia o frontend em uma janela separada
echo [INFO] Iniciando Frontend na porta 3000...
start "SGM Frontend" cmd /k "cd /d %~dp0nextjs-frontend && echo ======================================== && echo   SGM FRONTEND - Porta 3000 && echo ======================================== && echo. && npm run dev"

echo.
echo ========================================
echo   Servidores Iniciados!
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo [INFO] Janelas separadas foram abertas para cada servidor.
echo [INFO] Para parar os servidores, feche as janelas ou pressione Ctrl+C em cada uma.
echo.
echo Pressione qualquer tecla para fechar esta janela...
pause >nul

