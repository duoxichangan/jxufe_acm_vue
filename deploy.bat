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

:: ---- 0. Detect changed files via git ----
git rev-parse _deployed >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] First deploy - full upload
    set UPLOAD_SRC=1
    set UPLOAD_PUBLIC=1
    set UPLOAD_PKG=1
    goto :upload
)

:: Compare current HEAD against last deployed commit
git diff --name-only _deployed HEAD > "%TEMP%\deploy_diff.txt"

:: If diff is empty, nothing changed
set DIFF_SIZE=0
for %%A in ("%TEMP%\deploy_diff.txt") do set DIFF_SIZE=%%~zA
if %DIFF_SIZE% equ 0 (
    echo [INFO] No changes since last deploy - skipping
    goto :reload_only
)

echo [INFO] Changed files:
type "%TEMP%\deploy_diff.txt"
echo.

:: Check which directories have changes
set UPLOAD_SRC=0
set UPLOAD_PUBLIC=0
set UPLOAD_PKG=0

for /f "usebackq delims=" %%f in ("%TEMP%\deploy_diff.txt") do (
    set "line=%%f"
    if "!line:~0,4!"=="src/"        set UPLOAD_SRC=1
    if "!line:~0,7!"=="public/"     set UPLOAD_PUBLIC=1
    if "!line!"=="package.json"      set UPLOAD_PKG=1
    if "!line!"=="package-lock.json" set UPLOAD_PKG=1
    if "!line!"=="vite.config.js"    set UPLOAD_PKG=1
    if "!line!"=="index.html"        set UPLOAD_PKG=1
)

del "%TEMP%\deploy_diff.txt"

:: If nothing relevant changed, skip
if !UPLOAD_SRC! equ 0 if !UPLOAD_PUBLIC! equ 0 if !UPLOAD_PKG! equ 0 (
    echo [INFO] No source files changed - skip upload
    goto :save_hash
)

echo [INFO] Upload plan: src=!UPLOAD_SRC!  public=!UPLOAD_PUBLIC!  config=!UPLOAD_PKG!
echo.

:: ---- 1. Upload ----
:upload
echo [1/3] Uploading...

:: Build upload list based on what changed
set "FILES="
if !UPLOAD_SRC! equ 1    set "FILES=!FILES! src"
if !UPLOAD_PUBLIC! equ 1 set "FILES=!FILES! public"
if !UPLOAD_PKG! equ 1    set "FILES=!FILES! package.json package-lock.json vite.config.js index.html"

scp -P %SERVER_PORT% -r !FILES! %SERVER_USER%@%SERVER_IP%:%REMOTE_PATH%
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

:: ---- 3. Mark deployed & reload ----
:save_hash
git tag -f _deployed >nul 2>nul
echo [INFO] Tagged current commit as _deployed

:reload_only
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
