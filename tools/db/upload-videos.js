// 把原作视频上传到自建 Supabase 的存储桶 aesthetic-videos（网站从这里播放）
//   node tools/db/upload-videos.js            上传还没上传过的
//   node tools/db/upload-videos.js --check    只检查哪些已经在桶里
// 上传方式：仓库已连上上传服务器（见 CLAUDE.md「视频上传」）。有要传的视频时，脚本自己做验证：
//   取验证码 → 当前分支推一个空提交「upload-proof <nonce>」→ 验证 → 拿到 upload_url（只在内存里，不写文件）
// 然后 PUT <upload_url>/<桶里的路径>，写进 aesthetic-videos 的同一路径；同名不能覆盖。
// 也可以用环境变量 AESTHETIC_UPLOAD_URL 直接给 upload_url（跳过验证）。不开 PC 会话，不找用户要链接。
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
const AUTH='https://elegy.tailc8cfff.ts.net/upload/auth';
const git=(...a)=>execFileSync('git',a,{cwd:ROOT}).toString().trim();
let LINK=(process.env.AESTHETIC_UPLOAD_URL||'').trim().replace(/\/$/,'');
const connect=()=>{
  const repo=git('remote','get-url','origin').replace(/^.*github\.com[:/]/,'').replace(/\.git$/,'');
  const branch=git('branch','--show-current');
  const st=JSON.parse(curl(['-X','POST',`${AUTH}/start?repo=${repo}`]));
  if(!st.ok)throw new Error('取验证码失败：'+JSON.stringify(st));
  try{execFileSync('git',['pull','--rebase','-q','origin',branch],{cwd:ROOT})}catch{}
  git('commit','--allow-empty','-q','-m',`upload-proof ${st.nonce}`);
  git('push','-q','origin',branch);
  for(let i=0;i<6;i++){
    const v=JSON.parse(curl(['-X','POST',`${AUTH}/verify?repo=${repo}&branch=${branch}&nonce=${st.nonce}`]));
    if(v.ok&&v.upload_url){console.log('  已验证，upload_url 有效到',v.expires_at);return v.upload_url.replace(/\/$/,'')}
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)),0,0,5000);
  }
  throw new Error('验证失败（推送可能还没被看到）');
};
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
    if(!LINK){try{LINK=connect()}catch(e){console.error('  ',e.message);fail++;continue}}
    const out=curl(['-w','\n%{http_code}','-X','PUT','--data-binary','@'+f,`${LINK}/${it.video}`]);
    const st=out.trim().split('\n').pop();
    if(/^2\d\d$/.test(st)){ok++;console.log('✓',it.id,(fs.statSync(f).size/1e6).toFixed(1)+'MB')}else{fail++;console.error('✗',it.id,out.slice(0,240))}
  }
  console.log(`上传 ${ok}，已存在 ${skip}，失败 ${fail}，${check?'不在桶里':'本地没有'} ${miss}`);
  return fail;
};
const fails=run();
if(fails){console.error('有上传失败：upload_url 过期（12 小时不用）就重新运行本脚本，它会自动重新验证。');process.exitCode=1}
