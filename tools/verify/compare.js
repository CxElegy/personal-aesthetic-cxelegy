// 核对：原视频 vs 复刻演示
//   node tools/verify/compare.js <条目 id> [...]      （id 见 catalog/items.json）
// 1. 按 scenarios 里的剧本，用 Playwright 操作 demos/ 里的复刻页面，按时间点截图（我做的）
// 2. 从原视频（references 里的 video.mp4）均匀抽同样数量的帧（原作）
// 3. 上下拼成一张对比图 verify/<id>.jpg：上排原作、下排复刻。之后由 Claude 看图，把结论写回 catalog/items.json 的 verify 字段
const {chromium}=require('playwright');const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const ROOT=path.join(__dirname,'../..');const cat=JSON.parse(fs.readFileSync(path.join(ROOT,'catalog/items.json')));
const S=require('./scenarios');const N=6,TH=360;
// 用本地 http 服务打开演示（ES 模块和 three.js 不能用 file:// 打开）
const http=require('http');const MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.glb':'model/gltf-binary','.mp4':'video/mp4'};
const srv=http.createServer((q,r)=>{const f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);return r.end()}
  r.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});
(async()=>{await new Promise(r=>srv.listen(0,'127.0.0.1',r));const BASE=`http://127.0.0.1:${srv.address().port}/`;
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
for(const id of process.argv.slice(2)){
  const it=cat.items.find(i=>i.id===id);if(!it||!it.demo||!S[id]){console.error('✗ 没有演示或剧本',id);continue}
  const tmp=fs.mkdtempSync('/tmp/verify-');const sc=S[id];
  const p=await b.newPage({viewport:sc.viewport||{width:720,height:540}});
  await p.goto(BASE+it.demo.split('/').map(encodeURIComponent).join('/'));await p.waitForTimeout(300);
  let k=0;const shot=async()=>{await p.screenshot({path:`${tmp}/mine-${k++}.png`})};
  await sc.run(p,shot);
  while(k<N)await shot();
  // 原作：从原视频均匀取 N 帧
  const vid=[path.join(ROOT,it.ref,'video.mp4'),path.join(ROOT,it.ref,'like-发光按钮-流光边框.mp4')].find(f=>fs.existsSync(f));
  if(vid){const dur=+execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',vid]).toString();
    const [a,z]=sc.window||[0,1];
    for(let i=0;i<N;i++){const t=dur*(a+(z-a)*(i+.5)/N);execFileSync('ffmpeg',['-v','error','-y','-ss',String(t),'-i',vid,'-frames:v','1',`${tmp}/orig-${i}.png`])}}
  const row=(pre)=>{const fs_=[...Array(N).keys()].map(i=>`${tmp}/${pre}-${i}.png`).filter(f=>fs.existsSync(f));if(!fs_.length)return null;
    const out=`${tmp}/${pre}-row.png`;const args=['-v','error','-y'];fs_.forEach(f=>args.push('-i',f));
    args.push('-filter_complex',fs_.map((_,i)=>`[${i}]scale=-2:${TH},pad=iw+8:${TH}:4:0:white[v${i}]`).join(';')+';'+fs_.map((_,i)=>`[v${i}]`).join('')+`hstack=${fs_.length}`,out);
    if(fs_.length===1)args.splice(args.indexOf('-filter_complex'),2,'-vf',`scale=-2:${TH}`);execFileSync('ffmpeg',args);return out};
  const o=row('orig'),m=row('mine');const out=path.join(ROOT,'verify',id+'.jpg');
  if(o&&m){execFileSync('ffmpeg',['-v','error','-y','-i',o,'-i',m,'-filter_complex',`[0]scale=1600:-2[a];[1]scale=1600:-2[b];[a][b]vstack`,'-q:v','4',out])}
  else execFileSync('ffmpeg',['-v','error','-y','-i',m,'-vf','scale=1600:-2','-q:v','4',out]);
  console.log('✓',id,'→ verify/'+id+'.jpg',o?'':'（没有原视频，只有复刻）');await p.close();
}
await b.close();srv.close()})();
