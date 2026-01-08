#!/bin/bash
# Script per eseguire i test E2E con Cypress in modalità headless

set -e

echo "=== Esecuzione Test E2E con Cypress ==="
echo ""

# Verifica che i container siano attivi
if ! docker ps | grep -q firebase_base_app; then
  echo "❌ Container firebase_base_app non attivo!"
  echo "   Esegui: docker compose up -d"
  exit 1
fi

if ! docker ps | grep -q cypress_ui; then
  echo "❌ Container cypress_ui non attivo!"
  echo "   Esegui: docker compose up -d cypress-ui"
  exit 1
fi

echo "✓ Container attivi"
echo ""
echo "Esecuzione test..."
echo ""

# Esegui i test
docker exec cypress_ui npm run test:e2e

echo ""
echo "=== Test completati ==="
