#!/usr/bin/env bash
# 把一段（AI 生成的）视频拆成帧序列，给「按帧拖动」模板用
#   bash tools/replicate/video-to-frames.sh <条目id> <视频> [帧数=48] [宽=1280]
set -euo pipefail
id="$1"; vid="$2"; n="${3:-48}"; w="${4:-1280}"
out="demos/assets/$id/frames"; mkdir -p "$out"; rm -f "$out"/*.webp
dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$vid")
fps=$(python3 -c "print($n/$dur)")
ffmpeg -v error -y -i "$vid" -vf "fps=$fps,scale=$w:-2" -frames:v "$n" -c:v libwebp -quality 82 "$out/%04d.webp"
echo "✓ $(ls "$out" | wc -l) 帧 → $out（模板里 FRAMES 写这个数）"
