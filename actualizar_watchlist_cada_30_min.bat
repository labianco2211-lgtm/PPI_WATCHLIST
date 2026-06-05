@echo off
setlocal
cd /d "%~dp0"

echo PPI Watchlist - actualizacion local cada 30 minutos
echo Monitoreo principal recomendado: GitHub Actions.
echo Este proceso local no usa credenciales de PPI y solo llama fuentes publicas.
echo Presione Ctrl+C para detener.
echo.

:loop
echo [%date% %time%] Actualizando data\watchlist.json...
node tools\update-watchlist.mjs
if errorlevel 1 (
  echo Aviso: el actualizador marco ERROR. Revisar data\watchlist.json y la salida anterior.
) else (
  echo Actualizacion local finalizada.
)
echo Esperando 30 minutos...
timeout /t 1800 /nobreak >nul
goto loop
