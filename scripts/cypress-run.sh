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

cd /e2e
npx cypress run --browser electron
