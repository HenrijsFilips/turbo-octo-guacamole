#!/usr/bin/env bash
# Generate optimized image derivatives (thumbs + web).
#
# Reads from "LVLV KAZAS/LVLV-N.jpg" (N = 1..75) and writes:
#   docs/thumbs/LVLV-N.jpg  -> max 600x600,  q70  (grid thumbnails)
#   docs/web/LVLV-N.jpg     -> max 2560x2560, q82 (lightbox / full view)
#
# Also writes docs/manifest.json: a numerically-sorted JSON array of basenames.
#
# Safe to re-run; it will overwrite existing derivatives.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$ROOT_DIR/LVLV KAZAS"
THUMBS_DIR="$ROOT_DIR/docs/thumbs"
WEB_DIR="$ROOT_DIR/docs/web"
MANIFEST="$ROOT_DIR/docs/manifest.json"

TOTAL=75

mkdir -p "$THUMBS_DIR" "$WEB_DIR"

echo "Generating derivatives for $TOTAL images..."

process_one() {
  local i="$1"
  local src="$SRC_DIR/LVLV-$i.jpg"

  if [[ ! -f "$src" ]]; then
    echo "WARNING: missing $src, skipping" >&2
    return 0
  fi

  echo "[$i/$TOTAL] thumb + web for LVLV-$i.jpg"

  magick "$src" -auto-orient -resize 600x600 -quality 70 -strip "$THUMBS_DIR/LVLV-$i.jpg"
  magick "$src" -auto-orient -resize 2560x2560 -quality 82 -strip "$WEB_DIR/LVLV-$i.jpg"
}

export -f process_one
export SRC_DIR THUMBS_DIR WEB_DIR TOTAL

seq 1 "$TOTAL" | xargs -P 4 -I{} bash -c 'process_one "$@"' _ {}

echo "Writing manifest.json..."

{
  printf '['
  for ((i = 1; i <= TOTAL; i++)); do
    if (( i > 1 )); then
      printf ','
    fi
    printf '"LVLV-%d"' "$i"
  done
  printf ']'
} > "$MANIFEST"

echo "Done. Wrote manifest with $TOTAL entries to $MANIFEST"
