// 把压缩后的视频上传到数据库的存储桶，并把 catalog/items.json 同步进 aesthetic_items 表
//   SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_KEY=… node tools/db/upload.js
// 视频：每个条目的 video 字段（如 xhs/<笔记id>.mp4）对应本地 <ref>/video.av1.mp4（没有压缩版就用 video.mp4）
// 已经上传过、大小相同的视频会跳过。密钥只从环境变量读，不写进任何文件。
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'../..');const URL_=process.env.SUPABASE_URL,KEY=process.env.SUPABASE_SERVICE_KEY;
const BUCKET=process.env.VIDEO_BUCKET||'aesthetic-videos',TABLE=process.env.ITEMS_TABLE||'aesthetic_items';
if(!URL_||!KEY){console.error('需要环境变量 SUPABASE_URL 和 SUPABASE_SERVICE_KEY');process.exit(1)}
const H={apikey:KEY,Authorization:'Bearer '+KEY};
const enc=p=>p.split('/').map(encodeURIComponent).join('/');
(async()=>{
  const cat=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog/items.json')));
  const ex=await (await fetch(`${URL_}/rest/v1/${TABLE}?select=id,video_path,video_bytes`,{headers:H})).json().catch(()=>[]);
  const old=Object.fromEntries((Array.isArray(ex)?ex:[]).map(r=>[r.id,r]));
  const rows=[];
  for(const it of cat.items){
    let bytes=null;
    if(it.video){
      const f=['video.av1.mp4','video.mp4','like-发光按钮-流光边框.mp4'].map(n=>path.join(ROOT,it.ref,n)).find(fs.existsSync);
      if(!f){console.warn('  本地没有视频，跳过上传',it.id)}
      else{bytes=fs.statSync(f).size;
        if(old[it.id]&&old[it.id].video_bytes===bytes)console.log('  已存在',it.video);
        else{const r=await fetch(`${URL_}/storage/v1/object/${BUCKET}/${enc(it.video)}`,{method:'POST',headers:{...H,'Content-Type':'video/mp4','x-upsert':'true','Cache-Control':'31536000'},body:fs.readFileSync(f)});
          if(!r.ok){console.error('✗ 上传失败',it.id,r.status,await r.text());bytes=null}else console.log('✓ 上传',it.video,(bytes/1e6).toFixed(1)+'MB')}}}
    rows.push({id:it.id,data:it,video_path:bytes!=null||old[it.id]?.video_path?it.video:null,video_bytes:bytes??old[it.id]?.video_bytes??null,updated_at:new Date().toISOString()});
  }
  const r=await fetch(`${URL_}/rest/v1/${TABLE}`,{method:'POST',headers:{...H,'Content-Type':'application/json',Prefer:'resolution=merge-duplicates'},body:JSON.stringify(rows)});
  console.log(r.ok?`✓ 同步 ${rows.length} 条到 ${TABLE}`:'✗ 同步失败 '+r.status+' '+await r.text());
})();
