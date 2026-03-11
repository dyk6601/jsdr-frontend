#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Local dev: keep API calls on /api so Vite proxies to http://127.0.0.1:8000
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-/api}"

cd "$FRONTEND_DIR"
npm run dev
