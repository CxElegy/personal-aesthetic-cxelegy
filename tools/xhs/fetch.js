// 小红书笔记抓取（在你自己的电脑上跑，用你自己登录的小红书账号）
//
//   node tools/xhs/fetch.js "<分享文字或链接>" ["<第二条>" ...]
//
// 做法参考 piekill/xiaohongshu-summarizer-skill：用带界面的真实浏览器访问，不伪装、不绕过登录。
// 第一次运行会打开浏览器窗口，在窗口里登录小红书即可；登录状态保存在 tools/xhs/.profile/（已 gitignore），之后不用再登。
// 每条笔记保存到 references/xhs/<日期>-<标题>-<id>/：
//   note.md（标题、正文、标签、热门评论、素材）、note.json、img-NN.jpg、video.mp4、frame-NN.jpg（关键帧）、contact-sheet.jpg（总览）
// 云端（没有屏幕）：XHS_HEADLESS=1 XHS_PROFILE=<临时目录> node tools/xhs/fetch.js …  需要登录时会把二维码截图存到 XHS_QR，用手机小红书扫码。
// 只补下载图片和视频：node tools/xhs/media.js references/xhs/<笔记文件夹>
// 依赖：Node.js、playwright（npm i playwright && npx playwright install chromium）、ffmpeg（抽帧用，没有就跳过抽帧）
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');

const ROOT=process.env.XHS_OUT||path.join(__dirname,'../../references/xhs');
// 登录状态缓存：默认放在用户目录 ~/.cache/rednote-profile（不在仓库里，不会被提交）。
// 扫码登录一次后，同一台机器上以后都不用再登，直到小红书让登录过期。
const PROFILE=process.env.XHS_PROFILE||path.join(require('os').homedir(),'.cache','rednote-profile');
// 没有屏幕的环境（云端）：XHS_HEADLESS=1，登录时把二维码截图存到 XHS_QR，用手机小红书扫码登录
const HEADLESS=process.env.XHS_HEADLESS==='1';
const QR=process.env.XHS_QR||path.join(__dirname,'login-qr.png');
const MAX_VIDEO_MB=20;      // 超过就只留关键帧，不把视频放进仓库
const MAX_COMMENTS=10;
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const LOGIN_WAIT_MS=10*60e3; // 等你登录的时间

const links=process.argv.slice(2).map(s=>(s.match(/https?:\/\/[^\s，。]+/)||[])[0]).filter(Boolean);
if(!links.length){console.error('用法: node tools/xhs/fetch.js "<分享文字或链接>" ...');process.exit(1)}

const hasFfmpeg=(()=>{try{execFileSync('ffmpeg',['-version'],{stdio:'ignore'});return true}catch{return false}})();
const isLogin=u=>/\/login|\/website-login/.test(u);

async function readNote(page){
  return page.evaluate(({MAX_COMMENTS})=>{
    const s=window.__INITIAL_STATE__; if(!s) return null;
    // 页面结构会变，递归找第一个带 noteId 的笔记对象
    const seen=new Set();
    const find=o=>{ if(!o||typeof o!=='object'||seen.has(o))return null; seen.add(o);
      if(o.noteId&&('desc' in o||'video' in o||'imageList' in o))return o;
      for(const v of Object.values(o)){const r=find(v);if(r)return r} return null};
    const n=find(s); if(!n) return null;
    const plain=o=>JSON.parse(JSON.stringify(o||null));
    const streams=[];
    for(const [q,arr] of Object.entries((((n.video||{}).media||{}).stream)||{}))
      for(const a of (arr||[])) streams.push({q,urls:[a.masterUrl,...(a.backupUrls||[])].filter(Boolean),w:a.width,h:a.height,size:a.size});
    const comments=[...document.querySelectorAll('.comment-item, .parent-comment, [class*="commentItem"]')].slice(0,MAX_COMMENTS).map(el=>{
      const user=(el.querySelector('.name')||{}).innerText||'';
      const text=((el.querySelector('.content, .note-text')||el).innerText||'').trim().slice(0,200);
      return {user,text};
    }).filter(c=>c.text);
    return {id:n.noteId,type:n.type,title:n.title||'',desc:n.desc||'',user:(n.user||{}).nickname||'',
      tags:(n.tagList||[]).map(t=>t.name),interact:plain(n.interactInfo),
      images:(n.imageList||[]).map(i=>i.urlDefault||i.url||((i.infoList||[]).slice(-1)[0]||{}).url).filter(Boolean),
      video:streams,comments};
  },{MAX_COMMENTS});
}

async function fetchOne(ctx,page,url){
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  if(isLogin(page.url())){
    if(HEADLESS){
      console.log('→ 需要登录：二维码截图在',QR,'，请用手机小红书扫码（最多等 10 分钟）');
      const t0=Date.now();
      while(isLogin(page.url())&&Date.now()-t0<LOGIN_WAIT_MS){
        await page.screenshot({path:QR}).catch(()=>{}); // 二维码会过期刷新，所以每 15 秒重截一次
        await page.waitForTimeout(15000);
      }
      if(isLogin(page.url())) throw new Error('等登录超时');
      console.log('→ 已登录');
    } else {
      console.log('→ 需要登录：请在打开的浏览器窗口里登录小红书（最多等 10 分钟）…');
      await page.waitForURL(u=>!isLogin(u.toString()),{timeout:LOGIN_WAIT_MS});
    }
    await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  }
  await page.waitForFunction(()=>window.__INITIAL_STATE__,null,{timeout:30000}).catch(()=>{});
  await page.mouse.wheel(0,1500); await page.waitForTimeout(2500); // 让评论加载出来
  const note=await readNote(page);
  if(!note) throw new Error('页面里读不到笔记数据（链接失效或页面结构变了），当前地址：'+page.url());

  const slug=(note.title||'untitled').replace(/[\\/:*?"<>|#\s]+/g,'-').replace(/-+$/,'').slice(0,40);
  const dir=path.join(ROOT,`${new Date().toISOString().slice(0,10)}-${slug}-${note.id.slice(-6)}`);
  fs.mkdirSync(dir,{recursive:true});
  // 依次试主地址和备用地址；http 先改 https
  const save=async(us,f)=>{let err;
    for(let u of [].concat(us)){u=u.replace(/^http:/,'https:');
      // 用 curl 下载：它会走系统的 HTTPS 代理（Playwright 自己的请求不走代理）
      try{execFileSync('curl',['-sSfL','-m','300','-e',page.url(),'-A',UA,'-o',path.join(dir,f),u],{stdio:['ignore','ignore','pipe']});return f}
      catch(e){err=new Error(String(e.stderr||e.message).trim()+' '+u)}}
    throw err};

  const imgs=[];
  for(const [i,u] of note.images.entries()){
    try{imgs.push(await save(u,`img-${String(i+1).padStart(2,'0')}.jpg`))}catch(e){console.error('  图片下载失败',e.message)}}

  let videoNote='';
  const vs=note.video.filter(s=>s.urls.length).sort((a,b)=>(a.size||1e12)-(b.size||1e12));
  if(vs.length){
    const v=vs.find(s=>(Math.min(s.w||0,s.h||0))>=540)||vs[vs.length-1];
    const vp=path.join(dir,'video.mp4');
    try{
      await save(v.urls,'video.mp4');
      if(hasFfmpeg){
        // 关键帧：画面变化处 + 每 60 帧保底，最多 24 张；再拼一张每秒一格的总览
        execFileSync('ffmpeg',['-v','error','-y','-i',vp,'-vf','select=gt(scene\\,0.25)+not(mod(n\\,60)),scale=540:-1','-vsync','vfr','-frames:v','24',path.join(dir,'frame-%02d.jpg')]);
        execFileSync('ffmpeg',['-v','error','-y','-i',vp,'-vf','fps=1,scale=240:-1,tile=6x4','-frames:v','1',path.join(dir,'contact-sheet.jpg')]);
      } else videoNote='没有装 ffmpeg，没抽关键帧';
      const mb=fs.statSync(vp).size/1e6;
      if(mb>MAX_VIDEO_MB){fs.unlinkSync(vp);videoNote=`视频 ${mb.toFixed(1)}MB 超过 ${MAX_VIDEO_MB}MB，只保留关键帧`}
    }catch(e){videoNote='视频下载失败：'+e.message}
  }
  const frames=fs.readdirSync(dir).filter(f=>/^frame-/.test(f)).sort();
  const has=f=>fs.existsSync(path.join(dir,f));
  note.source=url; note.fetched=new Date().toISOString(); note.videoNote=videoNote;
  fs.writeFileSync(path.join(dir,'note.json'),JSON.stringify(note,null,1));

  const md=[`# ${note.title||'(无标题)'}`,'',
    `- 作者：${note.user}`,`- 链接：${url}`,`- 抓取：${note.fetched.slice(0,10)}`,
    note.tags.length?`- 标签：${note.tags.map(t=>'#'+t).join(' ')}`:null,
    videoNote?`- 备注：${videoNote}`:null,
    '','## 正文','',note.desc.trim()||'(无)','',
    note.comments.length?'## 热门评论\n\n'+note.comments.map(c=>`- **${c.user||'用户'}**：${c.text.replace(/\n+/g,' ')}`).join('\n')+'\n':null,
    '## 素材','',
    ...imgs.map(f=>`![](${f})`),
    has('contact-sheet.jpg')?'![视频总览（每秒一格）](contact-sheet.jpg)':null,
    frames.length?`关键帧：${frames.map(f=>`[${f}](${f})`).join(' ')}`:null,
    has('video.mp4')?'[视频](video.mp4)':null,
    '','## 学到的（Claude 看完素材后填写，并同步到 AESTHETIC.md）','','- 待填',''].filter(x=>x!==null).join('\n');
  fs.writeFileSync(path.join(dir,'note.md'),md);
  return dir;
}

(async()=>{
  // 带界面的真实浏览器 + 固定的登录资料夹：和你平时用浏览器看小红书一样
  const ctx=await chromium.launchPersistentContext(PROFILE,{headless:HEADLESS,viewport:{width:1280,height:900},locale:'zh-CN'});
  const page=ctx.pages()[0]||await ctx.newPage();
  let failed=0;
  for(const u of links){
    try{console.log('✓',await fetchOne(ctx,page,u))}catch(e){failed++;console.error('✗',u,e.message)}
  }
  await ctx.close();
  process.exit(failed?2:0);
})();
