// 生成复刻待做清单 tools/replicate/QUEUE.md（从 catalog/items.json 里状态是「排队中」的条目）
//   node tools/replicate/queue.js
const fs=require('fs'),path=require('path');const ROOT=path.join(__dirname,'../..');
const c=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog/items.json')));
const Q=c.items.filter(i=>i.status==='queued'&&i.plan).sort((a,b)=>(b.rating||2)-(a.rating||2)||'SML'.indexOf(a.plan.size)-'SML'.indexOf(b.plan.size));
const T={S:'小（几分钟，少量 token）',M:'中（半小时左右）',L:'大（需要 3D 模型或多段素材，token 最多）'};
let md=`# 复刻待做清单\n\n这些条目需要比较多的 token，平时先只放原视频。哪周 token 有富余，对 Claude 说「开始做 <编号>」即可。\n排序：我的评价高的在前，同评价里小的在前。此文件由 \`node tools/replicate/queue.js\` 生成，不要手改。\n\n## 开工的固定步骤\n1. 准备素材（下面每条写了要什么；AI 视频用可灵 / Runway，提示词已写好）\n2. \`bash tools/replicate/new.sh <编号> <模板> [pointer|scroll]\`：生成 demos/<编号>.html、素材文件夹、核对剧本草稿\n3. 有视频素材时：\`bash tools/replicate/video-to-frames.sh <编号> <视频> 48\`\n4. 写效果 → \`node tools/verify/compare.js <编号>\` → 看 verify/<编号>.jpg → 把分数和差异写进 catalog/items.json（status 改成 replicated）\n5. 模板说明：basic = 单文件 2D 动效；frame-scrub = AI 视频拆帧后跟着鼠标或滚动切换（省 token 的「假 3D」）；three-scene = three.js 真 3D（vendor 在 demos/vendor/three，不依赖外网）\n\n`;
for(const i of Q){const p=i.plan;md+=`## ${'❤'.repeat(i.rating||0)} \`${i.id}\` ${i.title}\n\n- 大小：${T[p.size]||p.size}\n- 模板：${p.template}\n- 素材：${p.assets.length?p.assets.join('；'):'不需要'}\n- 步骤：\n${p.steps.map(s=>'  - '+s).join('\n')}\n${p.prompt?`- AI 视频提示词：\n  > ${p.prompt}\n`:''}- 验收：${p.accept}\n- 原视频：数据库 \`${i.video||'无'}\`，本地 \`${i.ref}\`\n\n`}
fs.writeFileSync(path.join(__dirname,'QUEUE.md'),md);console.log('✓ QUEUE.md：',Q.map(i=>i.id).join(', '));
