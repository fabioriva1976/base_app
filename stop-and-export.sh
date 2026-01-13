#!/bin/bash
set -euo pipefail

# Carica .env se presente per variabili locali
ENV_FILE="${ENV_FILE:-.env}"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

# Script di stop: esporta dati emulatori in una cartella temp interna al container,
# li copia nella volume condiviso ./emulator-data e poi spegne docker compose.

SERVICE="firebase-cli"
PROJECT="${FIREBASE_PROJECT_ID:?FIREBASE_PROJECT_ID is required}"

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
