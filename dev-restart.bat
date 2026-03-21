@echo off
setlocal enabledelayedexpansion

echo === LMS Platform: Restart All ===
echo.

:: Kill by port (more reliable on Windows)
echo [1/5] Killing processes on ports 4000, 3000, 3001, 3002...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000 " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3001 " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3002 " ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
echo Done.

:: Also try to kill all node processes (safer for dev)
taskkill /F /IM node.exe >nul 2>&1
echo Done.

echo.
echo [2/5] Waiting for ports to release (3s)...
timeout /t 3 /nobreak >nul

:: Verify ports are free
netstat -ano | findstr ":4000 :3000 :3001 :3002" | findstr LISTENING >nul 2>&1
if !errorlevel! equ 0 (
    echo WARNING: Some ports still in use. Retrying kill...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":4000 :3000 :3001 :3002" ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
    timeout /t 2 /nobreak >nul
)

echo [3/5] Cleaning build cache...
rd /s /q apps\api-server\dist 2>nul
rd /s /q apps\web-student\.next 2>nul
rd /s /q apps\web-admin\.next 2>nul
rd /s /q apps\super-portal\.next 2>nul
rd /s /q apps\super-portal\.turbo 2>nul
rd /s /q apps\web-admin\.turbo 2>nul
rd /s /q apps\web-student\.turbo 2>nul
rd /s /q apps\api-server\.turbo 2>nul
echo Done.

echo.
echo [4/5] Starting API server (port 4000)...
start "LMS-API" cmd /k "cd /d %CD% && pnpm run dev --filter api-server"

echo [5/5] Starting Frontend apps...
start "LMS-Admin" cmd /k "cd /d %CD% && pnpm run dev --filter web-admin"
start "LMS-Student" cmd /k "cd /d %CD% && pnpm run dev --filter web-student"
start "LMS-Portal" cmd /k "cd /d %D% && pnpm run dev --filter super-portal"

echo.
echo === Started ===
echo   API Server:   http://localhost:4000
echo   Web Admin:    http://localhost:3000/vi/login
echo   Web Student:  http://localhost:3001/vi/login
echo   Super Portal: http://localhost:3002/vi/
echo.
echo IMPORTANT: Clear browser localStorage first!
echo   DevTools (F12) -^> Application -^> Local Storage -^> Delete all
echo   Or run: localStorage.clear(); location.reload();
echo.
endlocal
