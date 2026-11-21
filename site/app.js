// 审美图鉴：单页，#编号 打开详情。数据先读 config.json；配置了数据库就从数据库读条目和视频，没有就读仓库里的 catalog/items.json
(() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const enc = p => p.split('/').map(encodeURIComponent).join('/');
  const app = document.getElementById('app');
  const RAR = {3:'最爱', 2:'喜欢', 1:'一般般'};
  const DIM = [['motion','动作质量'],['form','造型还原'],['states','状态完整度'],['render','质感渲染'],['context','呈现情境']];
  let CFG = {}, D = null, view = {cat:'all', st:'all', q:''};
  try { view = {...view, ...JSON.parse(localStorage.getItem('aes-view') || '{}')}; } catch {}
  const save = () => { try { localStorage.setItem('aes-view', JSON.stringify(view)); } catch {} };

  async function load() {
    try { CFG = await (await fetch('config.json', {cache:'no-store'})).json(); } catch { CFG = {}; }
    D = await (await fetch('catalog/items.json', {cache:'no-store'})).json();
    if (CFG.supabaseUrl && CFG.anonKey) {
      try {
        const r = await fetch(`${CFG.supabaseUrl}/rest/v1/${CFG.table}?select=*`, {headers:{apikey:CFG.anonKey, Authorization:'Bearer '+CFG.anonKey}});
        if (r.ok) { const rows = await r.json(); const by = Object.fromEntries(rows.map(x => [x.id, x]));
          D.items = D.items.map(it => by[it.id] ? {...it, ...(by[it.id].data || {}), video: by[it.id].video_path || it.video} : it); }
      } catch (e) { console.warn('数据库读取失败，使用仓库里的索引', e); }
    }
    D.items.forEach((it, i) => it.no = i + 1);
  }
  const videoUrl = k => k && CFG.supabaseUrl ? `${CFG.supabaseUrl}/storage/v1/object/public/${CFG.videoBucket}/${enc(k)}` : null;
  const cat = id => D.categories.find(c => c.id === id) || {name:id};
  const spineColor = id => `var(--sp-${id})`;
  const scoreOf = it => it.verify && it.verify.scale === 10 ? it.verify.score : null;

  function index() {
    document.title = '审美图鉴';
    const L = D.items;
    const done = L.filter(i => scoreOf(i) != null);
    const avg = done.length ? (done.reduce((a, i) => a + scoreOf(i), 0) / done.length).toFixed(1) : '—';
    const heights = [150, 138, 158, 144, 152, 136, 160, 142, 148];
    const spines = [{id:'all', name:'全部'}, ...D.categories].map((c, k) => {
      const n = c.id === 'all' ? L.length : L.filter(i => i.category === c.id).length;
      return `<button class="spine" style="--c:${spineColor(c.id)};--h:${heights[k % heights.length]}px" data-cat="${c.id}" aria-pressed="${view.cat === c.id}"><span class="t">${esc(c.name)}</span><span class="n">${n}</span></button>`;
    }).join('');
    const sts = [['all','全部状态'], ...Object.entries(D.statuses)].filter(([k]) => k === 'all' || L.some(i => i.status === k));
    app.innerHTML = `
      <header class="mast">
        <h1>审美图鉴<i>A <b>Catalogue</b> of Taste</i></h1>
        <div class="tally"><div>${L.length}<span>件收藏</span></div><div>${done.length}<span>件已复刻</span></div><div>${avg}<span>平均复刻分</span></div></div>
        <p>收集来的每一条审美素材：原作是什么样，我复刻出来是什么样，按同一套标准打几分，还差在哪里。</p>
      </header>
      <nav class="shelf" aria-label="分类">${spines}<div class="desc" id="cdesc"></div></nav>
      <div class="shelfnote">
        <div class="tools">${sts.map(([k, v]) => `<button class="chip" data-st="${k}" aria-pressed="${view.st === k}">${esc(v)}</button>`).join('')}
          <input class="search" id="q" type="search" placeholder="搜索标题、标签" value="${esc(view.q)}" aria-label="搜索"></div></div>
      <section class="grid" id="grid"></section>
      <footer>${CFG.supabaseUrl ? '数据来自数据库' : '数据来自仓库里的 catalog/items.json'} · 评分标准见 tools/verify/RUBRIC.md</footer>`;
    const grid = document.getElementById('grid');
    function draw() {
      const c = D.categories.find(c => c.id === view.cat);
      document.getElementById('cdesc').innerHTML = c ? `<b>${esc(c.name)}</b><span>${esc(c.desc)}</span>` : '<b>全部收藏</b><span>点一本书脊按分类看。金色边框的是我最爱的，鼠标移上去会反光。</span>';
      const q = view.q.toLowerCase();
      const items = L.filter(i => (view.cat === 'all' || i.category === view.cat) && (view.st === 'all' || i.status === view.st)
        && (!q || (i.title + i.summary + (i.tags || []).join(' ')).toLowerCase().includes(q)))
        .sort((a, b) => (b.rating || 2) - (a.rating || 2) || a.no - b.no);
      grid.innerHTML = items.map(i => {
        const s = scoreOf(i);
        return `<a class="card r${i.rating || 2}" href="#${esc(i.id)}">
          ${i.thumb ? `<img loading="lazy" src="${enc(i.thumb)}" alt="">` : ''}
          <div class="meta"><span>No. ${String(i.no).padStart(3, '0')}</span><span class="rar">${RAR[i.rating] || ''}</span></div>
          <h3>${esc(i.title)}</h3><p>${esc(i.summary)}</p>
          <div class="foot"><span class="tag"><i style="--c:${spineColor(i.category)}"></i>${esc(cat(i.category).name)} · ${esc(D.statuses[i.status] || '')}</span>
            ${s != null ? `<span class="score">${s}<small>/10</small></span>` : ''}</div></a>`;
      }).join('') || '<p class="empty">没有符合条件的条目。</p>';
      grid.querySelectorAll('.card.r3').forEach(el => el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect(); el.style.setProperty('--sx', (100 - (e.clientX - r.left) / r.width * 100) + '%'); }));
    }
    app.querySelectorAll('.spine').forEach(b => b.onclick = () => { view.cat = b.dataset.cat; save();
      app.querySelectorAll('.spine').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
    app.querySelectorAll('.chip').forEach(b => b.onclick = () => { view.st = b.dataset.st; save();
      app.querySelectorAll('.chip').forEach(x => x.setAttribute('aria-pressed', x === b)); draw(); });
    document.getElementById('q').oninput = e => { view.q = e.target.value.trim(); save(); draw(); };
    draw();
  }

  function detail(it) {
    document.title = it.title + ' · 审美图鉴';
    const v = it.verify, src = it.source || {}, vu = videoUrl(it.video), c = cat(it.category);
    const orig = vu ? `<video src="${vu}" controls loop muted playsinline preload="metadata"></video>`
      : it.thumb ? `<img src="${enc(it.thumb)}" alt="原作截图"><div class="note">${it.video ? '原视频还没上传到数据库，先显示截图。' : '原作没有视频。'}</div>` : '<div class="note">没有原作图片。</div>';
    const mine = it.demo ? `<iframe src="${enc(it.demo)}" title="复刻：${esc(it.title)}" loading="lazy"></iframe>`
      : `<div class="note">${esc(D.statuses[it.status] || '')}${it.status_note ? '：' + esc(it.status_note) : ''}</div>`;
    let specs = '';
    if (v && v.scale === 10) {
      const g = v.gap || {};
      specs = `<div class="specs">
        <section class="box"><h5>复刻评分</h5>
          <div class="big"><b>${v.score}</b><span>/ 10${v.raw > v.score ? ` · 原始 ${v.raw}，被封顶到 ${v.cap}` : ''}</span></div>
          ${v.heart ? `<p class="you">心动点：${esc(v.heart.text)}（${({yes:'做到了',partial:'部分做到',no:'没做到'})[v.heart.met] || ''}）</p>` : ''}
          ${v.user_score != null ? `<p class="you">你的评分：<b>${v.user_score} / 10</b></p>` : '<p class="you">你还没打分。</p>'}
          ${DIM.map(([k, n]) => `<div class="dim"><span>${n}</span><span class="bar"><i style="width:${(v.scores[k] || 0) * 10}%"></i></span><em>${v.scores[k]}</em></div>`).join('')}
          <p class="cap">标准：tools/verify/RUBRIC.md（动作 30%、造型 20%、状态 20%、质感 15%、情境 15%）</p></section>
        <section class="box"><h5>差距分析</h5><dl>
          <div><dt>原作用的技术</dt><dd>${esc(g.original_tech)}</dd></div>
          <div><dt>我用的技术</dt><dd>${esc(g.my_tech)}</dd></div>
          <div><dt>为什么没做到</dt><dd>${esc(g.why)}</dd></div>
          <div><dt>提分路线</dt><dd><ul class="paths">${(g.paths || []).map(p => `<li><b>${esc(p.target)}</b><span>${esc(p.need)}</span></li>`).join('')}</ul></dd></div></dl></section></div>
      ${v.image ? `<section class="box cmp"><h5>逐帧对比 · 上排原作 · 下排复刻</h5><img src="${enc(v.image)}" alt="原作与复刻逐帧对比">
        ${v.match ? `<div class="lists"><ul class="ok">${v.match.map(x => `<li>${esc(x.replace(/\s*✓$/, ''))}</li>`).join('')}</ul><ul class="ng">${(v.diff || []).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}</section>` : ''}`;
    }
    const plan = it.plan ? `<section class="box cmp"><h5>复刻计划 · ${esc({S:'小', M:'中', L:'大'}[it.plan.size] || '')}</h5>
      <dl><div><dt>模板</dt><dd>${esc(it.plan.template)}</dd></div><div><dt>素材</dt><dd>${esc(it.plan.assets.join('；') || '不需要')}</dd></div>
      <div><dt>步骤</dt><dd><ol class="steps">${it.plan.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></dd></div>
      ${it.plan.prompt ? `<div><dt>AI 视频提示词</dt><dd><div class="prompt">${esc(it.plan.prompt)}</div></dd></div>` : ''}
      <div><dt>验收</dt><dd>${esc(it.plan.accept)}</dd></div></dl></section>` : '';
    app.innerHTML = `<button class="back" id="back">← 回到图鉴</button>
      <header class="dhead"><h2>${esc(it.title)}</h2><span class="rar">${RAR[it.rating] || ''} · No. ${String(it.no).padStart(3, '0')}</span>
        <p class="sum"><span class="tag"><i style="--c:${spineColor(it.category)}"></i>${esc(c.name)}</span> · ${esc(D.statuses[it.status] || '')} · ${esc(it.summary)}</p></header>
      <article class="spread">
        <section class="page"><h4>原作 ${src.url ? `<a href="${esc(src.url)}" target="_blank" rel="noopener">${esc(src.author || src.title || '来源')} ↗</a>` : `<span>${esc(src.type || '')}</span>`}</h4>${orig}</section>
        <section class="page"><h4>复刻 ${it.demo ? `<a href="${enc(it.demo)}" target="_blank" rel="noopener">单独打开 ↗</a>` : ''}</h4>${mine}</section>
      </article>${specs}${plan}
      <footer>编号 ${esc(it.id)} · 素材 ${esc(it.ref || '—')} · 视频 ${esc(it.video || '无')}</footer>`;
    document.getElementById('back').onclick = () => { location.hash = ''; };
    // 原作是竖屏时：左页按原作比例变窄，右页的复刻和左页一样高，两页之间不留空
    const spread = app.querySelector('.spread'), media = spread.querySelector('.page video, .page img'), fr = spread.querySelector('iframe');
    const fit = () => { if (!media) return; const w = media.videoWidth || media.naturalWidth, h = media.videoHeight || media.naturalHeight; if (!w || !h) return;
      if (h > w * 1.05 && innerWidth > 820) { spread.classList.add('portrait'); spread.style.setProperty('--lw', Math.round(Math.min(420, 640 * w / h) + 40) + 'px'); }
      if (fr) requestAnimationFrame(() => fr.style.setProperty('--fh', Math.max(440, media.clientHeight) + 'px')); };
    if (media) { media.addEventListener('load', fit); media.addEventListener('loadedmetadata', fit); fit(); }
    scrollTo(0, 0);
  }

  function route() {
    const id = decodeURIComponent(location.hash.slice(1));
    const it = id && D.items.find(i => i.id === id);
    it ? detail(it) : index();
  }
  load().then(() => { addEventListener('hashchange', route); route(); })
    .catch(e => { app.innerHTML = `<p class="empty">读取目录失败：${esc(e.message)}。请确认 catalog/items.json 和页面放在一起。</p>`; });
})();
