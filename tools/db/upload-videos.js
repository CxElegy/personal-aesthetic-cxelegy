// 把原作视频上传到自建 Supabase 的存储桶 aesthetic-videos（网站从这里播放）
//   node tools/db/upload-videos.js            上传还没上传过的
//   node tools/db/upload-videos.js --check    只检查哪些已经在桶里
// 上传身份：专用上传令牌（数据库角色 video_uploader，只能往 aesthetic-videos 写）。令牌存在云端环境的
// Network secrets 里（主机 elegy.tailc8cfff.ts.net，Authorization: Bearer），由代理自动加到请求上，脚本和对话里都看不到。
// 脚本自己只带公开的 publishable key（apikey 头）；Authorization 头发的是占位值，代理会替换。不再开 PC 会话。
// 视频文件：条目的 ref 文件夹里的 video.web.mp4（没有就用 video.mp4）。
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
// 用 curl 发请求：它会走系统的 HTTPS 代理（Node 自带的 fetch 不走代理）
const curl=(args)=>{try{return execFileSync('curl',['-sS','-m','600',...args],{maxBuffer:1e7}).toString()}catch(e){return 'ERR '+String(e.stderr||e.message)}};
const ROOT=path.join(__dirname,'../..');
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'site/config.json')));
const URL_=cfg.supabaseUrl,KEY=cfg.anonKey,BUCKET=cfg.videoBucket;
const H={apikey:KEY,Authorization:'Bearer '+KEY};
const enc=p=>p.split('/').map(encodeURIComponent).join('/');
const check=process.argv.includes('--check');
const run=()=>{
  const cat=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog/items.json')));
  let ok=0,skip=0,fail=0,miss=0;
  for(const it of cat.items){
    if(!it.video)continue;
    const pub=`${URL_}/storage/v1/object/public/${BUCKET}/${enc(it.video)}`;
    const code=curl(['-o','/dev/null','-w','%{http_code}','-I',pub]).trim();
    if(code==='200'){skip++;continue}
    if(check){console.log('  不在桶里',it.id);miss++;continue}
    const f=['video.web.mp4','video.mp4','like-发光按钮-流光边框.mp4'].map(n=>path.join(ROOT,it.ref,n)).find(fs.existsSync);
    if(!f){console.warn('  本地没有视频',it.id);miss++;continue}
    const out=curl(['-w','\n%{http_code}','-X','POST',`${URL_}/storage/v1/object/${BUCKET}/${enc(it.video)}`,'-H','apikey: '+KEY,'-H','Authorization: Bearer upload-token-from-proxy','-H','Content-Type: video/mp4','-H','cache-control: max-age=31536000','--data-binary','@'+f]);
    const st=out.trim().split('\n').pop();
    if(st==='200'){ok++;console.log('✓',it.id,(fs.statSync(f).size/1e6).toFixed(1)+'MB')}else{fail++;console.error('✗',it.id,out.slice(0,240))}
  }
  console.log(`上传 ${ok}，已存在 ${skip}，失败 ${fail}，${check?'不在桶里':'本地没有'} ${miss}`);
  return fail;
};
const fails=run();
if(fails){console.error('有上传失败：如果是 401/403，说明云端环境里还没有上传令牌（Network secrets → elegy.tailc8cfff.ts.net），或令牌过期。');process.exitCode=1}
