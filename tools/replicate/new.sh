#!/usr/bin/env bash
# 开工：为索引里的一个条目生成复刻页面的起点
#   bash tools/replicate/new.sh <条目id> <basic|frame-scrub|three-scene> [pointer|scroll]
# 做的事：从模板生成 demos/<id>.html、建 demos/assets/<id>/、在核对剧本里加一个草稿、把索引状态改成「复刻中」
set -euo pipefail
id="$1"; tpl="$2"; mode="${3:-pointer}"
root="$(cd "$(dirname "$0")/../.." && pwd)"; cd "$root"
out="demos/$id.html"; [ -e "$out" ] && { echo "已经存在 $out"; exit 1; }
python3 - "$id" "$tpl" "$mode" <<'PY'
import json,sys
id,tpl,mode=sys.argv[1:]
c=json.load(open('catalog/items.json'));it=next((i for i in c['items'] if i['id']==id),None)
if not it: sys.exit('索引里没有 '+id)
src=(it.get('source') or {});s=f"{src.get('type','')}「{src.get('title',it['title'])}」（{src.get('author','')}）"
t=open(f'tools/replicate/templates/{tpl}.html').read()
for k,v in {'{{ID}}':id,'{{TITLE}}':it['title'],'{{SOURCE}}':s,'{{FRAMES}}':'48','{{MODE}}':mode}.items(): t=t.replace(k,v)
open(f'demos/{id}.html','w').write(t)
it['demo']=f'demos/{id}.html';it['status']='in-progress'
c['statuses'].setdefault('in-progress','复刻中')
json.dump(c,open('catalog/items.json','w'),ensure_ascii=False,indent=1)
p='tools/verify/scenarios.js';s2=open(p).read().rstrip('\n');assert s2.endswith('};')
s2=s2[:-2]+f"  '{id}':{{viewport:{{width:1280,height:720}},run:async(p,shot)=>{{ /* TODO：照原视频的操作写剧本 */ for(let i=0;i<6;i++){{await shot();await w(400)}} }}}},\n}};\n"
open(p,'w').write(s2)
PY
mkdir -p "demos/assets/$id"
echo "✓ demos/$id.html（模板 $tpl）  素材放 demos/assets/$id/  剧本在 tools/verify/scenarios.js"
echo "  做完后：node tools/verify/compare.js $id  → 看 verify/$id.jpg → 把结论写进 catalog/items.json"
