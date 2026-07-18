@echo off
echo Starting Astra Intelligence...
echo.
cd /d C:\Users\USER\Desktop\astra-intelligence\apps\web
set NODE_TLS_REJECT_UNAUTHORIZED=0
npx next dev --port 3000
