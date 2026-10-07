@echo off
rem Starts the Studio dev server (if it is not already running) and the
rem Cloudflare Tunnel. Close this window to take Studio offline.
cd /d "%~dp0.."
netstat -ano | findstr /R /C:"127\.0\.0\.1:5173 .*LISTENING" >nul
if errorlevel 1 (
  start "MathsMap dev server" cmd /k npx vite --config remote/vite.remote.config.js --port 5173 --strictPort --host 127.0.0.1
) else (
  echo A dev server is already running on port 5173.
  echo If the remote address shows "Blocked request", close that server and run this again.
)
set "CLOUDFLARED=cloudflared"
where cloudflared >nul 2>nul || set "CLOUDFLARED=%ProgramFiles(x86)%\cloudflared\cloudflared.exe"
"%CLOUDFLARED%" tunnel run mathsmap-studio
pause
