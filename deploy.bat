@echo off
setlocal enabledelayedexpansion

:: ============================================================
::  jxufe ACM website - one click deploy (Windows)
::
::  Server : root@47.99.92.213
::  Site   : https://jxufe-acm.cn   (nginx root: /var/www/jxufe_acm_vue/dist)
::
::  Auth   : SSH key .deploy\id_ed25519  (no password needed)
::           If the server is ever rebuilt, re-install the key with:
::             type .deploy\id_ed25519.pub | ssh root@47.99.92.213
::               "mkdir -p /root/.ssh && cat >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys"
::
::  NOTE: keep this file PURE ASCII. Chinese (or any non-ASCII) text in a
::        .bat combined with the "chcp" command makes cmd.exe resume reading
::        the file at a wrong byte offset and execute a fragment of a comment
::        as a command. Non-ASCII here = flaky script.
::
::  What ships: the archive is built from the WORKING TREE, but step 2 refuses
::  to run while the uploaded paths differ from HEAD (override: DEPLOY_ALLOW_DIRTY).
::  The server build goes into "dist.new" and is swapped into "dist" only after
::  it succeeded, so a broken build never takes the live site down.
:: ============================================================

:: ---- Server config ----
set SERVER_IP=47.99.92.213
set SERVER_USER=root
set SERVER_PORT=22
set REMOTE_PATH=/var/www/jxufe_acm_vue
set SITE_URL=https://jxufe-acm.cn

:: ---- Local config (leave as is) ----
:: The "prebuild" hook in package.json runs these THREE generators on the server
:: during "npm run build":
::   scripts/gen_group_wall.mjs    club member wall (group_wall.*.json + excellent_members.json)
::                                 from group_members.json, duties.json, scholarships.json,
::                                 wall_rules.json, awards/ and the two site rosters.
::   scripts/gen_event_badges.mjs  timeline medal badges (event_badges.json) from awards/ + events/.
::   scripts/gen_schedule.mjs      upcoming-contest schedule (schedule.auto.json) fetched from the
::                                 contest sites (CCPC / ICPC Beijing / Baidu Star / Chuanzhi / Codeforces /
::                                 AtCoder / RAICOM / Lanqiao-announcements). It is FAIL-SOFT on
::                                 purpose: every source is fetched in parallel with a timeout and a
::                                 one-shot retry, a failing source only warns, and the script always
::                                 exits 0 - a flaky official site must never break a deploy.
::                                 Skip the fetch entirely with:  set SCHEDULE_SKIP_FETCH=1
::                                 Manual handling of the same data: public/data/schedule.json
::                                 ("npm run data:schedule" refetches locally).
::   scripts/lib/data-io.mjs       data-file read policy imported by BOTH wall generators.
::   scripts/lib/schedule-parse.mjs date/HTML parsers for the schedule fetcher (unit-tested in
::                                 test/schedule-parse.test.mjs against the official sites' real text).
::                                 The whole scripts\lib dir is uploaded, so future
::                                 shared helpers come along automatically.
:: ALL of the above must be uploaded - miss one and the server build fails outright
:: (node cannot find the file -> "npm run build" exits non-zero -> deploy stops at step 4).
:: NOT uploaded on purpose:
::   scripts/gen_hero_wall.mjs     the upstream author's 33-avatar wall pipeline. Its product
::                                 (hero_wall.manifest.json) has no consumer left in src/ -
::                                 the home wall reads group_wall.* instead - so it was taken
::                                 out of predev/prebuild as well. Run it by hand if ever needed:
::                                 "npm run data:hero-wall".
::   scripts/*.ps1                 thumbnail generators (PowerShell, Windows only, local only).
set UPLOAD_ITEMS=src public package.json package-lock.json vite.config.js index.html scripts\lib scripts\gen_group_wall.mjs scripts\gen_event_badges.mjs scripts\gen_schedule.mjs
set KEY_FILE=%~dp0.deploy\id_ed25519
set TAR_FILE=%TEMP%\jxufe_acm_deploy.tar.gz
set REMOTE_TAR=/tmp/jxufe_acm_deploy.tar.gz
set TARGET=%SERVER_USER%@%SERVER_IP%
set SSH_OPTS=-p %SERVER_PORT% -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o IdentitiesOnly=yes -i "%KEY_FILE%"
set SCP_OPTS=-P %SERVER_PORT% -o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=20 -o IdentitiesOnly=yes -i "%KEY_FILE%"

cd /d "%~dp0"
title Deploy jxufe ACM to %SERVER_IP%

echo.
echo ============================================
echo   jxufe ACM Deploy Script
echo   Target: %TARGET%:%REMOTE_PATH%
echo ============================================
echo.

:: ---- 1. Local pre-checks ----
echo [1/5] Local pre-checks...
if not exist "%KEY_FILE%" (
    echo [ERROR] Deploy key not found: "%KEY_FILE%"
    goto :fail
)
if not exist "src\main.js" (
    echo [ERROR] "src\main.js" not found. Run this script from the project folder.
    goto :fail
)
if not exist "package.json" (
    echo [ERROR] package.json not found.
    goto :fail
)
where tar >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Windows 'tar' command not found ^(needs Windows 10 1803+^).
    goto :fail
)

:: Tighten the private key ACL. OpenSSH refuses a key that other accounts can
:: read ("UNPROTECTED PRIVATE KEY FILE") and then the whole deploy fails with
:: "Permission denied (publickey)" - which is what happens when the project is
:: copied to a folder that inherits broad permissions (e.g. another drive).
:: Harmless when the key is already fine.
icacls "%KEY_FILE%" /inheritance:r >nul 2>nul
icacls "%KEY_FILE%" /grant:r "%USERNAME%:R" >nul 2>nul

:: ---- 2. Pack project files locally ----
echo [2/5] Packing project files...
:: Guard (2026-09-24): the archive below is built from the WORKING TREE, not from
:: git. Anything uncommitted under the uploaded paths would ship silently, and the
:: damage would only surface later - on a fresh clone, in CI, or for whoever
:: deploys next. So refuse to pack while those paths differ from HEAD.
:: Override on purpose (emergency hotfix):  set DEPLOY_ALLOW_DIRTY=1
set DIRTY=
if "%DEPLOY_ALLOW_DIRTY%"=="1" goto :pack_skip_guard
where git >nul 2>nul
if errorlevel 1 (
    echo [WARN] git not found in PATH - the uncommitted-changes guard is OFF.
    goto :pack_do
)
:: A copied-without-.git tree has no HEAD to compare against - say so instead of
:: pretending the guard ran.
git rev-parse --is-inside-work-tree >nul 2>nul
if errorlevel 1 (
    echo [WARN] not a git working tree - the uncommitted-changes guard is OFF.
    goto :pack_do
)
for /f "delims=" %%L in ('git status --porcelain -- src public package.json package-lock.json vite.config.js index.html scripts/lib scripts/gen_group_wall.mjs scripts/gen_event_badges.mjs scripts/gen_schedule.mjs 2^>nul') do (
    set DIRTY=1
    echo [DIRTY] %%L
)
if not defined DIRTY goto :pack_do
echo [ERROR] The paths listed above differ from HEAD ^(uncommitted or untracked^).
echo         Commit them first, or rerun with:  set DEPLOY_ALLOW_DIRTY=1
goto :fail

:pack_skip_guard
echo [WARN] DEPLOY_ALLOW_DIRTY=1 - shipping the working tree as is.

:pack_do
for /f "delims=" %%L in ('git rev-parse --short HEAD 2^>nul') do echo         shipping HEAD %%L
if exist "%TAR_FILE%" del /q "%TAR_FILE%"
tar -czf "%TAR_FILE%" %UPLOAD_ITEMS%
if errorlevel 1 (
    echo [ERROR] Failed to create archive.
    goto :fail
)

:: ---- 3. Upload and unpack on server ----
echo [3/5] Uploading to server...
ssh %SSH_OPTS% %TARGET% "mkdir -p %REMOTE_PATH%"
if errorlevel 1 (
    echo [ERROR] Cannot connect to %TARGET% via SSH.
    echo         Check the network. If it says "UNPROTECTED PRIVATE KEY FILE",
    echo         run: icacls ".deploy\id_ed25519" /inheritance:r /grant:r "%%USERNAME%%:R"
    goto :fail
)
scp %SCP_OPTS% "%TAR_FILE%" %TARGET%:%REMOTE_TAR%
if errorlevel 1 (
    echo [ERROR] Upload failed.
    goto :fail
)
ssh %SSH_OPTS% %TARGET% "rm -rf %REMOTE_PATH%/src %REMOTE_PATH%/public && tar -xzf %REMOTE_TAR% -C %REMOTE_PATH% && rm -f %REMOTE_TAR%"
if errorlevel 1 (
    echo [ERROR] Failed to unpack archive on server.
    goto :fail
)
echo [OK] Upload completed
echo.

:: ---- 4. Install deps and build on server (into a staging dir) ----
:: Vite empties its output directory before writing, so building straight into
:: "dist" is the one step that can take the LIVE site down (nginx serves
:: %REMOTE_PATH%/dist - see the header). Build into "dist.new" and swap it in
:: only after index.html really exists. The previous build is kept as "dist.old";
:: manual rollback:  cd %REMOTE_PATH% && rm -rf dist && mv dist.old dist
echo [4/5] npm install ^&^& build into dist.new on server...
ssh %SSH_OPTS% %TARGET% "cd %REMOTE_PATH% && npm install --no-audit --no-fund && rm -rf dist.new && npm run build -- --outDir dist.new"
if errorlevel 1 (
    echo [ERROR] Build failed on server. The live site still serves the old dist.
    echo         Fix the cause and rerun - nothing was swapped in.
    goto :fail
)
ssh %SSH_OPTS% %TARGET% "test -f %REMOTE_PATH%/dist.new/index.html"
if errorlevel 1 (
    echo [ERROR] Build finished but dist.new/index.html is missing. Live site untouched.
    goto :fail
)
ssh %SSH_OPTS% %TARGET% "cd %REMOTE_PATH% && rm -rf dist.old && (mv dist dist.old || true) && rm -rf dist && mv dist.new dist && test -f dist/index.html"
if errorlevel 1 (
    echo [ERROR] Swapping dist.new into place failed - the live dist may be missing.
    echo         The previous build is still at %REMOTE_PATH%/dist.old. Roll back with:
    echo           ssh root@%SERVER_IP% "cd %REMOTE_PATH% && rm -rf dist && mv dist.old dist"
    goto :fail
)
echo [OK] Build completed
echo.

:: ---- 5. Reload nginx and verify site ----
echo [5/5] Reloading nginx...
ssh %SSH_OPTS% %TARGET% "nginx -t && systemctl reload nginx"
if errorlevel 1 (
    echo [ERROR] Nginx test/reload failed.
    goto :fail
)
echo [OK] Nginx reloaded
echo.
echo Verifying %SITE_URL% ...
ssh %SSH_OPTS% %TARGET% "curl -s -o /dev/null -w 'HTTP %%{http_code}\n' -k %SITE_URL%/"

echo.
echo ============================================
echo   Deploy success!
echo   %SITE_URL%
echo ============================================
echo.
if "%DEPLOY_NO_PAUSE%"=="1" exit /b 0
pause
exit /b 0

:fail
echo.
echo ============================================
echo   DEPLOY FAILED - see the error above
echo ============================================
echo.
if "%DEPLOY_NO_PAUSE%"=="1" exit /b 1
pause
exit /b 1
