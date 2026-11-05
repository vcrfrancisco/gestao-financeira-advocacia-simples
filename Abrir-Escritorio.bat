@echo off
rem Dois cliques para abrir o Escritorio no Windows.
rem Se o computador nao tiver Node.js, baixa uma copia so para o programa, na pasta .node.
chcp 65001 >nul
title Escritorio
cd /d "%~dp0"
set "VERSAO=v26.13.0"

where node >nul 2>nul && node -e "const [a,b]=process.versions.node.split('.').map(Number); process.exit(a>20||(a===20&&b>=9)?0:1)" && goto iniciar

if exist ".node\node.exe" goto usar_copia
set "PACOTE=win-x64"
if /i "%PROCESSOR_ARCHITECTURE%"=="ARM64" set "PACOTE=win-arm64"
echo Preparando o programa pela primeira vez (baixando o Node.js)...
curl.exe -fL --progress-bar -o "%TEMP%\node-escritorio.zip" "https://nodejs.org/dist/%VERSAO%/node-%VERSAO%-%PACOTE%.zip"
if errorlevel 1 goto erro_download
if exist "node-%VERSAO%-%PACOTE%" rmdir /s /q "node-%VERSAO%-%PACOTE%"
tar -xf "%TEMP%\node-escritorio.zip"
if errorlevel 1 goto erro_download
ren "node-%VERSAO%-%PACOTE%" .node
del "%TEMP%\node-escritorio.zip"

:usar_copia
set "PATH=%~dp0.node;%PATH%"

:iniciar
node scripts\iniciar.mjs
if errorlevel 1 pause
exit /b

:erro_download
echo.
echo ERRO: Nao consegui baixar o Node.js. Verifique a internet e tente de novo.
pause
exit /b 1
