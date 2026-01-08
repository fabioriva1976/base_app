#!/bin/bash
set -euo pipefail

export DISPLAY=${DISPLAY:-:99}
export ELECTRON_DISABLE_SANDBOX=1
export CYPRESS_ELECTRON_FLAGS="--no-sandbox --disable-gpu --disable-dev-shm-usage --disable-features=VizDisplayCompositor --no-zygote --disable-software-rasterizer"
export XDG_RUNTIME_DIR=/tmp/runtime-cypress
mkdir -p "$XDG_RUNTIME_DIR"
mkdir -p /run/dbus
rm -f /run/dbus/pid /run/dbus/system_bus_socket
dbus-daemon --session --fork --address=unix:path=/run/dbus/session_bus_socket
export DBUS_SESSION_BUS_ADDRESS=unix:path=/run/dbus/session_bus_socket

mkdir -p /run/dbus
dbus-daemon --system --fork

Xvfb "$DISPLAY" -screen 0 1280x720x24 &
for _ in $(seq 1 20); do
  if xdpyinfo -display "$DISPLAY" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done
fluxbox >/tmp/fluxbox.log 2>&1 &
x11vnc -display "$DISPLAY" -forever -shared -rfbport 5900 -nopw -noxdamage -xkb -ncache 10 -ncache_cr -logappend /tmp/x11vnc.log &

# Aspetta che x11vnc sia pronto
sleep 2

# Avvia noVNC con websockify
if [ -x /usr/bin/websockify ]; then
  websockify --web /usr/share/novnc 0.0.0.0:7900 localhost:5900 > /tmp/websockify.log 2>&1 &
elif [ -x /usr/share/novnc/utils/launch.sh ]; then
  /usr/share/novnc/utils/launch.sh --vnc localhost:5900 --listen 7900 &
elif [ -x /usr/share/novnc/utils/novnc_proxy ]; then
  /usr/share/novnc/utils/novnc_proxy --vnc 127.0.0.1:5900 --listen 0.0.0.0:7900 --web /usr/share/novnc &
else
  echo "noVNC launcher not found."
  exit 1
fi

# Aspetta che websockify sia pronto
sleep 2

cd /e2e
npx cypress open --browser electron
