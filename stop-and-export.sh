#!/bin/bash
set -euo pipefail

# Script di stop: esporta dati emulatori in una cartella temp interna al container,
# li copia nella volume condiviso ./emulator-data e poi spegne docker compose.

SERVICE="firebase-cli"
PROJECT="${FIREBASE_PROJECT_ID:-base-app-12108}"

echo "📦 Eseguo export dati emulatori..."
docker compose exec -T "$SERVICE" sh -lc '
  set -e
  TMP_DIR=$(mktemp -d)
  echo "Export in $TMP_DIR"
  firebase emulators:export "$TMP_DIR" --force --project='"$PROJECT"'
  echo "Pulisco /app/emulator-data e copio l export..."
  rm -rf /app/emulator-data/*
  cp -r "$TMP_DIR"/* /app/emulator-data/
  rm -rf "$TMP_DIR"
'

echo "🛑 Stop docker compose..."
docker compose down

echo "✅ Export completato e container fermato. Dati in ./emulator-data"
