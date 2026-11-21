// 生成发给 PC 会话的完整指令（云端 → PC 的视频上传交接）
//   node tools/db/pc-handoff.js <云端会话 id>   打印要传的视频清单 + PC 会话的 prompt
// 云端会话 id 用 get_session（不带参数）查。PC 做完会用 send_message 直接回这个会话，用户不用传话。
// 用法（云端会话）：
//   1. 运行本脚本；没有待传视频就到此为止。
//   2. 用 create_session 在环境「Elegy:D:\Claude」开会话，prompt 用本脚本打印的内容。
//   3. 同时在云端运行 node tools/db/upload-videos.js --wait（会一直重试到权限生效）。
// PC 会话自己负责闭环：开权限 → 等视频出现在桶里 → 立刻关权限 → 报告结果。
// 所以结果一定落在 PC 会话里，权限只开到传完为止。
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const ROOT=path.join(__dirname,'../..');
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'site/config.json')));
const cat=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog/items.json')));
const enc=p=>p.split('/').map(encodeURIComponent).join('/');
const pub=v=>`${cfg.supabaseUrl}/storage/v1/object/public/${cfg.videoBucket}/${enc(v)}`;
const code=u=>{try{return execFileSync('curl',['-sS','-m','30','-o','/dev/null','-w','%{http_code}','-I',u]).toString().trim()}catch{return 'ERR'}};
const REPLY=process.argv[2];
if(!REPLY||!/^session_/.test(REPLY)){console.error('用法：node tools/db/pc-handoff.js <云端会话 id，session_ 开头>');process.exit(2)}
const pending=cat.items.filter(it=>it.video&&code(pub(it.video))!=='200').map(it=>it.video);
if(!pending.length){console.log('桶里已经全部都有，不需要 PC。');process.exit(0)}
const until=new Date(Date.now()+40*60e3).toISOString().replace('T',' ').slice(0,19)+'+00';
const list=pending.map(v=>`- ${pub(v)}`).join('\n');
console.log(`待传 ${pending.length} 个：\n${pending.join('\n')}\n\n===== PC 会话 prompt =====\n`);
console.log(`请在这台电脑（Elegy）上的自建 Supabase（Docker，脚本在 D:\\Claude\\SupabaseLocal）里完成一次「审美图鉴」视频上传交接。全程用简体中文，不要把任何密钥写进回复或文件。**做完第 4 步再结束会话**。全程不要找用户传话或确认，结果直接发回云端会话。

1. 开放上传（只影响桶 aesthetic-videos，最晚 ${until} UTC 自动失效）：
\`\`\`sql
drop policy if exists "aesthetic videos temp upload" on storage.objects;
create policy "aesthetic videos temp upload" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'aesthetic-videos' and now() < timestamptz '${until}');
\`\`\`
   确认 \`select policyname from pg_policies where tablename='objects' and policyname='aesthetic videos temp upload';\` 有一行。

2. 云端正在自动重试上传。每 20 秒检查一次下面这些地址，直到全部返回 HTTP 200（最多等 35 分钟）：
${list}

3. 全部 200（或等到 35 分钟）后，立刻关闭上传：
\`\`\`sql
drop policy if exists "aesthetic videos temp upload" on storage.objects;
\`\`\`
   确认 pg_policies 里这一行已经没有了。

4. 用 send_message 把结果发回云端会话 \`${REPLY}\`（一两句话：哪些视频已经进桶、哪些没进，上传权限已经关闭）。同样的话也写在你这个会话的最后一条回复里。`);
