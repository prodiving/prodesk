#!/usr/bin/env bash
set -euo pipefail

API_URL=${1:-${API_URL:-}}
if [ -z "$API_URL" ]; then
  echo "Usage: $0 <API_URL> or set API_URL env var"
  exit 2
fi

echo "Running smoke tests against $API_URL"

echo -n "Health: "
curl -fsS "$API_URL/health" || { echo "FAILED"; exit 1; }

echo -n "Divers non-empty: "
if curl -fsS -H "x-user-id: smoke" "$API_URL/api/divers" | jq 'length > 0'; then
  echo "OK"
else
  echo "FAILED"; exit 1
fi

echo -n "Equipment non-empty: "
if curl -fsS -H "x-user-id: smoke" "$API_URL/api/equipment" | jq 'length > 0'; then
  echo "OK"
else
  echo "FAILED"; exit 1
fi

echo "All smoke tests passed."
