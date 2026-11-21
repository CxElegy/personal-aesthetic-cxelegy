// 把原作视频上传到自建 Supabase 的存储桶 aesthetic-videos（网站从这里播放）
//   node tools/db/upload-videos.js            上传还没上传过的
//   node tools/db/upload-videos.js --check    只检查哪些已经在桶里
// 上传方式：PC 提供的限时上传链接（https://elegy.tailc8cfff.ts.net/upload/<令牌>，约一天有效，新链接在 Discord 里）。
// PUT <链接>/<桶里的路径> 就会写进 aesthetic-videos 的同一路径；同名不能覆盖。
// 链接从环境变量 AESTHETIC_UPLOAD_URL 或 ~/.cache/aesthetic-upload-url 读取，**不进仓库**。不开 PC 会话。
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
const os=require('os');
const LINK=(process.env.AESTHETIC_UPLOAD_URL||(()=>{try{return fs.readFileSync(path.join(os.homedir(),'.cache/aesthetic-upload-url'),'utf8')}catch{return ''}})()).trim().replace(/\/$/,'');
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
    if(!LINK){console.error('  没有上传链接：请用户从 Discord 发新的上传链接，存到 ~/.cache/aesthetic-upload-url');fail++;continue}
    const out=curl(['-w','\n%{http_code}','-X','PUT','--data-binary','@'+f,`${LINK}/${it.video}`]);
    const st=out.trim().split('\n').pop();
    if(/^2\d\d$/.test(st)){ok++;console.log('✓',it.id,(fs.statSync(f).size/1e6).toFixed(1)+'MB')}else{fail++;console.error('✗',it.id,out.slice(0,240))}
  }
  console.log(`上传 ${ok}，已存在 ${skip}，失败 ${fail}，${check?'不在桶里':'本地没有'} ${miss}`);
  return fail;
};
const fails=run();
if(fails){console.error('有上传失败：401/403/404 多半是上传链接过期，请用户从 Discord 发新链接。');process.exitCode=1}
