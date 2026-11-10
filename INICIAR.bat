@echo off
setlocal
cd /d "%~dp0"
echo ==========================================
echo       PSICOTECNICOS TM - INICIO
echo ==========================================
where node >nul 2>nul
if errorlevel 1 (
  echo No se encuentra Node.js. Instala Node.js 20.19+ o 22.12+.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias la primera vez...
  call npm install
  if errorlevel 1 (
    echo No se pudieron instalar las dependencias.
    pause
    exit /b 1
  )
)
echo Iniciando la plataforma...
call npm run dev
pause
