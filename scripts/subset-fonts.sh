#!/usr/bin/env bash
# Builds the self-hosted WOFF2 fonts in src/assets/fonts from the @fontsource-variable packages.
# Limits each variable font to the weights the design system uses (PLAN §4A.1) and to Latin text.
# Requires Python fontTools (pip install fonttools brotli). Output files are committed, so CI does not need Python.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=src/assets/fonts
TMP=$(mktemp -d)
UNICODES="U+0000-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2013-2014,U+2018-201A,U+201C-201E,U+2022,U+2026,U+2032-2033,U+2039-203A,U+20AC,U+2122,U+2191,U+2193,U+2212"
NR=node_modules/@fontsource-variable/newsreader/files
RC=node_modules/@fontsource-variable/roboto-condensed/files

instance() { # src dest wght-range
  python3 -m fontTools.varLib.instancer "$1" "wght=$3" -o "$TMP/$(basename "$2" .woff2).ttf" -q
  pyftsubset "$TMP/$(basename "$2" .woff2).ttf" --unicodes="$UNICODES" --flavor=woff2 \
    --layout-features='kern,liga,calt,lnum,onum,pnum,tnum,case' --output-file="$2"
}
instance "$NR/newsreader-latin-wght-normal.woff2"        "$OUT/newsreader.woff2"        400:600
instance "$NR/newsreader-latin-wght-italic.woff2"        "$OUT/newsreader-italic.woff2" 400:500
instance "$RC/roboto-condensed-latin-wght-normal.woff2"  "$OUT/roboto-condensed.woff2"  400:900
rm -rf "$TMP"
ls -la "$OUT"
