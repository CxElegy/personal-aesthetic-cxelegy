// 只补下载：按已有的 note.json 重新下载图片和视频、抽关键帧（不重新打开网页）
//   node tools/xhs/media.js references/xhs/<笔记文件夹> ...
const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
const get=(us,out)=>{let err;for(let u of us){u=u.replace(/^http:/,'https:');
  try{execFileSync('curl',['-sSfL','-m','600','-e','https://www.rednote.com/','-A',UA,'-o',out,u],{stdio:['ignore','ignore','pipe']});return true}
  catch(e){err=String(e.stderr||e.message).trim()}} console.error('  失败',err);return false};
for(const dir of process.argv.slice(2)){
  const n=JSON.parse(fs.readFileSync(path.join(dir,'note.json')));
  n.images.forEach((u,i)=>get([u],path.join(dir,`img-${String(i+1).padStart(2,'0')}.jpg`)));
  const vs=(n.video||[]).filter(s=>s.urls.length).sort((a,b)=>(a.size||1e12)-(b.size||1e12));
  if(vs.length){const v=vs.find(s=>Math.min(s.w||0,s.h||0)>=540)||vs[vs.length-1];const vp=path.join(dir,'video.mp4');
    if(get(v.urls,vp)){
      execFileSync('ffmpeg',['-v','error','-y','-i',vp,'-vf','select=gt(scene\\,0.25)+not(mod(n\\,60)),scale=540:-1','-vsync','vfr','-frames:v','24',path.join(dir,'frame-%02d.jpg')]);
      execFileSync('ffmpeg',['-v','error','-y','-i',vp,'-vf','fps=1,scale=240:-1,tile=6x4','-frames:v','1',path.join(dir,'contact-sheet.jpg')]);
    }}
  console.log('✓',dir,fs.readdirSync(dir).join(' '));
}
