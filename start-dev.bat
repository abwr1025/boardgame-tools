@echo off
title boardgame-tools dev server
cd /d "%~dp0"

echo.
echo   ================================================
echo    Board Game Picker - local dev server
echo   ================================================
echo.

if not exist "node_modules" (
  echo   First run: installing dependencies, please wait...
  echo.
  call npm install
  echo.
)

echo   Starting up, this takes a few seconds...
echo.
echo   Open this URL in your browser:  http://localhost:5173/
echo.
echo   KEEP THIS WINDOW OPEN.
echo   Closing it stops the server. The browser will then show
echo   ERR_CONNECTION_REFUSED.
echo   To stop the server: press Ctrl+C, or just close this window.
echo.
echo   ------------------------------------------------
echo.

call npm run dev

echo.
echo   Server stopped.
pause
