#!/bin/sh
set -eu

XVFB_PID=""
OPENBOX_PID=""
X11VNC_PID=""
NOVNC_PID=""
API_PID=""
VNC_PASSWORD_FILE=""

is_enabled() {
    case "${1:-}" in
        1|true|TRUE|yes|YES|on|ON)
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

cleanup_background() {
    for pid in "$NOVNC_PID" "$X11VNC_PID" "$OPENBOX_PID" "$XVFB_PID"; do
        if [ -n "$pid" ]; then
            kill "$pid" 2>/dev/null || true
            wait "$pid" 2>/dev/null || true
        fi
    done

    if [ -n "$VNC_PASSWORD_FILE" ] && [ -f "$VNC_PASSWORD_FILE" ]; then
        rm -f "$VNC_PASSWORD_FILE"
    fi
}

forward_signal() {
    if [ -n "$API_PID" ]; then
        kill "$API_PID" 2>/dev/null || true
        wait "$API_PID" 2>/dev/null || true
    fi
}

wait_for_display() {
    ATTEMPTS=0

    until xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; do
        ATTEMPTS=$((ATTEMPTS + 1))

        if [ "$ATTEMPTS" -ge 30 ]; then
            echo "❌ Managed display ${DISPLAY} did not become ready."
            return 1
        fi

        if [ -n "$XVFB_PID" ] && ! kill -0 "$XVFB_PID" 2>/dev/null; then
            echo "❌ Xvfb exited before ${DISPLAY} became ready."
            return 1
        fi

        sleep 1
    done
}

start_vnc_stack() {
    VNC_PORT="${HEADLESSX_VNC_PORT:-5900}"
    VNC_WEB_PORT="${HEADLESSX_VNC_WEB_PORT:-6080}"

    if [ -z "${HEADLESSX_VNC_PASSWORD:-}" ] && ! is_enabled "${HEADLESSX_VNC_ALLOW_NO_PASSWORD:-0}"; then
        echo "❌ HEADLESSX_VNC_PASSWORD must be set when HEADLESSX_ENABLE_VNC=1."
        echo "   Set HEADLESSX_VNC_ALLOW_NO_PASSWORD=1 only for trusted local-only debugging."
        return 1
    fi

    if [ -n "${HEADLESSX_VNC_PASSWORD:-}" ]; then
        VNC_PASSWORD_FILE="$(mktemp /tmp/headlessx-vnc-pass.XXXXXX)"
        x11vnc -storepasswd "$HEADLESSX_VNC_PASSWORD" "$VNC_PASSWORD_FILE" >/dev/null
        # shellcheck disable=SC2086
        x11vnc -display "$DISPLAY" -rfbport "$VNC_PORT" -forever -shared -xkb -noxrecord -noxfixes -noxdamage -rfbauth "$VNC_PASSWORD_FILE" >/tmp/headlessx-x11vnc.log 2>&1 &
    else
        echo "⚠️ HEADLESSX_VNC_PASSWORD is empty. The VNC session is not password protected."
        x11vnc -display "$DISPLAY" -rfbport "$VNC_PORT" -forever -shared -xkb -noxrecord -noxfixes -noxdamage -nopw >/tmp/headlessx-x11vnc.log 2>&1 &
    fi
    X11VNC_PID=$!

    websockify --web /usr/share/novnc/ "$VNC_WEB_PORT" "127.0.0.1:${VNC_PORT}" >/tmp/headlessx-novnc.log 2>&1 &
    NOVNC_PID=$!

    echo "✅ noVNC available at http://127.0.0.1:${VNC_WEB_PORT}/vnc.html"
    if [ -n "${HEADLESSX_VNC_PUBLIC_URL:-}" ]; then
        echo "🌐 Public noVNC URL: ${HEADLESSX_VNC_PUBLIC_URL}"
    fi
}

start_managed_display() {
    if [ "$(uname -s)" != "Linux" ]; then
        return 0
    fi

    if ! is_enabled "${HEADLESSX_ENABLE_MANAGED_DISPLAY:-1}"; then
        return 0
    fi

    export DISPLAY="${DISPLAY:-${HEADLESSX_DISPLAY:-:99}}"

    if xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then
        export HEADLESSX_VIRTUAL_DISPLAY_ACTIVE=1
        echo "🖥️ Reusing existing display ${DISPLAY}"
        return 0
    fi

    DISPLAY_WIDTH="${HEADLESSX_DISPLAY_WIDTH:-${BROWSER_WINDOW_WIDTH:-1440}}"
    DISPLAY_HEIGHT="${HEADLESSX_DISPLAY_HEIGHT:-${BROWSER_WINDOW_HEIGHT:-900}}"
    DISPLAY_DEPTH="${HEADLESSX_DISPLAY_DEPTH:-24}"

    echo "🖥️ Starting managed display ${DISPLAY} (${DISPLAY_WIDTH}x${DISPLAY_HEIGHT}x${DISPLAY_DEPTH})"
    Xvfb "$DISPLAY" -screen 0 "${DISPLAY_WIDTH}x${DISPLAY_HEIGHT}x${DISPLAY_DEPTH}" -ac -nolisten tcp +extension RANDR >/tmp/headlessx-xvfb.log 2>&1 &
    XVFB_PID=$!

    wait_for_display
    export HEADLESSX_VIRTUAL_DISPLAY_ACTIVE=1

    if command -v openbox >/dev/null 2>&1; then
        openbox >/tmp/headlessx-openbox.log 2>&1 &
        OPENBOX_PID=$!
    fi

    if is_enabled "${HEADLESSX_ENABLE_VNC:-1}"; then
        start_vnc_stack
    fi
}

trap 'forward_signal' INT TERM HUP
trap 'cleanup_background' EXIT

start_managed_display

cd /app/apps/api

MAX_ATTEMPTS="${PRISMA_MIGRATE_MAX_ATTEMPTS:-10}"
ATTEMPT=1

echo "🗄️ Applying Prisma migrations..."

until pnpm exec prisma migrate deploy; do
    if [ "$ATTEMPT" -ge "$MAX_ATTEMPTS" ]; then
        echo "❌ Prisma migration failed after ${MAX_ATTEMPTS} attempts."
        exit 1
    fi

    echo "⚠️ Prisma migration attempt ${ATTEMPT} failed. Retrying in 3 seconds..."
    ATTEMPT=$((ATTEMPT + 1))
    sleep 3
done

echo "✅ Prisma migrations applied."
pnpm exec tsx src/server_entry.ts &
API_PID=$!
wait "$API_PID"
EXIT_CODE=$?
API_PID=""
exit "$EXIT_CODE"
