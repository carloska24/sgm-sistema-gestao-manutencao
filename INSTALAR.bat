@echo off
echo ========================================
echo   Instalacao do SGM
echo ========================================
echo.

echo Instalando dependencias do Backend...
cd backend
call npm install
if errorlevel 1 (
    echo Erro ao instalar dependencias do backend!
    pause
    exit /b 1
)
cd ..

echo.
echo Instalando dependencias do Frontend...
cd nextjs-frontend
call npm install
if errorlevel 1 (
    echo Erro ao instalar dependencias do frontend!
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo   Instalacao concluida!
echo ========================================
echo.
echo Próximos passos:
echo 1. Configure o arquivo backend\.env (copie de .env.example)
echo 2. Execute INICIAR.bat para iniciar os servidores
echo.
pause

