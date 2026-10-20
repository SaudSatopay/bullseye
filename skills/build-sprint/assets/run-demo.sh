#!/usr/bin/env bash
# run-demo.sh: one command from a fresh clone to the demo in a browser (macOS, Linux, Git Bash).
#   ./run-demo.sh               demo mode (DEMO=1): no keys and no network needed; opens the browser
#   ./run-demo.sh --live        live mode (DEMO=0): uses the keys in your .env
#   ./run-demo.sh --check       start, wait for health, print the links, stop (for CI and agents)
#   ./run-demo.sh --force-port  free the port even when another program holds it
# Copy it to the project root, edit the CONFIG block, keep LF line endings. On Windows, use run-demo.bat.
# Template from BULLSEYE build-sprint (skills/build-sprint/assets/run-demo.sh).
set -u

# ---- CONFIG: edit these lines, or override them as environment variables -----------------------
APP_NAME="${APP_NAME:-Demo}"
PORT="${PORT:-3000}"                       # the start command must listen here (Next.js reads PORT)
HEALTH_PATH="${HEALTH_PATH:-/api/health}"
DEMO_LINKS="${DEMO_LINKS:-/ /?demo=hero /?autorun=1}"   # one path per golden-path beat, space-separated
START_CMD="${START_CMD:-}"                 # empty: "<pm> run start" for Node, uvicorn for Python
                                           # Vite: START_CMD="npm run preview -- --port 3000 --strictPort"
BUILD_DIR="${BUILD_DIR:-.next}"            # Node: build output; when missing, "<pm> run build" runs first
PY_APP="${PY_APP:-app.main:app}"           # Python: the ASGI app that uvicorn serves
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-120}"    # seconds to wait for the health endpoint
# --------------------------------------------------------------------------------------------------

MODE=demo; CHECK=0; FORCE_PORT=0
for arg in "$@"; do
  case "$arg" in
    --live) MODE=live ;;
    --check) CHECK=1 ;;
    --force-port) FORCE_PORT=1 ;;
    -h|--help) sed -n '2,6p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg (try --help)" >&2; exit 2 ;;
  esac
done
cd "$(dirname "$0")" || exit 1

say()  { printf '  %s\n' "$*"; }
fail() { printf '  [X] %s\n' "$*" >&2; exit 1; }
case "$(uname -s 2>/dev/null)" in MINGW*|MSYS*|CYGWIN*) IS_WIN=1 ;; *) IS_WIN=0 ;; esac
echo
say "$APP_NAME: one-command demo launcher"
echo

# ---- 1. Runtime and dependencies -----------------------------------------------------------------
if [ -z "$START_CMD" ] && [ -f package.json ]; then
  command -v node >/dev/null 2>&1 || fail "Node.js was not found. Install Node 20 or newer from https://nodejs.org"
  node -e "process.exit(+process.versions.node.split('.')[0] >= 20 ? 0 : 1)" || fail "Node $(node -v) is too old; this demo needs Node 20 or newer"
  PM=npm
  [ -f yarn.lock ] && PM=yarn
  [ -f pnpm-lock.yaml ] && PM=pnpm
  { [ -f bun.lock ] || [ -f bun.lockb ]; } && PM=bun
  command -v "$PM" >/dev/null 2>&1 || fail "$PM was not found, and the lockfile asks for it. Install it, or delete the lockfile to use npm"
  say "[OK] Node $(node -v) with $PM"
  if [ ! -d node_modules ]; then
    say "[..] Installing packages (one time)..."
    "$PM" install || fail "$PM install failed. Read the output above"
  fi
  has_script() { node -e "process.exit(require('./package.json').scripts?.['$1'] ? 0 : 1)"; }
  if [ ! -e "$BUILD_DIR" ] && has_script build; then
    say "[..] Building the production bundle (one time)..."
    "$PM" run build || fail "The build failed. Read the output above"
  fi
  if has_script start; then START_CMD="$PM run start"
  elif has_script preview; then START_CMD="$PM run preview"
  else START_CMD="$PM run dev"; say "[warn] No start script, so this runs the dev server. Demo on a production build when you can."
  fi
elif [ -z "$START_CMD" ] && { [ -f requirements.txt ] || [ -f pyproject.toml ]; }; then
  PY=""
  for c in python3 python py; do   # running a real check rejects the Microsoft Store alias, which is not Python
    if "$c" -c 'import sys; sys.exit(0 if sys.version_info >= (3, 10) else 1)' >/dev/null 2>&1; then PY="$c"; break; fi
  done
  [ -n "$PY" ] || fail "Python 3.10 or newer was not found. Install it from https://python.org"
  [ -d .venv ] || { say "[..] Creating .venv (one time)..."; "$PY" -m venv .venv || fail "Could not create .venv"; }
  VPY=.venv/bin/python; [ -x "$VPY" ] || VPY=.venv/Scripts/python.exe
  if [ -f requirements.txt ]; then REQ="-r requirements.txt"; else REQ="-e ."; fi
  if [ ! -f .venv/.installed ] || { [ -f requirements.txt ] && [ requirements.txt -nt .venv/.installed ]; }; then
    say "[..] Installing Python packages..."
    # shellcheck disable=SC2086
    "$VPY" -m pip install --quiet --disable-pip-version-check $REQ || fail "pip install failed. Try: $VPY -m pip install $REQ"
    touch .venv/.installed
  fi
  say "[OK] $("$VPY" --version 2>&1) in .venv"
  START_CMD="$VPY -m uvicorn $PY_APP --host 127.0.0.1 --port $PORT"
elif [ -z "$START_CMD" ]; then
  fail "No package.json, requirements.txt or pyproject.toml here. Run this from the project root, or set START_CMD"
fi

# ---- 2. Free the port from a stale demo ------------------------------------------------------------
port_pid() {
  if command -v lsof >/dev/null 2>&1; then lsof -ti "tcp:$PORT" -sTCP:LISTEN 2>/dev/null | head -n 1
  elif command -v fuser >/dev/null 2>&1; then fuser "$PORT/tcp" 2>/dev/null | awk '{print $1}'
  elif [ "$IS_WIN" = 1 ]; then netstat -ano 2>/dev/null | grep -E "[:.]$PORT[[:space:]].*LISTENING" | awk '{print $NF}' | head -n 1
  fi
}
pid_name() {
  if [ "$IS_WIN" = 1 ]; then tasklist //FI "PID eq $1" //FO CSV //NH 2>/dev/null | head -n 1 | cut -d, -f1 | tr -d '"'
  else ps -p "$1" -o comm= 2>/dev/null
  fi
}
kill_tree() {
  if [ "$IS_WIN" = 1 ]; then taskkill //F //T //PID "$1" >/dev/null 2>&1; else kill "$1" 2>/dev/null; fi
}
HOLDER="$(port_pid)"
if [ -n "$HOLDER" ]; then
  NAME="$(pid_name "$HOLDER")"
  case "$NAME" in
    *node*|*python*|*uvicorn*|*bun*|*deno*|py.exe) say "[..] Port $PORT is held by $NAME (PID $HOLDER), an old demo. Stopping it." ;;
    *) [ "$FORCE_PORT" = 1 ] || fail "Port $PORT is used by ${NAME:-another program} (PID $HOLDER), not by an old demo. Stop it, set PORT, or rerun with --force-port"
       say "[..] --force-port: stopping ${NAME:-another program} (PID $HOLDER) on port $PORT." ;;
  esac
  kill_tree "$HOLDER"
  sleep 1
fi

# ---- 3. Start and wait for health ----------------------------------------------------------------
if [ "$MODE" = live ]; then DEMO=0; else DEMO=1; fi
PYTHONUTF8=1; PYTHONIOENCODING=utf-8
export DEMO PORT PYTHONUTF8 PYTHONIOENCODING
URL="http://127.0.0.1:$PORT"
say "Starting $APP_NAME in $MODE mode on $URL"
set -m                      # the server gets its own process group, so stopping takes the whole tree
sh -c "$START_CMD" &
SERVER=$!
set +m
stop() {
  [ -n "${SERVER:-}" ] || return 0
  if [ "$IS_WIN" = 1 ]; then h="$(port_pid)"; [ -n "$h" ] && kill_tree "$h"; fi
  kill -TERM -- "-$SERVER" 2>/dev/null || kill -TERM "$SERVER" 2>/dev/null
  wait "$SERVER" 2>/dev/null
  SERVER=""
}
trap stop EXIT
trap 'exit 130' INT TERM

probe() {
  if command -v curl >/dev/null 2>&1; then curl -fsS -o /dev/null --max-time 3 "$1" 2>/dev/null
  elif command -v wget >/dev/null 2>&1; then wget -q -O /dev/null -T 3 "$1"
  else return 2
  fi
}
waited=0
until probe "$URL$HEALTH_PATH"; do
  [ $? -eq 2 ] && { say "[warn] Neither curl nor wget is installed; waiting 10 s instead of checking health"; sleep 10; break; }
  kill -0 "$SERVER" 2>/dev/null || fail "The server exited before $HEALTH_PATH answered. Read its output above"
  waited=$((waited + 1))
  [ "$waited" -ge "$HEALTH_TIMEOUT" ] && fail "No answer from $URL$HEALTH_PATH after $HEALTH_TIMEOUT seconds. Read the server output above"
  [ $((waited % 15)) -eq 0 ] && say "[..] still starting (${waited} s)"
  sleep 1
done

# ---- 4. Print the deep links and open the browser ------------------------------------------------
say "[OK] $APP_NAME is up: $URL   health: $URL$HEALTH_PATH"
say "Demo links, one per golden-path beat:"
set -f                      # the links contain "?", which must not glob against file names
FIRST=""
for p in $DEMO_LINKS; do say "    $URL$p"; [ -n "$FIRST" ] || FIRST="$p"; done
set +f
if [ "$CHECK" = 1 ]; then say "[OK] Check passed: started, healthy, links printed. Stopping."; exit 0; fi
if [ "${RUN_DEMO_NO_BROWSER:-0}" != 1 ]; then
  case "$(uname -s 2>/dev/null)" in
    Darwin) open "$URL$FIRST" ;;
    MINGW*|MSYS*|CYGWIN*) explorer.exe "$URL$FIRST" >/dev/null 2>&1 || true ;;
    *) command -v xdg-open >/dev/null 2>&1 && xdg-open "$URL$FIRST" >/dev/null 2>&1 & ;;
  esac
fi
say "Press Ctrl+C to stop $APP_NAME."
wait "$SERVER"
