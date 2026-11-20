#!/usr/bin/env bash
# 视频压缩：保持原分辨率和帧率，用 AV1（SVT-AV1，10bit）重新编码，音频转 Opus 64k，输出 video.av1.mp4。
#   bash tools/xhs/compress.sh references/xhs/<笔记文件夹>/video.mp4 ...
# 实测（2026-11-20，720×1280 30fps 43 秒）：原片 52MB（9.6Mbps）→ AV1 CRF 34 = 21MB，SSIM 0.961；
#   同画质下 H.265 28MB、H.264 43MB。AV1 在 Chrome / Edge / Firefox / Safari 17+ 都能直接播放。
# CRF 越小画质越高、文件越大：默认 32（比实测的 34 再清楚一点），可用 CRF=30 bash … 覆盖。
set -euo pipefail
CRF="${CRF:-32}"; PRESET="${PRESET:-6}"
export SVT_LOG=1   # 只显示 SVT-AV1 的错误
for in in "$@"; do
  out="${in%.mp4}.av1.mp4"
  [ -s "$out" ] && { echo "跳过（已压缩）$out"; continue; }
  ffmpeg -v error -y -i "$in" -map 0:v:0 -map 0:a? -c:v libsvtav1 -crf "$CRF" -preset "$PRESET" -pix_fmt yuv420p10le \
    -svtav1-params tune=0 -c:a libopus -b:a 64k -movflags +faststart "$out"
  a=$(stat -c%s "$in"); b=$(stat -c%s "$out")
  if [ "$b" -ge "$a" ]; then rm "$out"; cp "$in" "$out"; echo "原片已经很小，保留原片 $out"; continue; fi
  ssim=$(ffmpeg -i "$out" -i "$in" -lavfi "[0:v][1:v]ssim" -f null - 2>&1 | grep -o 'All:[0-9.]*' || true)
  echo "✓ $(numfmt --to=iec $a) → $(numfmt --to=iec $b)  $ssim  $out"
done
