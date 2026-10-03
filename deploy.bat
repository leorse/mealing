@echo off
rem Construit le site puis le publie sur Cloudflare Workers.
cd /d "%~dp0"
call npm run deploy
if errorlevel 1 (
  echo.
  echo ECHEC du deploiement.
) else (
  echo.
  echo Deploiement termine.
)
pause
