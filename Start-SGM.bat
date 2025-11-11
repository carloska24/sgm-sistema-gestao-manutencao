@echo off
setlocal ENABLEDELAYEDEXPANSION

REM =============================================
REM Configurações Iniciais
REM =============================================
set "ROOT=%~dp0"
set "BACKEND_DIR=%ROOT%backend"
set "FRONTEND_DIR=%ROOT%nextjs-frontend"
set "TITLE=SGM Launcher"

REM Define cores (0 = preto, B = ciano)
color 0B
mode con cols=95 lines=30

title %TITLE%

:MENU
cls
call :drawHeader

echo.
echo                        Escolha qual experiência deseja iniciar hoje:
echo.
echo                        [ 1 ]  Versao 1 - Layout clássico (Sidebar Fixa)
echo                        [ 2 ]  Versao 2 - Layout dinâmico (Menu Inteligente)
echo.
echo                        [ X ]  Sair sem iniciar nada

echo.
choice /C 12X /N /M "Selecione uma opcao e pressione ENTER: "
set "OPTION=%errorlevel%"

if "%OPTION%"=="1" goto START_V1
if "%OPTION%"=="2" goto START_V2
goto END

:START_V1
call :setLayout v1 "Layout classico ativado (V1)"
call :launch "V1 - Layout Classico"
goto END

:START_V2
call :setLayout v2 "Layout dinâmico ativado (V2)"
call :launch "V2 - Layout Dinamico"
goto END

:setLayout
set "TARGET=%~1"
set "MESSAGE=%~2"
cls
call :drawHeader

echo.
echo                        Preparando ambiente: !MESSAGE!
echo.

pushd "%FRONTEND_DIR%"
call npm run layout:%TARGET% >nul
if errorlevel 1 (
  echo                        Ocorreu um erro ao configurar o layout %TARGET%.
  echo                        Verifique se as dependencias foram instaladas.^& pressione qualquer tecla para continuar.
  pause >nul
  popd
  goto MENU
)
popd

REM Ajusta mensagem para uso posterior
set "CURRENT_LABEL=%~2"
exit /b

:launch
set "SESSION_LABEL=%~1"
cls
call :drawHeader

echo.
echo                        Tudo pronto! Abrindo os terminais amigaveis...
echo.
echo                        Sessao selecionada: !SESSION_LABEL!
echo.

REM =============================================
REM Abre Backend em janela dedicada
REM =============================================
set "PS1=Set-Location '%BACKEND_DIR%' ;"
set "PS1=!PS1! Write-Host '=== SGM Backend - !SESSION_LABEL! ===' -ForegroundColor Cyan ;"
set "PS1=!PS1! if (-Not (Test-Path 'node_modules')) { Write-Host 'Instalando dependencias...' -ForegroundColor Yellow ; npm install } ;"
set "PS1=!PS1! Write-Host 'Iniciando servidor na porta 3001' -ForegroundColor Green ;"
set "PS1=!PS1! npm run dev"

start "SGM Backend" powershell -NoExit -Command "& { !PS1! }"

REM =============================================
REM Abre Frontend em janela dedicada
REM =============================================
set "PS2=Set-Location '%FRONTEND_DIR%' ;"
set "PS2=!PS2! Write-Host '=== SGM Frontend - !SESSION_LABEL! ===' -ForegroundColor Cyan ;"
set "PS2=!PS2! if (-Not (Test-Path 'node_modules')) { Write-Host 'Instalando dependencias...' -ForegroundColor Yellow ; npm install } ;"
set "PS2=!PS2! Write-Host 'Iniciando Next.js na porta 3000' -ForegroundColor Green ;"
set "PS2=!PS2! npm run dev"

start "SGM Frontend" powershell -NoExit -Command "& { !PS2! }"

echo                        Janelas abertas com sucesso! Aproveite a operação.
echo.
echo                        Pode fechar este painel ou pressionar qualquer tecla para retornar ao menu.
pause >nul
goto MENU

:drawHeader
echo ===============================================================================================
echo ==                                                                                        ==
echo ==                                S G M   L A U N C H E R                                 ==
echo ==                                                                                        ==
echo ===============================================================================================
exit /b

:END
cls
echo.
echo                        Obrigado por utilizar o SGM Launcher! Ate logo.
echo.
pause >nul
endlocal
exit /b
