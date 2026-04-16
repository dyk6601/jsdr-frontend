#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"

# Cloud dev: point directly at the hosted API so Google OAuth cookies
# (set on the backend origin) are sent with credentialed requests.
DEFAULT_CLOUD_API_BASE_URL="https://sebl2.pythonanywhere.com"
export VITE_API_BASE_URL="${VITE_API_BASE_URL:-$DEFAULT_CLOUD_API_BASE_URL}"

cd "$FRONTEND_DIR"
npm run dev
