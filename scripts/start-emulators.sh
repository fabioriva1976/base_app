#!/bin/bash
set -euo pipefail

DATA_DIR="/app/emulator-data"
EXPORT_TMP="/tmp/emulator-export"
PROJECT="${FIREBASE_PROJECT_ID:-base-app-12108}"

# Assicura la directory montata dal volume
mkdir -p "$DATA_DIR"
rm -rf "$EXPORT_TMP"
mkdir -p "$EXPORT_TMP"

copy_export() {
  if [ -d "$EXPORT_TMP" ] && [ "$(ls -A "$EXPORT_TMP")" ]; then
    echo "📦 Copio export emulatori da $EXPORT_TMP a $DATA_DIR..."
    rm -rf "$DATA_DIR"/*
    cp -r "$EXPORT_TMP"/* "$DATA_DIR"/
  else
    echo "⚠️  Nessun export trovato in $EXPORT_TMP"
  fi
}

cleanup() {
  trap - SIGTERM SIGINT
  local code=${1:-0}
  echo "🛑 Stop richiesto, chiudo servizi..."

  if [[ -n "${ASTRO_PID:-}" ]] && kill -0 "$ASTRO_PID" 2>/dev/null; then
    echo "Fermo Astro (PID $ASTRO_PID)..."
    kill -INT "$ASTRO_PID"
    wait "$ASTRO_PID" 2>/dev/null || true
  fi

  if [[ -n "${FIREBASE_PID:-}" ]] && kill -0 "$FIREBASE_PID" 2>/dev/null; then
    echo "Fermo Firebase Emulators (PID $FIREBASE_PID)..."
    # SIGINT permette a firebase di eseguire l'export automatico verso $EXPORT_TMP
    kill -INT "$FIREBASE_PID"
    wait "$FIREBASE_PID" 2>/dev/null || true
  fi

  # Copia export-on-exit nella cartella condivisa
  copy_export
  exit "$code"
}

trap 'cleanup $?' SIGTERM SIGINT

echo "🚀 Avvio Firebase Emulators (import: $DATA_DIR, export-on-exit: $DATA_DIR)..."
firebase emulators:start \
  --import="$DATA_DIR" \
  --export-on-exit="$EXPORT_TMP" \
  --project="$PROJECT" &
FIREBASE_PID=$!
echo "Firebase Emulators PID: $FIREBASE_PID"

echo "🌐 Avvio Astro dev server su 0.0.0.0:3000..."
npm run dev -- --host 0.0.0.0 --port 3000 &
ASTRO_PID=$!
echo "Astro PID: $ASTRO_PID"

# Appena uno dei due termina, esegue il cleanup (l'export lo fa firebase grazie a --export-on-exit)
set +e
wait -n "$FIREBASE_PID" "$ASTRO_PID"
EXIT_CODE=$?
set -e
cleanup "$EXIT_CODE"
