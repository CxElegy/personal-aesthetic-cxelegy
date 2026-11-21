// 把原作视频上传到自建 Supabase 的存储桶 aesthetic-videos（网站从这里播放）
//   node tools/db/upload-videos.js            上传还没上传过的
//   node tools/db/upload-videos.js --check    只检查哪些已经在桶里
// 用的是公开的 publishable key（不是秘密）。上传权限由数据库的限时 policy 控制：见 db/open-video-upload.sql。
// 视频文件：条目的 ref 文件夹里的 video.av1.mp4（没有就用 video.mp4）。
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
// 用 curl 发请求：它会走系统的 HTTPS 代理（Node 自带的 fetch 不走代理）
const curl=(args)=>{try{return execFileSync('curl',['-sS','-m','600',...args],{maxBuffer:1e7}).toString()}catch(e){return 'ERR '+String(e.stderr||e.message)}};
const ROOT=path.join(__dirname,'../..');
const cfg=JSON.parse(fs.readFileSync(path.join(ROOT,'site/config.json')));
const URL_=cfg.supabaseUrl,KEY=cfg.anonKey,BUCKET=cfg.videoBucket;
const H={apikey:KEY,Authorization:'Bearer '+KEY};
const enc=p=>p.split('/').map(encodeURIComponent).join('/');
const check=process.argv.includes('--check');
(async()=>{
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
    const out=curl(['-w','\n%{http_code}','-X','POST',`${URL_}/storage/v1/object/${BUCKET}/${enc(it.video)}`,'-H','apikey: '+KEY,'-H','Authorization: Bearer '+KEY,'-H','Content-Type: video/mp4','-H','cache-control: max-age=31536000','--data-binary','@'+f]);
    const st=out.trim().split('\n').pop();
    if(st==='200'){ok++;console.log('✓',it.id,(fs.statSync(f).size/1e6).toFixed(1)+'MB')}else{fail++;console.error('✗',it.id,out.slice(0,240))}
  }
  console.log(`上传 ${ok}，已存在 ${skip}，失败 ${fail}，${check?'不在桶里':'本地没有'} ${miss}`);
})();
