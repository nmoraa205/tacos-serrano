#!/usr/bin/env bash
set -euo pipefail

OUTPUT=${1:-costochef-netlify.zip}

ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
cd "$ROOT_DIR"

if [[ -f "$OUTPUT" ]]; then
  rm "$OUTPUT"
fi

INCLUDE=(
  "index.html"
  "menu.html"
  "admin.html"
  "privacidad.html"
  "app.js"
  "menu.js"
  "styles.css"
  "optional-styles.css"
  "menu.css"
  "manifest.webmanifest"
  "service-worker.js"
  "README_UPDATES.md"
  "admin"
  "assets"
  "content"
  "data"
  "fidelidad"
  "static"
)

missing=0
for path in "${INCLUDE[@]}"; do
  if [[ ! -e "$path" ]]; then
    echo "Advertencia: no se encontró $path" >&2
    missing=1
  fi
done

zip -r "$OUTPUT" "${INCLUDE[@]}" >/dev/null

echo "Paquete generado: $OUTPUT"

if (( missing )); then
  echo "Se omitieron algunos archivos porque no existen en este repo." >&2
fi
