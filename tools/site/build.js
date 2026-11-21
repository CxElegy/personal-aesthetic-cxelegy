// 生成网站：把 site/、catalog/items.json、demos/、verify/，以及条目里用到的缩略图复制到 dist/
//   node tools/site/build.js
// GitHub Actions（.github/workflows/pages.yml）会跑这个脚本并发布到 GitHub Pages。
// 数据库地址和公开密钥可以通过环境变量 SUPABASE_URL / SUPABASE_ANON_KEY 写进 config.json（公开密钥本来就会出现在网页里）。
const fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,'../..'),OUT=path.join(ROOT,'dist');
fs.rmSync(OUT,{recursive:true,force:true});fs.mkdirSync(OUT,{recursive:true});
const cp=(rel,dst=rel)=>{const s=path.join(ROOT,rel),d=path.join(OUT,dst);if(!fs.existsSync(s))return console.warn('缺少',rel);fs.mkdirSync(path.dirname(d),{recursive:true});fs.cpSync(s,d,{recursive:true})};
for(const f of fs.readdirSync(path.join(ROOT,'site')))cp('site/'+f,f);
cp('catalog/items.json');cp('demos');cp('verify');
const cat=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog/items.json')));
let n=0;for(const it of cat.items)for(const k of ['thumb','contact'])if(it[k]){cp(it[k]);n++}
const cfg=JSON.parse(fs.readFileSync(path.join(OUT,'config.json')));
if(process.env.SUPABASE_URL)cfg.supabaseUrl=process.env.SUPABASE_URL;if(process.env.SUPABASE_ANON_KEY)cfg.anonKey=process.env.SUPABASE_ANON_KEY;
// 本地预览：LOCAL_VIDEOS=1 时把本地视频复制进 dist/videos/，网站直接从这里播放（只用于预览，不发布到 GitHub）
if(process.env.LOCAL_VIDEOS==='1'){let k=0;for(const it of cat.items){if(!it.video)continue;
  const f=['video.web.mp4','video.mp4','like-发光按钮-流光边框.mp4'].map(n=>path.join(ROOT,it.ref,n)).find(fs.existsSync);
  if(f){const d=path.join(OUT,'videos',it.video);fs.mkdirSync(path.dirname(d),{recursive:true});fs.copyFileSync(f,d);k++}}
  cfg.videoBase='videos/';console.log(`  本地视频 ${k} 段 → dist/videos/`)}
fs.writeFileSync(path.join(OUT,'config.json'),JSON.stringify(cfg,null,1));
fs.writeFileSync(path.join(OUT,'.nojekyll'),'');
console.log(`✓ dist/：${cat.items.length} 条，${n} 张图`);
