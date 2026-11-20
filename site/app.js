// 审美图鉴前端：先读 config.json；配置了数据库就从数据库读条目和视频，没配置就读仓库里的 catalog/items.json
const Aes=(()=>{
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const enc=p=>p.split('/').map(encodeURIComponent).join('/');
  let CFG={},DATA=null;
  async function load(){
    try{CFG=await (await fetch('config.json',{cache:'no-store'})).json()}catch{CFG={}}
    const local=await (await fetch('catalog/items.json',{cache:'no-store'})).json();
    DATA=local;
    if(CFG.supabaseUrl&&CFG.anonKey){
      try{const r=await fetch(`${CFG.supabaseUrl}/rest/v1/${CFG.table}?select=*`,{headers:{apikey:CFG.anonKey,Authorization:'Bearer '+CFG.anonKey}});
        if(r.ok){const rows=await r.json();const byId=Object.fromEntries(rows.map(x=>[x.id,x]));
          DATA.items=local.items.map(it=>byId[it.id]?{...it,...(byId[it.id].data||{}),video:byId[it.id].video_path||it.video}:it);
          rows.filter(x=>!local.items.find(i=>i.id===x.id)&&x.data).forEach(x=>DATA.items.push({id:x.id,...x.data,video:x.video_path}))}}catch(e){console.warn('数据库读取失败，使用仓库里的索引',e)}}
    return DATA}
  const videoUrl=k=>k&&CFG.supabaseUrl?`${CFG.supabaseUrl}/storage/v1/object/public/${CFG.videoBucket}/${enc(k)}`:null;
  const pill=(cls,t)=>`<span class="pill ${cls}"><span>${esc(t)}</span></span>`;
  async function index(){
    const d=await load();const st=d.statuses;let cat='all',stf='all',q='';
    const n=s=>d.items.filter(i=>i.status===s).length;
    document.getElementById('stats').innerHTML=`<div><b>${d.items.length}</b><span>条素材</span></div><div><b>${n('replicated')}</b><span>已复刻</span></div><div><b>${d.categories.length}</b><span>个分类</span></div>`;
    const cats=document.getElementById('cats'),sts=document.getElementById('sts');
    const btn=(k,label,count,on)=>`<button class="tg${on?' on':''}" data-k="${k}"><span>${esc(label)}<small>${count}</small></span></button>`;
    function bars(){cats.innerHTML=btn('all','全部',d.items.length,cat==='all')+d.categories.map(c=>btn(c.id,c.name,d.items.filter(i=>i.category===c.id).length,cat===c.id)).join('');
      document.getElementById('catdesc').textContent=cat==='all'?'按分类、复刻状态筛选；点卡片看原作和复刻的对比。':(d.categories.find(c=>c.id===cat)||{}).desc;
      [...sts.querySelectorAll('.tg')].forEach(b=>b.remove());
      sts.insertAdjacentHTML('afterbegin',btn('all','所有状态',d.items.length,stf==='all')+Object.entries(st).map(([k,v])=>btn(k,v,n(k),stf===k)).join(''))}
    function grid(){const L=d.items.filter(i=>(cat==='all'||i.category===cat)&&(stf==='all'||i.status===stf)&&(!q||(i.title+i.summary+(i.tags||[]).join(' ')).toLowerCase().includes(q)));
      document.getElementById('grid').innerHTML=L.map(i=>{const c=d.categories.find(c=>c.id===i.category);
        return `<a class="card" href="item.html?id=${encodeURIComponent(i.id)}">${i.thumb?`<img loading="lazy" src="${enc(i.thumb)}" alt="">`:''}<div class="body">
        <div class="meta">${pill('',c?c.name:i.category)}${pill('st-'+i.status,st[i.status]||i.status)}${i.verify?`<span class="score">${i.verify.score}<small> 分</small></span>`:''}</div>
        <h3>${esc(i.title)}</h3><p>${esc(i.summary)}</p></div></a>`}).join('')||'<div class="empty">没有符合条件的条目</div>'}
    cats.onclick=e=>{const b=e.target.closest('.tg');if(!b)return;cat=b.dataset.k;bars();grid()};
    sts.onclick=e=>{const b=e.target.closest('.tg');if(!b)return;stf=b.dataset.k;bars();grid()};
    document.getElementById('q').oninput=e=>{q=e.target.value.trim().toLowerCase();grid()};
    bars();grid();
    document.getElementById('foot').textContent=CFG.supabaseUrl?'数据来自数据库 · 代码在 GitHub':'数据来自仓库里的 catalog/items.json（数据库还没配置）';
  }
  async function item(){
    const d=await load();const id=new URLSearchParams(location.search).get('id');const i=d.items.find(x=>x.id===id);const P=document.getElementById('page');
    if(!i){P.innerHTML='<a class="back" href="./">← 返回图鉴</a><div class="empty">找不到这一条</div>';return}
    document.title=i.title+' · 审美图鉴';const c=d.categories.find(c=>c.id===i.category);const v=videoUrl(i.video);const src=i.source||{};
    const orig=v?`<video src="${v}" controls loop muted playsinline preload="metadata"></video>`
      :i.thumb?`<img src="${enc(i.thumb)}" alt="原作截图"><div class="note">${i.video?'原视频还没上传到数据库，先显示截图。':'原作没有视频，显示截图。'}</div>`:'<div class="note">没有原作图片</div>';
    const mine=i.demo?`<iframe src="${enc(i.demo)}" title="复刻：${esc(i.title)}" loading="lazy"></iframe>`
      :`<div class="note">${esc(d.statuses[i.status]||'')}${i.status_note?'：'+esc(i.status_note):''}</div>`;
    const vf=i.verify;
    P.innerHTML=`<a class="back" href="./">← 返回图鉴</a><div class="meta">${pill('',c?c.name:'')}${pill('st-'+i.status,d.statuses[i.status]||'')}${(i.tags||[]).map(t=>pill('st-n/a',t)).join('')}</div>
      <h1 class="dh">${esc(i.title)}</h1><p class="lead">${esc(i.summary)}</p>
      <div class="pair"><section class="panel"><h2>原作${src.url?` <a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.type||'来源')}：${esc(src.author||src.title||'打开')} ↗</a>`:''}</h2>${orig}</section>
        <section class="panel"><h2>我的复刻${i.demo?` <a href="${enc(i.demo)}" target="_blank">全屏打开 ↗</a>`:''}</h2>${mine}</section></div>
      ${vf?`<section class="panel verify"><h2>核对结果 <span>${esc(vf.date)}</span></h2>
        <div class="info"><div><span>相似度（人工评分）</span><b class="big">${vf.score}</b></div><div><span>核对方法</span>${esc(vf.method)}</div></div>
        <img src="${enc(vf.image)}" alt="上排原作、下排复刻"><div class="note">上排：原视频均匀抽 6 帧 · 下排：复刻页面按同样的操作截 6 帧</div>
        <div class="cols"><div><h3>对上了</h3><ul class="ok">${vf.match.map(x=>`<li>${esc(x.replace(/\s*✓$/,''))}</li>`).join('')}</ul></div><div><h3>还不一样</h3><ul class="ng">${vf.diff.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div></div></section>`:''}
      <div class="info"><div><span>素材文件夹</span>${esc(i.ref||'—')}</div><div><span>视频</span>${esc(i.video||'无')}</div><div><span>编号</span>${esc(i.id)}</div></div>`;
  }
  return{index,item};
})();
