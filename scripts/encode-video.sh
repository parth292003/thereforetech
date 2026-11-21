#!/usr/bin/env bash
# Encode a master clip into web renditions (docs/PLAN.md §5.4).
#   usage: scripts/encode-video.sh <master> <id> [loop|scrub] [mobile-master] [poster-seconds]
# Produces in src/media/<id>/:
#   desktop.mp4 (H.264, 1920w)   desktop.webm (VP9, 1920w)
#   mobile.mp4, mobile.webm      960w from the master, or 1080w from a separate 4:5 mobile master
#   poster.jpg / .webp / .avif (1600w)   poster-mobile.jpg / .webp / .avif (800w)
# "scrub" mode: keyframe every 6 frames so scroll-scrubbing stays smooth.
# Rendered scenes (with a mobile master) use quality-based encoding: their frames are mostly white.
set -euo pipefail
MASTER=$1; ID=$2; MODE=${3:-loop}; MOBILE=${4:-}; POSTER_T=${5:-2}
OUT="src/media/$ID"; mkdir -p "$OUT"
GOP=48; [ "$MODE" = "scrub" ] && GOP=6
GOP=${GOP_OVERRIDE:-$GOP}          # e.g. GOP_OVERRIDE=12 for heavy full-frame scenes
DESKTOP_W=${DESKTOP_W:-1920}
q() { ffmpeg -hide_banner -loglevel error -y "$@"; }

enc() { # source width mp4-maxrate webm-bitrate name
  local SRC=$1 WIDTH=$2 MAXR=$3 WEBMB=$4 NAME=$5
  local C=(-i "$SRC" -an -pix_fmt yuv420p -g $GOP -keyint_min $GOP -vf "scale=$WIDTH:-2:flags=lanczos")
  q "${C[@]}" -c:v libx264 -preset slow -crf ${CRF_264:-27} -maxrate $MAXR -bufsize $(( ${MAXR%k} * 2 ))k \
    -profile:v high -movflags +faststart -sc_threshold 0 "$OUT/$NAME.mp4"
  if [ "$WEBMB" = 0 ]; then   # constant quality (rendered scenes: mostly white frames, size follows content)
    q "${C[@]}" -c:v libvpx-vp9 -b:v 0 -crf ${CRF_VP9:-36} -deadline good -cpu-used 2 -row-mt 1 "$OUT/$NAME.webm"
    return
  fi
  q "${C[@]}" -c:v libvpx-vp9 -b:v $WEBMB -crf ${CRF_VP9:-36} -deadline good -cpu-used 2 -row-mt 1 -pass 1 -f null /dev/null
  q "${C[@]}" -c:v libvpx-vp9 -b:v $WEBMB -crf ${CRF_VP9:-36} -deadline good -cpu-used 2 -row-mt 1 -pass 2 "$OUT/$NAME.webm"
  rm -f ffmpeg2pass-0.log
}

poster() { # source width name
  q -ss "$POSTER_T" -i "$1" -frames:v 1 -vf "scale=$2:-2:flags=lanczos" -q:v 3 "$OUT/$3.jpg"
  cwebp -quiet -q 74 "$OUT/$3.jpg" -o "$OUT/$3.webp"
  q -ss "$POSTER_T" -i "$1" -frames:v 1 -vf "scale=$2:-2:flags=lanczos" -c:v libsvtav1 -crf 34 -pix_fmt yuv420p "$OUT/$3.avif" 2>/dev/null
}

if [ -n "$MOBILE" ]; then
  CRF_264=${CRF_264:-24} CRF_VP9=${CRF_VP9:-36} enc "$MASTER" $DESKTOP_W 2600k 0 desktop
  CRF_264=${CRF_264:-24} CRF_VP9=${CRF_VP9:-36} enc "$MOBILE" ${MOBILE_W:-1080} 1600k 0 mobile
  poster "$MASTER" 1600 poster
  poster "$MOBILE" 800 poster-mobile
else
  enc "$MASTER" 1920 1200k 1000k desktop
  enc "$MASTER" 960 470k 400k mobile
  poster "$MASTER" 1600 poster
  cwebp -quiet -q 70 -resize 800 0 "$OUT/poster.jpg" -o "$OUT/poster-mobile.webp"
fi
ls -la "$OUT"
