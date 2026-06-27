@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  Server Config
:: ============================================================
set SERVER_IP=47.99.92.213
set SERVER_USER=root
set SERVER_PORT=22
set REMOTE_PATH=/var/www/jxufe_acm_vue
:: ============================================================

title Deploy to %SERVER_USER%@%SERVER_IP%

echo.
echo ============================================
echo   jxufe ACM Deploy Script
echo ============================================
echo.

:: ---- Detect rsync ----
set USE_RSYNC=0
where rsync >nul 2>nul
if %errorlevel% equ 0 (
    set USE_RSYNC=1
    echo [INFO] rsync detected - incremental upload mode
) else (
    echo [INFO] rsync not found - full upload mode
    echo [INFO] Install rsync for faster uploads: https://itefix.net/cwrsync
)
echo.

:: ---- 1. Upload source files ----
echo [1/3] Upload src/ public/ + config files...

if %USE_RSYNC% equ 1 (
    :: rsync: only transfers changed files, deletes stale files on server
    rsync -avz --delete --progress -e "ssh -p %SERVER_PORT%" ^
        src/ public/ package.json package-lock.json vite.config.js index.html ^
        %SERVER_USER%@%SERVER_IP%:%REMOTE_PATH%/
) else (
    :: scp: full upload fallback
    scp -P %SERVER_PORT% -r src public package.json package-lock.json vite.config.js index.html %SERVER_USER%@%SERVER_IP%:%REMOTE_PATH%
)

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Upload failed! Check network / SSH connection.
    pause
    exit /b 1
)
echo [OK] Upload completed
echo.

:: ---- 2. Build on server ----
echo [2/3] npm install ^&^& npm run build on server...
ssh -p %SERVER_PORT% %SERVER_USER%@%SERVER_IP% "cd %REMOTE_PATH% && npm install && npm run build"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Build failed on server!
    pause
    exit /b 1
)
echo [OK] Build completed
echo.

:: ---- 3. Reload Nginx ----
echo [3/3] Reload Nginx...
ssh -p %SERVER_PORT% %SERVER_USER%@%SERVER_IP% "systemctl reload nginx"
if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Nginx reload failed! Check server status.
    pause
    exit /b 1
)
echo [OK] Nginx reloaded
echo.

echo ============================================
echo   Deploy success!
echo ============================================
echo.
pause
