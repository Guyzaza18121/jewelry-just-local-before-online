@echo off
cd /d "%~dp0"
echo Starting Jewelry Admin Server...
echo Opening browser at http://localhost:5000
start http://localhost:5000
node server/server.js
pause
