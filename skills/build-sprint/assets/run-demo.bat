@echo off
setlocal EnableExtensions
rem run-demo.bat: one double-click from a fresh clone to the demo in a browser (Windows).
rem   run-demo.bat               demo mode (DEMO=1): no keys and no network needed; opens the browser
rem   run-demo.bat --live        live mode (DEMO=0): uses the keys in your .env
rem   run-demo.bat --check       start, wait for health, print the links, stop (for CI and agents)
rem   run-demo.bat --force-port  free the port even when another program holds it
rem Copy it to the project root, edit the CONFIG block, keep CRLF line endings (cmd misreads labels in LF files).
rem Template from BULLSEYE build-sprint (skills/build-sprint/assets/run-demo.bat). macOS and Linux: run-demo.sh.

rem ---- CONFIG: edit these lines, or set the variables before running ------------------------------
if not defined APP_NAME set "APP_NAME=Demo"
if not defined PORT set "PORT=3000"
if not defined HEALTH_PATH set "HEALTH_PATH=/api/health"
rem One path per golden-path beat, space-separated. No percent signs in links.
if not defined DEMO_LINKS set "DEMO_LINKS=/ /?demo=hero /?autorun=1"
rem Node: build output; when it is missing, "<pm> run build" runs first.
if not defined BUILD_DIR set "BUILD_DIR=.next"
rem Python: the ASGI app that uvicorn serves.
if not defined PY_APP set "PY_APP=app.main:app"
if not defined HEALTH_TIMEOUT set "HEALTH_TIMEOUT=120"
rem START_CMD empty means detect: "<pm> run start" for Node, uvicorn for Python.
rem --------------------------------------------------------------------------------------------------

cd /d "%~dp0"
title %APP_NAME%
set "MODE=demo"
set "CHECK=0"
set "FORCE_PORT=0"
:args
if "%~1"=="" goto args_done
if /i "%~1"=="--live" (set "MODE=live" & shift & goto args)
if /i "%~1"=="--check" (set "CHECK=1" & shift & goto args)
if /i "%~1"=="--force-port" (set "FORCE_PORT=1" & shift & goto args)
if /i "%~1"=="--help" goto help
if /i "%~1"=="-h" goto help
echo   Unknown option %~1 (try --help)
exit /b 2
:args_done

echo.
echo   %APP_NAME%: one-command demo launcher
echo.

rem ---- 1. Runtime and dependencies -----------------------------------------------------------------
if defined START_CMD goto port
if exist "package.json" goto node
if exist "requirements.txt" goto python
if exist "pyproject.toml" goto python
echo   [X] No package.json, requirements.txt or pyproject.toml here. Run this from the project root, or set START_CMD.
goto fail

:node
where node >nul 2>&1
if errorlevel 1 (
  echo   [X] Node.js was not found. Install Node 20 or newer from https://nodejs.org
  goto fail
)
node -e "process.exit(+process.versions.node.split('.')[0] >= 20 ? 0 : 1)"
if errorlevel 1 (
  echo   [X] This demo needs Node 20 or newer.
  goto fail
)
set "PM=npm"
if exist "yarn.lock" set "PM=yarn"
if exist "pnpm-lock.yaml" set "PM=pnpm"
if exist "bun.lock" set "PM=bun"
if exist "bun.lockb" set "PM=bun"
where %PM% >nul 2>&1
if errorlevel 1 (
  echo   [X] %PM% was not found, and the lockfile asks for it. Install it, or delete the lockfile to use npm.
  goto fail
)
for /f "delims=" %%v in ('node -v') do set "NODE_V=%%v"
echo   [OK] Node %NODE_V% with %PM%
if exist "node_modules\" goto node_build
echo   [..] Installing packages, one time...
rem "call" matters: npm and pnpm are batch files, and without it control never comes back.
call %PM% install
if errorlevel 1 (
  echo   [X] %PM% install failed. Read the output above.
  goto fail
)
:node_build
if exist "%BUILD_DIR%" goto node_start
node -e "process.exit(require('./package.json').scripts?.build ? 0 : 1)"
if errorlevel 1 goto node_start
echo   [..] Building the production bundle, one time...
call %PM% run build
if errorlevel 1 (
  echo   [X] The build failed. Read the output above.
  goto fail
)
:node_start
node -e "process.exit(require('./package.json').scripts?.start ? 0 : 1)"
if not errorlevel 1 (
  set "START_CMD=%PM% run start"
  goto port
)
node -e "process.exit(require('./package.json').scripts?.preview ? 0 : 1)"
if not errorlevel 1 (
  set "START_CMD=%PM% run preview"
  goto port
)
set "START_CMD=%PM% run dev"
echo   [warn] No start script, so this runs the dev server. Demo on a production build when you can.
goto port

:python
rem Test that the interpreter RUNS: the Microsoft Store alias sits on PATH but is not Python.
set "PY="
py -3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>&1 && set "PY=py -3"
if not defined PY python -c "import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)" >nul 2>&1 && set "PY=python"
if not defined PY (
  echo   [X] Python 3.10 or newer was not found. Install it from https://python.org and tick "Add python.exe to PATH".
  goto fail
)
if exist ".venv\Scripts\python.exe" goto py_deps
echo   [..] Creating .venv, one time...
%PY% -m venv .venv
if errorlevel 1 (
  echo   [X] Could not create .venv.
  goto fail
)
:py_deps
set "VPY=.venv\Scripts\python.exe"
set "REQ=-e ."
if exist "requirements.txt" set "REQ=-r requirements.txt"
if exist ".venv\.installed" goto py_ready
echo   [..] Installing Python packages, one time. Delete .venv\.installed to reinstall.
%VPY% -m pip install --quiet --disable-pip-version-check %REQ%
if errorlevel 1 (
  echo   [X] pip install failed. Try: %VPY% -m pip install %REQ%
  goto fail
)
type nul > ".venv\.installed"
:py_ready
for /f "delims=" %%v in ('%VPY% --version 2^>^&1') do set "PY_V=%%v"
echo   [OK] %PY_V% in .venv
set "START_CMD=%VPY% -m uvicorn %PY_APP% --host 127.0.0.1 --port %PORT%"
goto port

rem ---- 2. Free the port from a stale demo ------------------------------------------------------------
:port
set "PYTHONUTF8=1"
set "PYTHONIOENCODING=utf-8"
if /i "%MODE%"=="live" (set "DEMO=0") else (set "DEMO=1")
set "URL=http://127.0.0.1:%PORT%"
call :port_pid
if not defined HOLDER goto start
set "HOLDER_NAME=another program"
for /f "tokens=1 delims=," %%n in ('tasklist /fi "PID eq %HOLDER%" /fo csv /nh 2^>nul') do set "HOLDER_NAME=%%~n"
echo %HOLDER_NAME%| findstr /i /x "node.exe python.exe pythonw.exe py.exe bun.exe deno.exe uvicorn.exe" >nul
if not errorlevel 1 goto free_port
if "%FORCE_PORT%"=="1" goto force_port
echo   [X] Port %PORT% is used by %HOLDER_NAME% (PID %HOLDER%), not by an old demo.
echo       Stop it, set PORT to a free port, or rerun with --force-port.
goto fail
:force_port
echo   [..] --force-port: stopping %HOLDER_NAME% (PID %HOLDER%) on port %PORT%.
goto kill_holder
:free_port
echo   [..] Port %PORT% is held by %HOLDER_NAME% (PID %HOLDER%), an old demo. Stopping it.
:kill_holder
taskkill /F /T /PID %HOLDER% >nul 2>&1
rem ping is the sleep: a Unix timeout.exe from Git can shadow the Windows one on PATH.
ping -n 2 127.0.0.1 >nul

rem ---- 3. Start and wait for health ----------------------------------------------------------------
:start
echo   Starting %APP_NAME% in %MODE% mode on %URL%
start "run-demo %APP_NAME%" /b cmd /c "%START_CMD%"
set /a WAITED=0
:wait_health
call :probe "%URL%%HEALTH_PATH%"
if not errorlevel 1 goto healthy
set /a WAITED+=1
if %WAITED% geq %HEALTH_TIMEOUT% goto health_timeout
set /a BEAT=WAITED %% 15
if %BEAT% equ 0 echo   [..] still starting, %WAITED% s
ping -n 2 127.0.0.1 >nul
goto wait_health

rem ---- 4. Print the deep links and open the browser ------------------------------------------------
:healthy
echo   [OK] %APP_NAME% is up: %URL%   health: %URL%%HEALTH_PATH%
echo   Demo links, one per golden-path beat:
set "FIRST="
for /f "tokens=1" %%A in ("%DEMO_LINKS%") do set "FIRST=%%A"
set "REST=%DEMO_LINKS%"
set /a GUARD=0
:links
rem Never start an echoed line with a slash and a question mark: cmd prints echo's help instead. Full URLs avoid it.
if not defined REST goto links_done
set /a GUARD+=1
if %GUARD% gtr 30 goto links_done
for /f "tokens=1* delims= " %%A in ("%REST%") do (
  echo       %URL%%%A
  set "REST=%%B"
)
goto links
:links_done
if "%CHECK%"=="1" goto check_done
if not defined RUN_DEMO_NO_BROWSER start "" "%URL%%FIRST%"
echo.
echo   Press any key in this window to stop %APP_NAME%.
pause >nul
call :stop_server
echo   %APP_NAME% stopped.
exit /b 0

:check_done
call :stop_server
echo   [OK] Check passed: started, healthy, links printed. Stopped.
exit /b 0

:health_timeout
echo   [X] No answer from %URL%%HEALTH_PATH% after %HEALTH_TIMEOUT% seconds. Read the server output above.
call :stop_server
goto fail

rem ---- helpers -------------------------------------------------------------------------------------
:port_pid
set "HOLDER="
for /f "tokens=5" %%p in ('netstat -ano ^| findstr /r /c:":%PORT% .*LISTENING"') do if not defined HOLDER set "HOLDER=%%p"
exit /b 0

:stop_server
call :port_pid
if defined HOLDER taskkill /F /T /PID %HOLDER% >nul 2>&1
exit /b 0

:probe
where curl.exe >nul 2>&1
if errorlevel 1 goto probe_ps
curl.exe -fsS -o NUL --max-time 3 %1 >nul 2>&1
exit /b %errorlevel%
:probe_ps
powershell -NoProfile -Command "try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 3 -Uri '%~1' | Out-Null; exit 0 } catch { exit 1 }" >nul 2>&1
exit /b %errorlevel%

:help
echo   run-demo.bat               demo mode (DEMO=1): no keys and no network needed; opens the browser
echo   run-demo.bat --live        live mode (DEMO=0): uses the keys in your .env
echo   run-demo.bat --check       start, wait for health, print the links, stop (for CI and agents)
echo   run-demo.bat --force-port  free the port even when another program holds it
exit /b 0

:fail
echo.
if "%CHECK%"=="0" if not defined RUN_DEMO_NO_PAUSE pause
exit /b 1
