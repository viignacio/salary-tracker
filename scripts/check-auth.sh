#!/usr/bin/env bash
# Asserts every data API route rejects requests with no auth cookie.
# Run against a running dev/prod server: BASE_URL=http://localhost:3000 ./scripts/check-auth.sh
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
routes=(
  "/api/helpers"
  "/api/salaries"
  "/api/bonuses"
  "/api/deductions"
  "/api/invalid-months?helperId=x"
  "/api/export?helperId=x&month=1&year=2024"
)

fail=0
for route in "${routes[@]}"; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$route")
  if [ "$code" != "401" ]; then
    echo "FAIL: $route returned $code, expected 401 (no auth cookie sent)"
    fail=1
  else
    echo "ok: $route -> 401"
  fi
done

exit $fail
