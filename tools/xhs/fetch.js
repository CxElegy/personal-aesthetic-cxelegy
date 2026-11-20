// 小红书笔记抓取：node tools/xhs/fetch.js "<分享文字或链接>" [输出根目录]
// 用 Playwright 打开笔记，读取页面里的笔记数据（标题、正文、标签、图片、视频），
// 下载图片和视频，用 ffmpeg 从视频抽关键帧和拼图，写出 note.md / note.json。
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const input=process.argv[2]; const root=process.argv[3]||path.join(__dirname,'../../references/xhs');
if(!input){console.error('用法: node fetch.js "<分享文字或链接>" [输出根目录]');process.exit(1)}
const url=(input.match(/https?:\/\/[^\s，。]+/)||[])[0]; if(!url){console.error('没找到链接');process.exit(1)}
const MAX_VIDEO_MB=20;

(async()=>{
  const b=await chromium.launch();
  const ctx=await b.newContext({viewport:{width:1280,height:900},locale:'zh-CN',
    userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36'});
  const p=await ctx.newPage();
  await p.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await p.waitForFunction(()=>window.__INITIAL_STATE__&&window.__INITIAL_STATE__.note,null,{timeout:30000}).catch(()=>{});
  await p.waitForTimeout(2000);
  const note=await p.evaluate(()=>{
    const s=window.__INITIAL_STATE__; if(!s||!s.note) return null;
    const m=s.note.noteDetailMap||{}; const id=Object.keys(m).find(k=>m[k]&&m[k].note&&m[k].note.noteId)||Object.keys(m)[0];
    const n=m[id]&&m[id].note; if(!n||!n.noteId) return null;
    const pick=o=>JSON.parse(JSON.stringify(o||null));
    const v=n.video||{}; const streams=[];
    for(const [q,arr] of Object.entries(((v.media||{}).stream)||{})) for(const a of (arr||[])) streams.push({q,url:a.masterUrl||(a.backupUrls||[])[0],w:a.width,h:a.height,size:a.size,dur:a.duration});
    return {id:n.noteId,type:n.type,title:n.title,desc:n.desc,user:(n.user||{}).nickname,time:n.time,
      tags:(n.tagList||[]).map(t=>t.name),
      interact:pick(n.interactInfo),
      images:(n.imageList||[]).map(i=>i.urlDefault||i.url||((i.infoList||[]).slice(-1)[0]||{}).url),
      video:streams};
  });
  if(!note){await p.screenshot({path:'/tmp/xhs-fail.png'});console.error('读不到笔记数据（可能需要登录或链接失效），截图 /tmp/xhs-fail.png；页面标题:',await p.title());await b.close();process.exit(2)}
  const slug=(note.title||'untitled').replace(/[\\/:*?"<>|#\s]+/g,'-').slice(0,40);
  const dir=path.join(root,`${new Date().toISOString().slice(0,10)}-${slug}-${note.id.slice(-6)}`);
  fs.mkdirSync(dir,{recursive:true});
  const get=async(u,f)=>{const r=await ctx.request.get(u,{headers:{Referer:'https://www.xiaohongshu.com/'},timeout:120000});if(!r.ok())throw new Error(r.status()+' '+u);fs.writeFileSync(path.join(dir,f),await r.body());return f};
  const files=[];
  for(const [i,u] of note.images.entries()){ if(!u)continue; try{files.push(await get(u,`img-${String(i+1).padStart(2,'0')}.jpg`))}catch(e){console.error('图片失败',e.message)} }
  let frames=[];
  const vs=note.video.filter(s=>s.url).sort((a,b)=>(a.size||1e12)-(b.size||1e12));
  if(vs.length){
    const v=vs.find(s=>(s.w||0)>=540)||vs[vs.length-1];
    const vf='video.mp4'; await get(v.url,vf); const vp=path.join(dir,vf);
    // 关键帧：场景变化帧 + 每 2 秒保底，最多 24 张；再拼一张总览
    execFileSync('ffmpeg',['-v','error','-y','-i',vp,'-vf',"select='gt(scene,0.25)+not(mod(n\\,60))',scale=540:-1",'-vsync','vfr','-frames:v','24',path.join(dir,'frame-%02d.jpg')]);
    frames=fs.readdirSync(dir).filter(f=>/^frame-/.test(f)).sort();
    execFileSync('ffmpeg',['-v','error','-y','-i',vp,'-vf','fps=1,scale=240:-1,tile=6x4','-frames:v','1',path.join(dir,'contact-sheet.jpg')]);
    const mb=fs.statSync(vp).size/1e6; if(mb>MAX_VIDEO_MB){fs.unlinkSync(vp);note.videoNote=`视频 ${mb.toFixed(1)}MB 超过 ${MAX_VIDEO_MB}MB，只保留关键帧`}
  }
  note.source=url; note.fetched=new Date().toISOString();
  fs.writeFileSync(path.join(dir,'note.json'),JSON.stringify(note,null,1));
  const md=[`# ${note.title||'(无标题)'}`,'',`- 作者：${note.user||'?'}`,`- 链接：${url}`,`- 抓取：${note.fetched.slice(0,10)}`,
    note.tags.length?`- 标签：${note.tags.map(t=>'#'+t).join(' ')}`:'', note.videoNote?`- ${note.videoNote}`:'','','## 正文','',(note.desc||'').trim(),'',
    '## 素材','',...files.map(f=>`![](${f})`), fs.existsSync(path.join(dir,'contact-sheet.jpg'))?'![总览](contact-sheet.jpg)':'', fs.existsSync(path.join(dir,'video.mp4'))?'[视频](video.mp4)':'','',
    '## 学到的（由 Claude 看完素材后填写）','','- 待填',''].filter(x=>x!==null).join('\n');
  fs.writeFileSync(path.join(dir,'note.md'),md);
  console.log(dir); await b.close();
})().catch(e=>{console.error(e.message);process.exit(3)});
