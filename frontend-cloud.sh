#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Cloud dev: proxy /api through Vite to the hosted API (avoids CORS).
DEFAULT_CLOUD_API_BASE_URL="https://sebl2.pythonanywhere.com"
export API_PROXY_TARGET="${API_PROXY_TARGET:-$DEFAULT_CLOUD_API_BASE_URL}"

cd "$FRONTEND_DIR"
npm run dev
