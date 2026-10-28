/* PK Junior NACC. Static GitHub Pages frontend; Supabase owns all authorization. */
(async () => {
  'use strict';
  const C = window.PK_CONFIG;
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = n => `<i data-lucide="${n}"></i>`;
  const icons = () => window.lucide?.createIcons();
  const fmt = (v, time = true) => {
    if (!v) return 'ไม่ระบุวันที่';
    const d = new Date(v);
    return Number.isNaN(+d) ? 'วันที่ไม่ถูกต้อง' : new Intl.DateTimeFormat('th-TH', {
      dateStyle:'medium', ...(time ? {timeStyle:'medium', timeZone:'Asia/Bangkok'} : {timeZone:'Asia/Bangkok'})
    }).format(d) + (time ? ' น.' : '');
  };
  const number = n => new Intl.NumberFormat('th-TH').format(n ?? 0);
  function safeUrl(v) {
    try { const u = new URL(String(v)); return ['https:','http:'].includes(u.protocol) ? u.href : ''; } catch { return ''; }
  }
  function imageUrl(v) {
    const u = safeUrl(v);
    const m = u.match(/drive\.google\.com\/file\/d\/([^/]+)/) || u.match(/drive\.google\.com\/(?:open|uc)\?[^#]*id=([^&]+)/);
    return m ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(m[1])}&sz=w1600` : u;
  }
  function normalizeFiles(v) {
    if (!v) return [];
    if (typeof v === 'string') { try { v = JSON.parse(v); } catch { v = [v]; } }
    if (!Array.isArray(v)) v = [v];
    return v.map((f,i) => typeof f === 'string' ? {url:f,name:`เอกสาร ${i+1}`,type:/\.pdf(?:\?|$)/i.test(f)?'application/pdf':'image/jpeg'} : f)
      .filter(f => f && safeUrl(f.url));
  }
  const photoOf = f => f && String(f.type || '').startsWith('image/') ? imageUrl(f.url) : '';
  function sanitize(v) {
    return DOMPurify.sanitize(String(v || ''), {
      ALLOWED_TAGS:['p','br','div','span','b','strong','i','em','u','s','h2','h3','ul','ol','li','a','blockquote','font'],
      ALLOWED_ATTR:['href','target','rel','style','color']
    });
  }
  DOMPurify.addHook('afterSanitizeAttributes', node => {
    if (node.hasAttribute?.('style')) {
      const old = node.style;
      const keep = ['text-align','color','font-weight','font-style','text-decoration']
        .map(k => [k,old.getPropertyValue(k)])
        .filter(([,v]) => v && !/url|expression|var\(/i.test(v));
      node.removeAttribute('style');
      keep.forEach(([k,v]) => node.style.setProperty(k,v));
    }
    if (node.tagName === 'A') {
      const href = safeUrl(node.getAttribute('href'));
      if (!href) node.removeAttribute('href');
      else { node.setAttribute('href',href); node.setAttribute('target','_blank'); node.setAttribute('rel','noopener noreferrer'); }
    }
  });
  const GROUPS = [
    ['ประวัติ', [['significance','ที่มา และความสำคัญ'],['hoop','เจตจำนง'],['anthority','อำนาจหน้าที่'],['membernacc','บุคคลกร (คณะกรรมการ ป.ป.ช.สพฐ.น้อย)'],['anacc','ตัวแทนห้อง (อนุกรรมการ ป.ป.ช.สพฐ.น้อย)']]],
    ['ข่าวสาร', [['announce','ประกาศ'],['information','ประชาสัมพันธ์'],['make','คำสั่ง'],['newsletter','จดหมายข่าว'],['certificate','ทะเบียนเกียรติบัตร'],['award','ผลงาน']]],
    ['กลุ่มงาน', [['plan','นโยบาย และแผนดำเนินโครงการ'],['mony','งบประมาณ'],['culecculum','หลักสูตร']]],
    ['สารสนเทศ', [['tammanun','ธรรมนูญ (ภายใน)'],['law','กฎหมาย (คณะกรรมาธิการ)']]]
  ];
  const LABELS = Object.fromEntries(GROUPS.flatMap(g => g[1]));
  const NEWS_TYPES = {announce:'ประกาศ',information:'ประชาสัมพันธ์',make:'คำสั่ง',newsletter:'จดหมายข่าว'};
  const POSITIONS = ['ผู้อำนวยการ','รองผู้อำนวยการกลุ่มบริหารวิชาการ','หัวหน้างานวิชาการ','ครูที่ปรึกษา','ประธาน ฯ','รองประธาน ฯ','เลขานุการ ฯ','ผู้ช่วยเลขานุการ ฯ','กรรมการ','นักเรียนที่ปรึกษา ฯ'];
  const MEDALS = ['ชนะเลิศ','รองชนะเลิศอันดับ 1','รองชนะเลิศอันดับ 3','ชมเชย','เข้าร่วม','เหรียญทอง','เหรียญเงิน','เหรียญทองแดง'];
  const DEFAULT_BUTTONS = [
    ['รู้จัก ป.ป.ช.สพฐ.น้อย','significance','shield-check'],
    ['คณะกรรมการ','membernacc','users-round'],
    ['ประกาศและคำสั่ง','make','megaphone'],
    ['ทะเบียนเกียรติบัตร','certificate','award'],
    ['นโยบายและแผนงาน','plan','clipboard-list'],
    ['เอกสารและกฎหมาย','law','book-open']
  ].map(([meg,url,i]) => ({meg,url,icon:i}));
  let db = null, profile = null, authUser = null, routeVersion = 0, visitRecorded = false, toastTimer;
  const main = $('#main');
  // บางบริบท (เช่น เปิดเว็บใน iframe) เบราว์เซอร์จะปิด Locks API ที่ Supabase Auth ใช้
  // ตรวจก่อนสร้าง client ถ้าใช้ไม่ได้ให้ใช้ตัวแทนแบบเรียบง่าย (บน GitHub Pages ปกติไม่มีผลใด)
  try {
    if (!navigator.locks?.request) throw new Error('no locks');
    await navigator.locks.request('pk-probe', () => {});
  } catch {
    try {
      Object.defineProperty(navigator, 'locks', {
        configurable: true,
        value: { request: async (name, optsOrFn, maybeFn) => (typeof optsOrFn === 'function' ? optsOrFn : maybeFn)?.() }
      });
    } catch {}
  }
  if (C.connected && window.supabase) db = window.supabase.createClient(C.supabaseUrl,C.publishableKey,{
    auth:{persistSession:false,detectSessionInUrl:false,autoRefreshToken:true}
  });
  $('#install-banner').hidden = !!db;
  function toast(s) { $('#toast').textContent=s; $('#toast').hidden=false; clearTimeout(toastTimer); toastTimer=setTimeout(()=>$('#toast').hidden=true,4500); }
  function empty(title='ยังไม่มีข้อมูลที่เผยแพร่', text='เมื่อเจ้าหน้าที่เพิ่มข้อมูลแล้ว ข้อมูลจะแสดงในส่วนนี้', i='folder-open') {
    return `<div class="empty-state">${icon(i)}<h3>${esc(title)}</h3><p>${esc(text)}</p></div>`;
  }
  function heading(title,sub='') {
    return `<section class="page-heading"><div class="container"><div class="breadcrumb"><a href="#/">หน้าหลัก</a> / ${esc(title)}</div><h1>${esc(title)}</h1>${sub?`<p>${esc(sub)}</p>`:''}</div></section>`;
  }
  function errorMessage(e) {
    if (/row-level|permission|JWT|not authorized|Unauthorized/i.test(e?.message || '')) return 'ไม่มีสิทธิ์ดำเนินการ กรุณาเข้าสู่ระบบใหม่หรือติดต่อผู้ดูแล';
    if (e?.code === '23505') return 'พบข้อมูลซ้ำ กรุณาตรวจสอบปีการศึกษา รหัสนักเรียน หรือชื่อผู้ใช้';
    if (e?.code === '23514') return 'ข้อมูลไม่ตรงตามข้อกำหนด กรุณาตรวจสอบช่องกรอกและสถานะโครงการ';
    return `ดำเนินการไม่สำเร็จ: ${e?.message || 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้ กรุณาลองอีกครั้ง'}`;
  }
  async function readRows(table, filters={}, order='id', ascending=true) {
    if (!db) return [];
    const all=[];
    for (let from=0;;from+=1000) {
      let q=db.from(table).select('*').order(order,{ascending}).range(from,from+999);
      Object.entries(filters).forEach(([k,v])=>q=q.eq(k,v));
      const {data,error}=await q;
      if(error) throw error;
      all.push(...data);
      if(data.length<1000) return all;
    }
  }
  async function latest(table) {
    if (!db) return {year:null,rows:[]};
    const {data,error}=await db.from(table).select('year').order('year',{ascending:false}).limit(1);
    if(error) throw error;
    const year=data?.[0]?.year;
    return {year,rows:year ? await readRows(table,{year},table==='ANACC'?'no':'name') : []};
  }
  function linkTarget(v) {
    if(safeUrl(v)) return safeUrl(v);
    let key=String(v||'').replace(/^#?\/?/,'').replace(/\/$/,'');
    key=Object.entries(LABELS).find(([,s])=>s===key)?.[0] || key;
    return LABELS[key] || ['','news','login'].includes(key) ? `#/${key}` : '';
  }
  function externalAttrs(u) { return u.startsWith('#')?'':' target="_blank" rel="noopener noreferrer"'; }
  function setupShell() {
    $('.skip').onclick=e=>{e.preventDefault();main.focus();main.scrollIntoView({behavior:'instant'});};
    $('#main-nav').innerHTML=`<a href="#/" class="text-link">หน้าหลัก</a>`+GROUPS.map(([name,items])=>
      `<details class="nav-group"><summary>${esc(name)}${icon('chevron-down')}</summary><div class="dropdown">${items.map(([k,v])=>`<a href="#/${k}">${esc(v)}</a>`).join('')}</div></details>`).join('');
    $$('.nav-group').forEach(d=>d.addEventListener('toggle',()=>{if(d.open) $$('.nav-group').filter(x=>x!==d).forEach(x=>x.open=false);}));
    $('#menu-toggle').onclick=()=>{const open=$('#main-nav').classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));};
    $('#main-nav').addEventListener('click',e=>{if(e.target.closest('a')) closeNav();});
    $('#close-modal').onclick=()=>$('#modal').close();
    $('#modal').addEventListener('click',e=>{if(e.target===$('#modal')) {const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
    document.addEventListener('click',e=>{if(!e.target.closest('.nav-group')) $$('.nav-group').forEach(d=>d.open=false);});
    document.addEventListener('error',e=>{
      if(e.target.tagName==='IMG') {
        const img=e.target;
        if(img.dataset.failed)return;
        img.dataset.failed='true';
        img.style.objectFit='contain';img.src='./assets/logo.png';
        img.alt=`${img.alt || 'รูปภาพ'} (ไม่สามารถโหลดรูปต้นฉบับได้)`;
      }
    },true);
    const ids=['1pR3z3yqWvR0NWFXthGGAZi4wmCcWqSPP','1clHr-iDb4_yG-c51kNqArnSiPwzUfB9U','1Khty8Gu0LYuaC7ZYqXdh5J8aCut8g_3R','1E3Sfzalpk46I9uOFhsnfWrBURGb8LsED','1y1cSQLU2gnYCrHRN1LfwU6CE276URUHh','1RNTiCMiZ6FDOYPO9GEaYudMON6fZmxe8'];
    $('#footer-logos').innerHTML=ids.map((id,i)=>`<img src="./assets/footer-${i+1}.png" width="45" height="48" loading="lazy" alt="ตราหน่วยงานร่วมสนับสนุน ${i+1}">`).join('');
    document.addEventListener('click',e=>{
      const cmd=e.target.closest('[data-edit-public]');
      if(cmd) location.hash=`/admin/${cmd.dataset.editPublic}`;
      const a=e.target.closest('a[href="#/"]');
      if(a&&['','#/','#'].includes(location.hash))window.scrollTo({top:0,behavior:'instant'});
    });
    document.addEventListener('click',async e=>{
      const b=e.target.closest('[data-download-url]');
      if(!b)return;
      const url=safeUrl(b.dataset.downloadUrl);
      if(!url)return;
      b.disabled=true;
      try {
        const response=await fetch(url,{credentials:'omit'});
        if(!response.ok)throw new Error('ดาวน์โหลดไฟล์ไม่สำเร็จ');
        const blob=await response.blob(),objectUrl=URL.createObjectURL(blob);
        const a=document.createElement('a');a.href=objectUrl;a.download=b.dataset.downloadName||'document';document.body.append(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(objectUrl),30000);
      }catch{toast('ดาวน์โหลดอัตโนมัติไม่ได้ กรุณากด “เปิดเอกสาร” แล้วดาวน์โหลดจากหน้าต่างที่เปิดขึ้น');}
      finally{b.disabled=false;}
    });
  }
  function closeNav() { $('#main-nav').classList.remove('open'); $('#menu-toggle').setAttribute('aria-expanded','false'); $$('.nav-group').forEach(d=>d.open=false); }
  const editButton=key=>profile?`<button class="btn secondary" data-edit-public="${key}">${icon('pencil')} จัดการข้อมูลหน้านี้</button>`:'';
  function attachments(v) {
    const files=normalizeFiles(v);
    return files.length?`<div class="attachments">${files.map(f=>{
      const url=safeUrl(f.url),isPdf=f.type==='application/pdf' || /\.pdf(?:\?|$)/i.test(url);
      return `<div class="attachment">${isPdf?`<iframe title="${esc(f.name||'เอกสาร PDF')}" src="${esc(url)}" loading="lazy" referrerpolicy="no-referrer"></iframe>`:`<img src="${esc(imageUrl(url))}" loading="lazy" alt="${esc(f.name||'ไฟล์ภาพแนบ')}">`}<div class="attachment-actions"><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${icon('external-link')} เปิดเอกสาร ${esc(f.name||'ไฟล์แนบ')}</a><button class="btn secondary small" data-download-url="${esc(url)}" data-download-name="${esc(f.name||'document')}">${icon('download')} ดาวน์โหลด</button></div></div>`;
    }).join('')}</div>`:'';
  }
  function newsCard(n) {
    const f=normalizeFiles(n.url).find(f=>photoOf(f));
    return `<a href="#/news/${encodeURIComponent(n.id)}" class="news-card">${f?`<img class="news-image" src="${esc(photoOf(f))}" alt="${esc(n.name)}" loading="lazy">`:`<div class="news-file-cover">${icon('file-text')}</div>`}<div class="news-body"><span class="badge">${esc(n.type)}</span><h3>${esc(n.name)}</h3><div class="news-meta"><span>${esc(n.regisname)}</span><span>• ${esc(fmt(n.timestamp))}</span></div></div></a>`;
  }
  function newsFilters() { return ['ทั้งหมด',...Object.values(NEWS_TYPES)].map((t,i)=>`<button class="chip${!i?' active':''}" data-filter="${esc(t)}" aria-pressed="${!i}">${esc(t)}</button>`).join(''); }
  function wireNewsFilters(rows, selector='#news-results') {
    $$('[data-filter]').forEach(b=>b.onclick=()=>{
      $$('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});
      const list=rows.filter(n=>b.dataset.filter==='ทั้งหมด'||n.type===b.dataset.filter);
      $(selector).innerHTML=list.length?list.map(newsCard).join(''):empty('ยังไม่มีข่าวสารในหมวดนี้','เลือกหมวดอื่น หรือกลับมาติดตามข่าวสารใหม่ได้ที่นี่','newspaper');
      icons();
    });
  }
  async function deviceName() {
    const ua=navigator.userAgent;
    const android=ua.match(/Android[^;]*;\s*([^;)]+?)(?:\s+Build\/|[;)])/i);
    if(android)return `Android ${android[1]}`.slice(0,120);
    if(/iPhone/.test(ua))return 'Apple iPhone (ไม่ระบุรุ่น)';
    if(/iPad/.test(ua))return 'Apple iPad (ไม่ระบุรุ่น)';
    if(/Windows/.test(ua))return 'คอมพิวเตอร์ Windows (ไม่ระบุรุ่น)';
    if(/Macintosh/.test(ua))return 'คอมพิวเตอร์ macOS (ไม่ระบุรุ่น)';
    if(/Linux/.test(ua))return 'อุปกรณ์ Linux (ไม่ระบุรุ่น)';
    return 'อุปกรณ์อื่น (ไม่ระบุรุ่น)';
  }
  async function home(version) {
    main.innerHTML=`
      <section class="hero" id="hero"><div class="container hero-inner"><div class="hero-copy"><div class="eyebrow">ความซื่อสัตย์เริ่มต้นที่เรา</div><h1>ป.ป.ช.สพฐ.น้อย<br>โรงเรียนภูเขียว</h1><p class="tagline">ส่งเสริม 5 คุณลักษณะโรงเรียนสุจริต<br>ป้องกันและต่อต้านทุจริต</p><p class="subline">คณะกรรมการป้องกัน และปราบปรามการทุจริต<br>สำหรับนักเรียน โรงเรียนภูเขียว</p><div class="hero-bottom"><a class="hero-link" href="#/significance">รู้จักองค์กรของเรา ${icon('arrow-right')}</a><div class="slide-controls" id="hero-controls" hidden></div></div></div><img class="hero-mark" src="./assets/logo.png" width="235" height="265" alt="ตรา ป.ป.ช.สพฐ.น้อย โรงเรียนภูเขียว"></div></section>
      <section class="values" aria-label="5 คุณลักษณะโรงเรียนสุจริต"><div class="container values-inner"><div class="values-intro">5 คุณลักษณะ<br>โรงเรียนสุจริต</div>${['ทักษะกระบวนการคิด','มีวินัย','ซื่อสัตย์สุจริต','อยู่อย่างพอเพียง','จิตสาธารณะ'].map((t,i)=>`<div class="value-item"><span>0${i+1}</span>${t}</div>`).join('')}</div></section>
      <div class="container" id="announcements"></div>
      <section class="quick-section"><div class="container"><div class="quick-grid" id="quick-links"></div><hr class="gold-rule"></div></section>
      <section class="section news-section"><div class="container"><div class="section-heading centered news-heading"><div><p class="overline">ข่าวสารและประกาศ</p><h2>ประกาศ/ข่าวสาร ล่าสุด</h2></div><a href="#/news" class="text-link">ดูทั้งหมด ${icon('arrow-right')}</a></div><div class="news-filters">${newsFilters()}</div><div class="news-grid" id="news-results">${db?'<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>':empty('พื้นที่ข่าวสารของโรงเรียน','ประกาศ ประชาสัมพันธ์ คำสั่ง และจดหมายข่าว จะแสดงที่นี่เมื่อเจ้าหน้าที่เผยแพร่ข้อมูล','newspaper')}</div></div></section>
      <div class="container"><hr class="gold-rule"></div>
      <section class="section stats-section"><div class="container"><div class="section-heading centered"><div><p class="overline">ชุมชนของเรา</p><h2>สถิติการเข้าชม</h2></div></div><div class="stats-grid" id="stats-grid">${renderStats(null)}</div><p class="stats-note" id="stats-note">${db?'นับการเปิดหน้าหลัก ไม่ใช่จำนวนบุคคลไม่ซ้ำ':'ยังไม่เชื่อมต่อฐานข้อมูล จึงยังไม่มีสถิติจริง'} • <a href="#/privacy">รายละเอียดการเก็บสถิติ</a></p></div></section>`;
    renderQuick(DEFAULT_BUTTONS);
    wireNewsFilters([]);
    icons();
    if(!db)return;
    try {
      const [photos,buttons,news,banners]=await Promise.all([
        readRows('Home',{},'sort_order'),readRows('botton',{},'sort_order'),
        db.from('new').select('*').order('timestamp',{ascending:false}).limit(9).then(r=>{if(r.error)throw r.error;return r.data;}),
        db.rpc('active_announcements').then(r=>{if(r.error)throw r.error;return r.data;})
      ]);
      if(version!==routeVersion)return;
      renderQuick(buttons.length?buttons:DEFAULT_BUTTONS);
      $('#news-results').innerHTML=news.length?news.map(newsCard).join(''):empty('ยังไม่มีข่าวสารที่เผยแพร่','ติดตามประกาศและกิจกรรมล่าสุดได้ในพื้นที่นี้','newspaper');
      wireNewsFilters(news);
      $('#announcements').innerHTML=banners.map(b=>`<a class="announcement" href="${esc(linkTarget(b.url)||'#/')}"${externalAttrs(linkTarget(b.url)||'#/')}><img src="${esc(imageUrl(b.photo))}" alt="${esc(b.name||'ประกาศสำคัญ')}"></a>`).join('');
      if(photos.length) setupSlideshow(photos);
      if(!visitRecorded) {
        visitRecorded=true;
        const {error}=await db.rpc('record_visit',{device:await deviceName()});
        if(error) $('#stats-note').textContent='ไม่สามารถบันทึกการเข้าชมครั้งนี้ได้';
      }
      const {data:stats,error}=await db.rpc('site_stats');
      if(version!==routeVersion)return;
      if(error)$('#stats-note').textContent='ไม่สามารถโหลดสถิติได้ กรุณาลองเปิดหน้าหลักอีกครั้ง';
      else $('#stats-grid').innerHTML=renderStats(stats);
      icons();
    } catch(e) {
      if(version!==routeVersion)return;
      $('#news-results').innerHTML=empty('ยังโหลดข้อมูลไม่ได้',errorMessage(e),'wifi-off');
      icons();
    }
  }
  function renderQuick(rows) {
    $('#quick-links').innerHTML=rows.map((r,i)=>{
      const u=linkTarget(r.url);
      return `<a class="quick-link" href="${esc(u||'#/')}"${externalAttrs(u||'#/')}>${r.photo&&safeUrl(r.photo)?`<img src="${esc(imageUrl(r.photo))}" alt="" width="38" height="38">`:icon(r.icon||DEFAULT_BUTTONS[i%6].icon)}<span>${esc(r.meg)}</span></a>`;
    }).join('');
  }
  function renderStats(s) {
    return [
      [s?.visitors,'ผู้เยี่ยมชมหน้าหลัก','จำนวนครั้งที่เปิดหน้าหลัก'],
      [s?.members,'คณะกรรมการ ป.ป.ช.สพฐ.น้อย',s?.member_year?`ปีการศึกษา ${s.member_year}`:'ปีการศึกษาล่าสุด'],
      [s?.delegates,'อนุกรรมการ ป.ป.ช.สพฐ.น้อย',s?.delegate_year?`ปีการศึกษา ${s.delegate_year}`:'ปีการศึกษาล่าสุด']
    ].map(([n,t,d])=>`<div class="stat"><strong>${n==null?'—':number(n)}</strong><p>${t}</p><small>${esc(d)}</small></div>`).join('');
  }
  function setupSlideshow(photos) {
    let current=0;
    const img=document.createElement('img');img.className='hero-photo';img.alt=photos[0].caption||'ภาพกิจกรรมโรงเรียน';
    $('#hero').prepend(img);$('#hero').classList.add('has-photo');img.src=imageUrl(photos[0].photo);
    if(photos.length<2)return;
    const controls=$('#hero-controls');controls.hidden=false;
    const update=()=>{img.src=imageUrl(photos[current].photo);img.alt=photos[current].caption||'ภาพกิจกรรมโรงเรียน';$('#slide-count').textContent=`${String(current+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;};
    controls.innerHTML=`<button aria-label="ภาพก่อนหน้า" id="prev-slide">${icon('chevron-left')}</button><span class="slide-counter" id="slide-count"></span><button aria-label="ภาพถัดไป" id="next-slide">${icon('chevron-right')}</button>`;
    $('#prev-slide').onclick=()=>{current=(current-1+photos.length)%photos.length;update();};
    $('#next-slide').onclick=()=>{current=(current+1)%photos.length;update();};
    update();
    let startX=0;$('#hero').addEventListener('touchstart',e=>{startX=e.changedTouches[0].clientX;},{passive:true});
    $('#hero').addEventListener('touchend',e=>{const delta=e.changedTouches[0].clientX-startX;if(Math.abs(delta)>60){current=(current+(delta<0?1:-1)+photos.length)%photos.length;update();}},{passive:true});
  }
  async function publicPage(key,version) {
    const title=LABELS[key]||'ประกาศ/ข่าวสาร';
    main.innerHTML=heading(title)+`<div class="container page-body"><div class="page-tools">${editButton(key)}</div><div id="page-content"><div class="skeleton"></div></div></div>`;
    icons();
    let html='';
    if(key==='mony') html=empty('งบประมาณ: รอพัฒนา','ข้อมูลส่วนงบประมาณอยู่ระหว่างการพัฒนา กรุณาติดตามการปรับปรุงในภายหลัง','hard-hat');
    else if(['significance','hoop','anthority'].includes(key)) {
      const rows=await readRows(key);
      html=rows.length?rows.map(r=>`<article class="paper"><h2>${esc(r.title)}</h2><div class="rich-content">${sanitize(r.mag)}</div>${attachments(r.url)}</article>`).join(''):empty();
    } else if(key==='membernacc') {
      const {year,rows}=await latest('mamberNACC');
      html=rows.length?`<div class="page-tools"><span class="badge">ปีการศึกษา ${year} • ${number(rows.length)} คน</span></div><div class="org-chart">${POSITIONS.map(p=>{
        const people=rows.filter(r=>r.position===p);
        return people.length?`<div class="org-level" aria-label="${esc(p)}">${people.map(r=>`<article class="member-card">${r.photo?`<img src="${esc(imageUrl(r.photo))}" alt="${esc(r.name)}" loading="lazy">`:`<div class="member-placeholder">${icon('user-round')}</div>`}<div class="member-text"><h3>${esc(r.name)}</h3><p>${esc(r.class)}</p><p class="position">${esc(r.position)}</p></div></article>`).join('')}</div>`:'';
      }).join('')}</div>`:empty('ยังไม่มีรายชื่อคณะกรรมการ','ระบบจะแสดงเฉพาะบุคลากรในปีการศึกษาล่าสุดที่มีข้อมูล','users-round');
    } else if(key==='anacc') {
      const {year,rows}=await latest('ANACC');
      html=rows.length?`<div class="page-tools"><span class="badge">ปีการศึกษา ${year} • ${number(rows.length)} คน</span><input class="search-input" id="delegate-search" aria-label="ค้นหารายชื่อหรือห้องเรียน" placeholder="ค้นหาชื่อ รหัสนักเรียน หรือห้องเรียน"></div><div class="table-wrap"><table><thead><tr><th>ลำดับ</th><th>รหัสนักเรียน</th><th>ชื่อ - สกุล</th><th>ระดับชั้น</th></tr></thead><tbody id="delegate-rows">${delegateRows(rows)}</tbody></table></div>`:empty('ยังไม่มีรายชื่อตัวแทนห้อง','ระบบจะแสดงรายชื่ออนุกรรมการในปีการศึกษาล่าสุด','users-round');
      if(version!==routeVersion)return;
      $('#page-content').innerHTML=html;
      if($('#delegate-search')) $('#delegate-search').oninput=e=>{$('#delegate-rows').innerHTML=delegateRows(rows.filter(r=>`${r.name} ${r.roll} ${r.class}`.includes(e.target.value)));};
      icons();return;
    } else if(NEWS_TYPES[key] || key==='news') {
      const rows=await readRows('new',NEWS_TYPES[key]?{type:NEWS_TYPES[key]}:{},'timestamp',false);
      html=`${key==='news'?`<div class="news-filters">${newsFilters()}</div>`:''}<div class="news-grid" id="news-results">${rows.length?rows.map(newsCard).join(''):empty('ยังไม่มีข่าวสารที่เผยแพร่','ข่าวสารใหม่ในหมวดนี้จะแสดงเมื่อเจ้าหน้าที่บันทึกข้อมูล','newspaper')}</div>`;
      if(version!==routeVersion)return;
      $('#page-content').innerHTML=html;if(key==='news')wireNewsFilters(rows);icons();return;
    } else if(key==='certificate' || key==='award') {
      const rows=await readRows('Certificate',{kind:key==='award'?'award':'certificate'},key==='award'?'วันที่ได้รับ':'date',false);
      html=rows.length?rows.map(r=>key==='award'?`<article class="paper">${gallery(r['รูปกิจกรรม'])}<span class="badge">${esc(r['ระดับรางวัล'])} • ${esc(r['ประเภทสิทธิ์เหรียญรางวัล'])}</span><h2>${esc(r['ชื่อผลงาน'])}</h2><p>ประเภทเหรียญรางวัล: ${esc(r['ประเภทเหรียญรางวัล'])}</p><p>หน่วยงานที่รับผิดชอบ: ${esc(r['หน่วยงานที่รับผิดชอบ'])}</p><p>วันที่ได้รับ: ${esc(fmt(r['วันที่ได้รับ'],false))}</p><p>ผู้ที่ได้รับรางวัล: ${esc((r['ผู้ที่ได้รับรางวัล']||[]).join(', '))}</p><p>ครูที่ปรึกษา: ${esc((r['ครูที่ปรึกษา']||[]).join(', '))}</p></article>`:`<article class="paper"><span class="badge">${esc(r.Award)}</span><h2>${esc(r.name)}</h2><p>หน่วยงานที่มอบ: ${esc(r.from)}</p><p>วันที่ได้รับ: ${esc(fmt(r.date,false))}</p>${attachments(r.url)}</article>`).join(''):empty();
    } else if(key==='plan') {
      const rows=await readRows('plan');
      html=rows.length?rows.map(r=>`<article class="paper"><h2>${esc(r.name)}</h2><div class="timeline">${[['ร่าง',r['ร่าง']],['เสนอ',r['เสนอ']==='ผ่าน'],['ดำเนินการ',r['ดำเนินการ']],['แล้วเสร็จ',r['แล้วเสร็จ']]].map(([t,b])=>`<span class="timeline-step${b?' done':''}${t==='เสนอ'&&r['เสนอ']==='ไม่ผ่าน'?' rejected':''}">${esc(t)}${t==='เสนอ'?` (${esc(r['เสนอ'])})`:''}</span>`).join('')}</div><p>ผู้รับผิดชอบ: ${esc(r['ผู้รับผิดชอบ'])}</p><p class="hint">ผู้บันทึก: ${esc(r.regisname)}</p>${attachments(r.url)}</article>`).join(''):empty();
    } else if(['culecculum','tammanun','law'].includes(key)) {
      const rows=await readRows(key);
      html=rows.length?rows.map(r=>`<article class="paper"><h2>${esc(r.name)}</h2><p class="hint">ผู้บันทึก: ${esc(r.regisname)}</p>${attachments(r.url)}</article>`).join(''):empty();
    } else html=empty('ไม่พบหน้าที่ต้องการ','กลับสู่หน้าหลักเพื่อเลือกเมนูใหม่','search');
    if(version!==routeVersion)return;
    $('#page-content').innerHTML=html;icons();
  }
  function delegateRows(rows) { return rows.length?rows.map(r=>`<tr><td>${number(r.no)}</td><td>${esc(r.roll)}</td><td>${esc(r.name)}</td><td>${esc(r.class)}</td></tr>`).join(''):'<tr><td colspan="4">ไม่พบรายชื่อที่ค้นหา</td></tr>'; }
  function gallery(v) {
    const files=normalizeFiles(v);
    return files.length?`<div class="gallery" tabindex="0" role="region" aria-label="ภาพกิจกรรม เลื่อนซ้ายขวาเพื่อดูภาพ">${files.map(f=>`<img src="${esc(imageUrl(f.url))}" alt="${esc(f.name||'ภาพกิจกรรม')}" loading="lazy">`).join('')}</div>${files.length>1?'<p class="hint">เลื่อนภาพซ้ายหรือขวาเพื่อดูภาพกิจกรรมทั้งหมด</p>':''}`:'';
  }
  async function article(id,version) {
    if(!db){main.innerHTML=heading('ข่าวสาร')+`<div class="container page-body">${empty()}</div>`;icons();return;}
    const {data:n,error}=await db.from('new').select('*').eq('id',id).single();
    if(error)throw error;if(version!==routeVersion)return;
    main.innerHTML=heading(n.name,n.type)+`<div class="container page-body"><article class="paper"><div class="news-meta"><span>ผู้บันทึก: ${esc(n.regisname)}</span><span>${esc(fmt(n.timestamp))}</span><span>ลำดับ ${number(n.no)}</span></div><div class="rich-content">${sanitize(n.mag)}</div>${attachments(n.url)}</article><a class="text-link" href="#/news">${icon('arrow-left')} กลับสู่ข่าวสารทั้งหมด</a></div>`;
    icons();
  }
  async function getProfile() {
    const {data:{user},error}=await db.auth.getUser();
    if(error || !user) {profile=null;authUser=null;return;}
    const {data:p,error:e}=await db.from('admin').select('*').eq('id',user.id).eq('active',true).maybeSingle();
    if(e)throw e;
    profile=p;authUser=user;
    $('#staff-label').textContent=profile?profile.name:'สำหรับเจ้าหน้าที่';
    $('.staff-link').href=profile?'#/admin':'#/login';
  }
  function login() {
    if(profile){location.hash='/admin';return;}
    main.innerHTML=`<div class="container"><section class="auth-container"><img class="auth-mark" src="./assets/logo.png" alt="ตรา ป.ป.ช.สพฐ.น้อย"><h1>เข้าสู่ระบบเจ้าหน้าที่</h1><p>ระบบจัดการข้อมูล ป.ป.ช.สพฐ.น้อย<br>โรงเรียนภูเขียว</p>${!db?'<div class="status-box">ระบบยังไม่เชื่อมต่อ Supabase<br>กรุณาตั้งค่าตามคู่มือ README ก่อนเข้าสู่ระบบ</div>':''}<form id="login-form"><div class="field"><label for="username">Username</label><input id="username" name="username" required autocomplete="username" pattern="[a-z0-9._-]{3,50}" placeholder="ชื่อผู้ใช้ที่ได้รับจากผู้ดูแล"></div><div class="field"><label for="password">Password</label><input id="password" name="password" type="password" required autocomplete="current-password"></div><button class="btn" type="submit" style="width:100%" ${!db?'disabled':''}>${icon('log-in')} เข้าสู่ระบบ</button><div id="login-feedback" role="alert"></div></form><p class="hint">สำหรับบัญชี admin และ nacc เท่านั้น<br>หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลระบบ</p><a href="#/" class="text-link">${icon('arrow-left')} กลับสู่หน้าหลัก</a></section></div>`;
    $('#login-form').onsubmit=async e=>{
      e.preventDefault();if(!db)return;const b=$('button[type=submit]',e.target);b.disabled=true;
      const username=$('#username').value.trim().toLowerCase();
      try {
        const {error}=await db.auth.signInWithPassword({email:`${username}@${C.authEmailDomain}`,password:$('#password').value});
        if(error)throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง หรือบัญชีถูกระงับ');
        await getProfile();
        if(!profile){await db.auth.signOut();throw new Error('บัญชีนี้ยังไม่ได้รับสิทธิ์เจ้าหน้าที่ กรุณาติดต่อผู้ดูแล');}
        $('#password').value='';location.hash='/admin';
      }catch(err){$('#login-feedback').className='form-error';$('#login-feedback').textContent=err.message;}
      finally{b.disabled=false;}
    };icons();
  }
  // A single declarative field model keeps all public pages and staff forms consistent.
  const field=(key,label,type='text',extra={})=>({key,label,type,...extra});
  const file=(key,label,max=1,accept='application/pdf',min=0)=>field(key,label,'files',{max,accept,min});
  const textPages=['significance','hoop','anthority'];
  const byKey = {
    Home:{table:'Home',label:'ภาพสไลด์หน้าแรก',fields:[field('photo','ภาพพื้นหลัง','photo',{required:true}),field('caption','คำอธิบายภาพ'),field('sort_order','ลำดับแสดง','number',{value:0})]},
    newstat:{table:'newstat',label:'ประกาศตามช่วงเวลา',fields:[field('name','ชื่อประกาศ','text',{required:true}),field('photo','ภาพประกาศ','photo',{required:true}),field('url','ลิงก์ปลายทาง (URL หรือชื่อเมนู)'),field('start_at','เริ่มแสดง (เวลาไทย)','datetime-local',{required:true}),field('end_at','สิ้นสุด (เวลาไทย)','datetime-local',{required:true})]},
    botton:{table:'botton',label:'ปุ่มลัดหน้าแรก',fields:[field('meg','ข้อความปุ่ม','text',{required:true}),field('photo','ภาพไอคอน','photo'),field('url','URL หรือชื่อเมนู เช่น คำสั่ง','text',{required:true}),field('sort_order','ลำดับแสดง','number',{value:0})]},
    membernacc:{table:'mamberNACC',label:LABELS.membernacc,fields:[field('year','ปีการศึกษา (พ.ศ.)','number',{required:true,min:2400,max:3000,value:new Date().getFullYear()+543}),field('photo','ภาพบุคลากร','photo'),field('name','ชื่อ - สกุล','text',{required:true}),field('class','ระดับชั้น','class'),field('position','ตำแหน่ง','select',{options:POSITIONS,required:true})]},
    anacc:{table:'ANACC',label:LABELS.anacc,fields:[field('year','ปีการศึกษา (พ.ศ.)','number',{required:true,min:2400,max:3000,value:new Date().getFullYear()+543}),field('no','ลำดับ','readonly',{value:'กำหนดอัตโนมัติเมื่อบันทึก'}),field('roll','รหัสนักเรียน 5 หลัก','text',{required:true,pattern:'[0-9]{5}',maxLength:5}),field('name','ชื่อ - สกุล','text',{required:true}),field('class','ระดับชั้น','class',{required:true})]},
    certificate:{table:'Certificate',label:LABELS.certificate,filter:{kind:'certificate'},fields:[field('date','วันที่ได้รับ','date',{required:true}),field('name','ชื่อเกียรติบัตร','text',{required:true}),field('from','หน่วยงานที่มอบ','text',{required:true}),field('Award','ระดับเกียรติบัตร','select',{options:MEDALS}),file('url','ไฟล์เกียรติบัตร PDF (1–5 ไฟล์)',5,'application/pdf',1)]},
    award:{table:'Certificate',label:LABELS.award,filter:{kind:'award'},fields:[file('รูปกิจกรรม','ภาพกิจกรรม (1–5 ภาพ)',5,'image/jpeg,image/png,image/webp,image/gif',1),field('ระดับรางวัล','ระดับรางวัล','select',{options:['นานาชาติ','ประเทศ','ภาค','จังหวัด','อำเภอ','เขต','โรงเรียน']}),field('ประเภทสิทธิ์เหรียญรางวัล','ประเภทสิทธิ์เหรียญรางวัล','select',{options:MEDALS}),field('ประเภทเหรียญรางวัล','ประเภทเหรียญรางวัล'),field('ชื่อผลงาน','ชื่อผลงาน','text',{required:true}),field('หน่วยงานที่รับผิดชอบ','หน่วยงานที่รับผิดชอบ'),field('วันที่ได้รับ','วันที่ได้รับ','date',{required:true}),field('ผู้ที่ได้รับรางวัล','ผู้ที่ได้รับรางวัล','repeat'),field('ครูที่ปรึกษา','ครูที่ปรึกษา','repeat')]},
    plan:{table:'plan',label:LABELS.plan,fields:[field('name','ชื่อโครงการ / นโยบาย','text',{required:true}),field('ร่าง','ร่าง','checkbox'),field('เสนอ','ผลการเสนอ','select',{options:['รอพิจารณา','ผ่าน','ไม่ผ่าน']}),field('ดำเนินการ','ดำเนินการ','checkbox'),field('แล้วเสร็จ','แล้วเสร็จ','checkbox'),field('ผู้รับผิดชอบ','ผู้รับผิดชอบ','text',{required:true}),field('regisname','ผู้บันทึก','readonly'),file('url','ไฟล์โครงการ PDF (1 ไฟล์)',1,'application/pdf',1)]},
  };
  textPages.forEach(k=>byKey[k]={table:k,label:LABELS[k],fields:[field('title','หัวข้อ','text',{required:true}),field('mag','เนื้อหา','rich'),file('url','ภาพหรือ PDF แนบ (สูงสุด 100 ไฟล์)',100,'application/pdf,image/jpeg,image/png,image/webp,image/gif')]});
  Object.entries(NEWS_TYPES).forEach(([k,t])=>byKey[k]={table:'new',label:t,filter:{type:t},fields:[field('no','ลำดับ','readonly',{value:'กำหนดอัตโนมัติเมื่อบันทึก'}),field('name',k==='make'?'เลขที่คำสั่ง / ชื่อเรื่อง':k==='newsletter'?'เลขที่จดหมายข่าว / ชื่อเรื่อง':'ชื่อเรื่อง','text',{required:true}),field('type','ประเภท','readonly',{value:t}),field('mag','เนื้อหาเพิ่มเติม','rich'),file('url','ภาพหรือ PDF (1–100 ไฟล์)',100,'application/pdf,image/jpeg,image/png,image/webp,image/gif'),field('regisname','ชื่อผู้บันทึก','readonly'),field('timestamp','วัน - เวลาบันทึก','readonly',{value:'บันทึกเวลาไทยอัตโนมัติจากเซิร์ฟเวอร์'})]});
  ['culecculum','tammanun','law'].forEach(k=>byKey[k]={table:k,label:LABELS[k],fields:[field('name','เรื่อง','text',{required:true}),file('url','ไฟล์ PDF (1 ไฟล์)',1,'application/pdf',1),field('regisname','ผู้บันทึก','readonly')]});

  function adminMenu(key) {
    const group=(name,items)=>`<h3>${esc(name)}</h3>${items.map(([k,v])=>`<a href="#/admin/${k}" class="${k===key?'active':''}">${esc(v)}</a>`).join('')}`;
    return group('หน้าแรก',[['Home','ภาพสไลด์'],['newstat','ประกาศตามช่วงเวลา'],['botton','ปุ่มลัด']])+
      GROUPS.map(([name,items])=>group(name,items)).join('')+
      group('บัญชีผู้ใช้',[['account','เปลี่ยนรหัสผ่านของฉัน'],...(profile.role==='admin'?[['users','จัดการผู้ใช้ / รหัสผ่าน']]:[])]);
  }
  async function adminPage(key='Home',version) {
    if(!profile){location.hash='/login';return;}
    if(!key)key='Home';
    main.innerHTML=heading('ระบบจัดการข้อมูล','สำหรับเจ้าหน้าที่ ป.ป.ช.สพฐ.น้อย โรงเรียนภูเขียว')+`<div class="container page-body"><div class="user-summary"><span>${icon('shield-check')}</span><span>${esc(profile.name)} <small>(${esc(profile.role)})</small></span><button class="btn small" id="logout">${icon('log-out')} ออกจากระบบ</button></div><div class="admin-shell"><aside class="admin-sidebar" aria-label="เมนูจัดการข้อมูล">${adminMenu(key)}</aside><section class="admin-main" id="admin-content"></section></div></div>`;
    $('#logout').onclick=async()=>{await db.auth.signOut();profile=null;authUser=null;$('#staff-label').textContent='สำหรับเจ้าหน้าที่';$('.staff-link').href='#/login';location.hash='/';};
    if(key==='users'){await usersPage();icons();return;}
    if(key==='account'){accountPage();icons();return;}
    if(key==='mony'){$('#admin-content').innerHTML=empty('งบประมาณ: รอพัฒนา','ส่วนนี้ยังไม่เปิดใช้งานตามขอบเขตที่กำหนด','hard-hat');icons();return;}
    const schema=byKey[key];
    if(!schema){$('#admin-content').innerHTML=empty('ไม่พบเมนูจัดการข้อมูล');icons();return;}
    $('#admin-content').innerHTML=`<div class="section-heading"><div><h2>${esc(schema.label)}</h2><p class="hint">เพิ่มหรือแก้ไขข้อมูลที่เผยแพร่บนเว็บไซต์</p></div><button class="btn" id="add-record">${icon('plus')} เพิ่มข้อมูล</button></div>${key==='anacc'?`<div class="paper"><h3>นำเข้าตัวแทนห้องจาก CSV</h3><p class="hint">คอลัมน์ year, roll, name, class • UTF-8 • ตรวจสอบทุกแถวก่อนบันทึก</p><a class="text-link" href="./assets/ANACC-template.csv" download>ดาวน์โหลดไฟล์ตัวอย่าง CSV ${icon('download')}</a><input id="csv-input" type="file" accept=".csv,text/csv" aria-label="นำเข้า CSV ตัวแทนห้อง"><div id="csv-feedback" role="status"></div></div>`:''}<div class="page-tools"><input id="admin-search" class="search-input" placeholder="ค้นหาข้อมูล..." aria-label="ค้นหาข้อมูลในรายการ"><span class="hint" id="record-count"></span></div><div id="record-list"><div class="skeleton"></div></div><div id="admin-feedback" role="alert"></div>`;
    $('#add-record').onclick=()=>recordForm(key,null,()=>adminPage(key,routeVersion));
    let rows=await readRows(schema.table,schema.filter||{},schema.table==='new'?'timestamp':'id',schema.table!=='new');
    if(version!==routeVersion)return;
    const draw=()=>{
      const query=$('#admin-search').value.toLowerCase();
      const filtered=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(query));
      $('#record-count').textContent=`${number(filtered.length)} / ${number(rows.length)} รายการ`;
      $('#record-list').innerHTML=filtered.length?`<div class="table-wrap"><table><thead><tr><th>ชื่อ / หัวข้อ</th><th>รายละเอียด</th><th>จัดการ</th></tr></thead><tbody>${filtered.map(r=>`<tr><td>${esc(r.name||r.title||r.meg||r['ชื่อผลงาน']||r.caption||'ภาพสไลด์')}</td><td>${esc(r.year?`ปี ${r.year} ${r.class||''}`:r.type||r['เสนอ']||r.start_at&&fmt(r.start_at)||'เผยแพร่')}</td><td><button class="btn secondary small" data-edit="${esc(r.id)}">${icon('pencil')} แก้ไข</button></td></tr>`).join('')}</tbody></table></div>`:empty('ยังไม่มีข้อมูลในรายการ','กด “เพิ่มข้อมูล” เพื่อเริ่มต้นเผยแพร่ข้อมูลส่วนนี้');
      $$('[data-edit]').forEach(b=>b.onclick=()=>recordForm(key,rows.find(r=>r.id===b.dataset.edit),()=>adminPage(key,routeVersion)));icons();
    };
    $('#admin-search').oninput=draw;draw();
    if(key==='anacc')$('#csv-input').onchange=e=>importCSV(e.target.files[0],()=>adminPage(key,routeVersion));
    icons();
  }
  function modal(title,html) { $('#modal-title').textContent=title;$('#modal-body').innerHTML=html;if(!$('#modal').open)$('#modal').showModal();icons(); }
  function localThaiInput(v) {
    if(!v)return '';
    const d=new Date(v);
    const thai=new Date(d.getTime()+7*60*60*1000);
    return thai.toISOString().slice(0,16);
  }
  function inputMarkup(f,record) {
    let value=record?.[f.key] ?? (f.key==='regisname'?profile.name:f.value??'');
    if(f.type==='readonly'&&f.key==='timestamp'&&record?.timestamp)value=fmt(record.timestamp);
    const id=`f-${f.key}`, common=`id="${esc(id)}" name="${esc(f.key)}" ${f.required?'required':''}`;
    const label=`<label for="${esc(id)}">${esc(f.label)}${f.required?' <span aria-hidden="true">*</span>':''}</label>`;
    const full=['rich','files','repeat'].includes(f.type)?' full':'';
    let html='';
    if(f.type==='rich') html=`${label}<div class="editor-toolbar" role="toolbar" aria-label="จัดรูปแบบข้อความ">${[['bold','ตัวหนา','bold'],['italic','ตัวเอียง','italic'],['underline','ขีดเส้นใต้','underline'],['justifyLeft','ชิดซ้าย','align-left'],['justifyCenter','กึ่งกลาง','align-center'],['justifyRight','ชิดขวา','align-right'],['insertUnorderedList','รายการ','list'],['undo','เลิกทำ','undo']].map(([cmd,t,ico])=>`<button type="button" data-cmd="${cmd}" aria-label="${t}" title="${t}">${icon(ico)}</button>`).join('')}<input type="color" id="editor-color" aria-label="สีข้อความ" title="สีข้อความ" value="#432561"></div><div class="editor" ${common} contenteditable="true" role="textbox" aria-multiline="true" aria-label="${esc(f.label)}">${sanitize(value)}</div>`;
    else if(f.type==='files') html=`${label}<div data-current-files="${esc(f.key)}"></div><input ${common} type="file" accept="${f.accept}" ${f.max>1?'multiple':''}><p class="hint">สูงสุด ${f.max} ไฟล์ รวมกับไฟล์เดิม • ไฟล์ละไม่เกิน 20 MB • PDF / รูปภาพตามชนิดที่กำหนด</p>`;
    else if(f.type==='photo') html=`${label}<input ${common} type="url" value="${esc(value)}" placeholder="https://... หรืออัปโหลดภาพด้านล่าง" ${f.required?'data-photo-required="true"':''}><input id="${esc(id)}-upload" data-photo-for="${esc(f.key)}" type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label="อัปโหลด ${esc(f.label)}"><p class="hint">ภาพ JPG, PNG, WEBP หรือ GIF ไม่เกิน 20 MB</p>`;
    else if(f.type==='select') html=`${label}<select ${common}>${f.options.map(v=>`<option value="${esc(v)}"${v===value?' selected':''}>${esc(v)}</option>`).join('')}</select>`;
    else if(f.type==='checkbox') html=`<label class="check-label"><input ${common} type="checkbox" ${value===true?'checked':''}> ${esc(f.label)}</label>`;
    else if(f.type==='repeat') html=`<span class="field-label">${esc(f.label)}</span><div id="${esc(id)}" data-repeat="${esc(f.key)}">${(Array.isArray(value)&&value.length?value:['']).map(v=>repeatRow(v)).join('')}</div><button class="btn secondary small" type="button" data-add-name="${esc(f.key)}">${icon('plus')} เพิ่มรายชื่อ</button>`;
    else if(f.type==='class') {
      const nums=String(value).match(/(\d+)\s*\/\s*(\d+)/);
      html=`<span class="field-label">${esc(f.label)}</span><div style="display:flex;gap:8px;align-items:center"><span style="font-size:var(--text-xs)">มัธยมศึกษาปีที่</span><input id="${id}-grade" type="number" min="1" max="6" value="${nums?.[1]||''}" placeholder="1–6" ${f.required?'required':''} aria-label="ชั้นมัธยมศึกษาปีที่"><span>/</span><input id="${id}-room" type="number" min="1" max="99" value="${nums?.[2]||''}" placeholder="ห้อง" ${f.required?'required':''} aria-label="ห้องเรียน"></div>`;
    } else if(f.type==='date') html=`${label}<input ${common} type="hidden" value="${esc(value)}"><div class="thai-calendar" data-calendar="${esc(id)}"></div><p class="hint" data-date-hint>${value?esc(fmt(value,false)):'เลือกวันที่จากปฏิทินภาษาไทย (พ.ศ.)'}</p>`;
    else html=`${label}<input ${common} type="${f.type==='readonly'?'text':f.type}" ${f.type==='readonly'?'readonly':''} value="${esc(f.type==='datetime-local'?localThaiInput(value):value)}" ${f.pattern?`pattern="${f.pattern}"`:''} ${f.maxLength?`maxlength="${f.maxLength}"`:''} ${f.min!=null?`min="${f.min}"`:''} ${f.max!=null?`max="${f.max}"`:''}>`;
    return `<div class="field${full}">${html}</div>`;
  }
  function repeatRow(v='') { return `<div class="repeat-row"><input aria-label="ชื่อ - สกุล" value="${esc(v)}" placeholder="ชื่อ - สกุล"><button type="button" class="icon-button" data-remove-name aria-label="ลบช่องรายชื่อ">${icon('x')}</button></div>`; }
  function recordForm(key,record,onDone) {
    const schema=byKey[key], currentFiles={};
    schema.fields.filter(f=>f.type==='files').forEach(f=>currentFiles[f.key]=normalizeFiles(record?.[f.key]));
    modal(`${record?'แก้ไข':'เพิ่ม'}: ${schema.label}`,`<form id="record-form"><div class="form-grid">${schema.fields.map(f=>inputMarkup(f,record)).join('')}</div><div id="record-feedback" role="alert"></div><div class="form-actions"><button type="button" class="btn secondary" id="cancel-edit">ยกเลิก</button><button class="btn" type="submit" id="save-record">${icon('save')} บันทึกข้อมูล</button></div></form>`);
    const form=$('#record-form');$('#cancel-edit').onclick=()=>$('#modal').close();
    function drawFiles() {
      $$('[data-current-files]',form).forEach(el=>{
        const k=el.dataset.currentFiles;
        el.innerHTML=currentFiles[k].map((f,i)=>`<div class="current-file"><span>${esc(f.name||f.url)}</span><button type="button" data-remove-file="${esc(k)}" data-index="${i}" aria-label="นำไฟล์นี้ออกจากรายการ">${icon('x')}</button></div>`).join('');
      });icons();
    }
    drawFiles();
    $$('[data-calendar]',form).forEach(el=>thaiCalendar(el,$(`#${el.dataset.calendar}`,form)));
    form.addEventListener('click',e=>{
      const remove=e.target.closest('[data-remove-file]');
      if(remove){currentFiles[remove.dataset.removeFile].splice(Number(remove.dataset.index),1);drawFiles();}
      const add=e.target.closest('[data-add-name]');if(add){$(`[data-repeat="${add.dataset.addName}"]`,form).insertAdjacentHTML('beforeend',repeatRow());icons();}
      const rem=e.target.closest('[data-remove-name]');if(rem)rem.closest('.repeat-row').remove();
    });
    $$('[data-photo-for]',form).forEach(input=>input.onchange=()=>{const target=$(`#f-${input.dataset.photoFor}`,form);target.required=target.dataset.photoRequired==='true'&&!input.files.length;});
    $$('input[type=date]',form).forEach(input=>input.onchange=()=>{const hint=$('[data-date-hint]',input.closest('.field'));if(hint)hint.textContent=fmt(input.value,false);});
    $$('[data-cmd]',form).forEach(b=>b.onmousedown=e=>{e.preventDefault();document.execCommand(b.dataset.cmd,false,null);});
    if($('#editor-color',form))$('#editor-color',form).oninput=e=>{document.execCommand('foreColor',false,e.target.value);};
    if(key==='plan') {
      const updatePlan=()=>{const pass=$('#f-เสนอ',form).value==='ผ่าน';['ดำเนินการ','แล้วเสร็จ'].forEach(k=>{const el=$(`#f-${k}`,form);el.disabled=!pass;if(!pass)el.checked=false;});if(!$('#f-ดำเนินการ',form).checked)$('#f-แล้วเสร็จ',form).checked=false;$('#f-แล้วเสร็จ',form).disabled=!pass||!$('#f-ดำเนินการ',form).checked;};
      $('#f-เสนอ',form).onchange=updatePlan;$('#f-ดำเนินการ',form).onchange=updatePlan;updatePlan();
    }
    form.onsubmit=async e=>{
      e.preventDefault();const b=$('#save-record');b.disabled=true;$('#record-feedback').className='status-box';$('#record-feedback').textContent='กำลังตรวจสอบข้อมูลและอัปโหลดไฟล์ กรุณาอย่าปิดหน้าต่าง...';
      const uploaded=[];
      try {
        const payload={...(schema.filter||{})};
        // Preflight every attachment before performing any write.
        for(const f of schema.fields) {
          if(f.type==='date'&&f.required&&!$(`#f-${f.key}`,form).value)throw new Error(`กรุณาเลือก ${f.label}`);
          if(f.type==='files') {
            const selected=[...$(`#f-${f.key}`,form).files];
            if(currentFiles[f.key].length+selected.length>f.max)throw new Error(`${f.label}: เลือกได้สูงสุด ${f.max} ไฟล์รวมไฟล์เดิม`);
            if(currentFiles[f.key].length+selected.length < (f.min||0))throw new Error(`${f.label}: ต้องมีไฟล์อย่างน้อย ${f.min} ไฟล์ (นับรวมไฟล์เดิมที่เหลืออยู่)`);
            selected.forEach(x=>validateFile(x,f.accept));
          }
          if(f.type==='photo') {
            const selected=$(`#f-${f.key}-upload`,form).files[0];
            if(selected)validateFile(selected,'image/jpeg,image/png,image/webp,image/gif');
          }
        }
        for(const f of schema.fields) {
          const input=$(`#f-${f.key}`,form);
          if(f.type==='readonly')continue;
          if(f.type==='files') {
            const selected=[...input.files], added=[];
            for(const x of selected) {$('#record-feedback').textContent=`กำลังอัปโหลด ${x.name} ...`;const result=await uploadFile(x);added.push(result);uploaded.push(result);}
            payload[f.key]=[...currentFiles[f.key],...added];
          } else if(f.type==='photo') {
            const selected=$(`#f-${f.key}-upload`,form).files[0];
            if(selected){const result=await uploadFile(selected);uploaded.push(result);payload[f.key]=result.url;}
            else payload[f.key]=input.value.trim();
          } else if(f.type==='repeat') payload[f.key]=$$('input',input).map(x=>x.value.trim()).filter(Boolean);
          else if(f.type==='rich') payload[f.key]=sanitize(input.innerHTML);
          else if(f.type==='checkbox') payload[f.key]=input.checked;
          else if(f.type==='number') payload[f.key]=Number(input.value);
          else if(f.type==='class') {
            const g=$(`#f-${f.key}-grade`,form).value,r=$(`#f-${f.key}-room`,form).value;
            if((g&&!r)||(!g&&r))throw new Error('กรุณากรอกทั้งระดับชั้นและห้องเรียน หรือเว้นว่างทั้งคู่');
            payload[f.key]=g&&r?`${key==='anacc'?'ชั้น':''}มัธยมศึกษาปีที่ ${g}/${r}`:'';
          } else if(f.type==='datetime-local')payload[f.key]=new Date(`${input.value}:00+07:00`).toISOString();
          else payload[f.key]=input.value.trim();
        }
        if(key==='newstat'&&new Date(payload.end_at)<new Date(payload.start_at))throw new Error('วันสิ้นสุดต้องไม่อยู่ก่อนวันเริ่มแสดง');
        if(key==='plan'&&payload['เสนอ']!=='ผ่าน'){payload['ดำเนินการ']=false;payload['แล้วเสร็จ']=false;}
        const result=record?await db.from(schema.table).update(payload).eq('id',record.id).select('id'):await db.from(schema.table).insert(payload).select('id');
        if(result.error)throw result.error;
        if(!result.data?.length)throw new Error('ไม่พบรายการที่บันทึก หรือสิทธิ์ไม่เพียงพอ');
        $('#modal').close();toast('บันทึกข้อมูลสำเร็จ');await onDone();
      } catch(err) {
        if($('#record-feedback')){
          $('#record-feedback').className='form-error';
          $('#record-feedback').textContent=errorMessage(err)+(uploaded.length?` มีไฟล์อัปโหลดแล้ว ${uploaded.length} ไฟล์ แต่ยังไม่ผูกกับข้อมูล กรุณาตรวจสอบ Storage ก่อนลองใหม่`:'');
        } else toast(errorMessage(err));
      } finally{b.disabled=false;}
    };
  }
  function validateFile(f,accept) {
    if(f.size>20*1024*1024)throw new Error(`ไฟล์ ${f.name} เกิน 20 MB`);
    if(!accept.split(',').includes(f.type))throw new Error(`ชนิดไฟล์ ${f.name} ไม่ได้รับอนุญาต กรุณาใช้ PDF หรือรูปภาพที่ระบุ`);
    if(f.size===0)throw new Error(`ไฟล์ ${f.name} ว่างเปล่า`);
  }
  function thaiCalendar(el,input) {
    const months=['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
    const selected=input.value?new Date(`${input.value}T12:00:00`):new Date();
    let year=selected.getFullYear(),month=selected.getMonth();
    function draw() {
      const first=new Date(year,month,1).getDay(),days=new Date(year,month+1,0).getDate();
      el.innerHTML=`<div class="calendar-head"><button type="button" class="icon-button" data-prev-month aria-label="เดือนก่อนหน้า">${icon('chevron-left')}</button><select data-month aria-label="เดือน">${months.map((m,i)=>`<option value="${i}"${i===month?' selected':''}>${m}</option>`).join('')}</select><input type="number" data-year value="${year+543}" min="2400" max="3000" aria-label="ปี พ.ศ."><button type="button" class="icon-button" data-next-month aria-label="เดือนถัดไป">${icon('chevron-right')}</button></div><div class="calendar-days">${['อา','จ','อ','พ','พฤ','ศ','ส'].map(d=>`<span>${d}</span>`).join('')}${'<span></span>'.repeat(first)}${Array.from({length:days},(_,i)=>{
        const val=`${year}-${String(month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`;
        return `<button type="button" data-date="${val}" class="${input.value===val?'selected':''}" aria-pressed="${input.value===val}" aria-label="${i+1} ${months[month]} ${year+543}">${i+1}</button>`;
      }).join('')}</div>`;
      $('[data-prev-month]',el).onclick=()=>{month--;if(month<0){month=11;year--;}draw();};
      $('[data-next-month]',el).onclick=()=>{month++;if(month>11){month=0;year++;}draw();};
      $('[data-month]',el).onchange=e=>{month=Number(e.target.value);draw();};
      $('[data-year]',el).onchange=e=>{if(e.target.checkValidity()){year=Number(e.target.value)-543;draw();}};
      $$('[data-date]',el).forEach(b=>b.onclick=()=>{input.value=b.dataset.date;$('[data-date-hint]',el.parentElement).textContent=fmt(input.value,false);draw();});
      icons();
    }
    draw();
  }
  async function uploadFile(f) {
    const ext={'application/pdf':'pdf','image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/gif':'gif'}[f.type];
    if(!ext)throw new Error('ไม่รองรับชนิดไฟล์นี้');
    const path=`${authUser.id}/${crypto.randomUUID()}.${ext}`;
    const {error}=await db.storage.from('public-files').upload(path,f,{contentType:f.type,upsert:false});
    if(error)throw error;
    const {data}=db.storage.from('public-files').getPublicUrl(path);
    return {url:data.publicUrl,name:f.name,type:f.type,path};
  }
  async function importCSV(f,onDone) {
    if(!f)return;
    const feedback=$('#csv-feedback');
    if(f.size>5*1024*1024){feedback.className='form-error';feedback.textContent='CSV ต้องไม่เกิน 5 MB';return;}
    const text=await f.text();
    const parsed=Papa.parse(text.replace(/^\uFEFF/,''),{header:true,skipEmptyLines:'greedy',transformHeader:h=>h.trim()});
    try {
      if(parsed.errors.length)throw new Error(`อ่าน CSV ไม่สำเร็จ: ${parsed.errors[0].message}`);
      if(!['year','roll','name','class'].every(k=>parsed.meta.fields.includes(k)))throw new Error('ต้องมีหัวคอลัมน์ year, roll, name, class');
      if(!parsed.data.length||parsed.data.length>5000)throw new Error('CSV ต้องมีข้อมูล 1–5,000 แถว');
      const seen=new Set();
      const rows=parsed.data.map((r,i)=>{
        const year=Number(r.year),roll=String(r.roll||'').trim(),name=String(r.name||'').trim(),raw=String(r.class||'').trim();
        const m=raw.match(/(?:^|ปีที่\s*)([1-6])\s*\/\s*(\d{1,2})$/);
        if(!Number.isInteger(year)||year<2400||year>3000||!/^\d{5}$/.test(roll)||!name||!m||Number(m[2])<1)throw new Error(`แถว ${i+2}: ตรวจสอบปี พ.ศ., รหัส 5 หลัก, ชื่อ และชั้นแบบ 5/1`);
        const unique=`${year}/${roll}`;if(seen.has(unique))throw new Error(`แถว ${i+2}: รหัสนักเรียนซ้ำในปีเดียวกัน`);seen.add(unique);
        return {year,roll,name,class:`ชั้นมัธยมศึกษาปีที่ ${m[1]}/${Number(m[2])}`};
      });
      const years=[...new Set(rows.map(r=>r.year))];
      modal('ตรวจสอบก่อนนำเข้า CSV',`<p>ข้อมูล ${number(rows.length)} แถว • ปีการศึกษา ${years.join(', ')}<br>ระบบจะรันลำดับอัตโนมัติและไม่แก้ไขข้อมูลเดิม</p><div class="table-wrap" style="margin-top:16px"><table><thead><tr><th>ปี</th><th>รหัส</th><th>ชื่อ</th><th>ชั้น</th></tr></thead><tbody>${rows.slice(0,10).map(r=>`<tr><td>${r.year}</td><td>${esc(r.roll)}</td><td>${esc(r.name)}</td><td>${esc(r.class)}</td></tr>`).join('')}</tbody></table></div><p class="hint">แสดงตัวอย่าง 10 แถวแรก • หากซ้ำกับฐานข้อมูล จะไม่บันทึกทั้งชุด</p><div id="import-feedback" role="alert"></div><div class="form-actions"><button id="cancel-import" class="btn secondary">ยกเลิก</button><button id="confirm-import" class="btn">ยืนยันนำเข้า ${number(rows.length)} รายการ</button></div>`);
      $('#cancel-import').onclick=()=>$('#modal').close();
      $('#confirm-import').onclick=async e=>{
        e.currentTarget.disabled=true;
        try {
          // One PostgREST statement: all rows commit or all rows roll back.
          const {error}=await db.from('ANACC').insert(rows);if(error)throw error;
          $('#modal').close();toast(`นำเข้าสำเร็จ ${rows.length} รายการ`);await onDone();
        }catch(err){$('#import-feedback').className='form-error';$('#import-feedback').textContent=errorMessage(err);if($('#confirm-import'))$('#confirm-import').disabled=false;}
      };
    }catch(err){feedback.className='form-error';feedback.textContent=errorMessage(err);}
  }
  function accountPage() {
    $('#admin-content').innerHTML=`<article class="paper"><h2>เปลี่ยนรหัสผ่านของฉัน</h2><p class="hint">บัญชี ${esc(profile.username)} • ใช้รหัสผ่านอย่างน้อย 12 ตัวอักษร</p><form id="password-form" style="margin-top:24px"><div class="field"><label for="current-password">รหัสผ่านปัจจุบัน</label><input id="current-password" type="password" required autocomplete="current-password"></div><div class="field"><label for="new-password">รหัสผ่านใหม่</label><input id="new-password" type="password" required minlength="12" autocomplete="new-password"></div><div class="field"><label for="confirm-password">ยืนยันรหัสผ่านใหม่</label><input id="confirm-password" type="password" required minlength="12" autocomplete="new-password"></div><button type="submit" class="btn">เปลี่ยนรหัสผ่าน</button><div id="password-feedback" role="alert"></div></form></article>`;
    $('#password-form').onsubmit=async e=>{
      e.preventDefault();const b=$('button',e.target);b.disabled=true;
      try {
        if($('#new-password').value!==$('#confirm-password').value)throw new Error('รหัสผ่านใหม่ไม่ตรงกัน');
        const {error:verify}=await db.auth.signInWithPassword({email:authUser.email,password:$('#current-password').value});if(verify)throw new Error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
        const {error}=await db.auth.updateUser({password:$('#new-password').value});if(error)throw error;
        e.target.reset();$('#password-feedback').className='form-success';$('#password-feedback').textContent='เปลี่ยนรหัสผ่านสำเร็จ';
      }catch(err){$('#password-feedback').className='form-error';$('#password-feedback').textContent=errorMessage(err);}finally{b.disabled=false;}
    };
  }
  async function usersPage() {
    if(profile.role!=='admin'){$('#admin-content').innerHTML=empty('สำหรับผู้ดูแลระบบเท่านั้น','บัญชี nacc ไม่มีสิทธิ์จัดการผู้ใช้','lock-keyhole');return;}
    const rows=await readRows('admin',{},'username');
    $('#admin-content').innerHTML=`<div class="section-heading"><h2>จัดการบัญชีผู้ใช้</h2><button id="add-user" class="btn">${icon('user-plus')} เพิ่มบัญชี</button></div><p class="status-box">รหัสผ่านเก็บใน Supabase Auth เท่านั้น ไม่สามารถเปิดดูรหัสเดิมได้ การเพิ่มบัญชีหรือรีเซ็ตรหัสผ่านต้องติดตั้ง Edge Function “manage-users” ตามคู่มือ</p><div class="table-wrap"><table><thead><tr><th>Username / ชื่อ</th><th>สิทธิ์</th><th>จัดการ</th></tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.username)}<br><span class="hint">${esc(r.name)}</span></td><td>${esc(r.role)}${!r.active?' (ระงับ)':''}</td><td><button class="btn secondary small" data-user-edit="${esc(r.id)}">แก้ไข / รีเซ็ตรหัส</button></td></tr>`).join('')}</tbody></table></div>`;
    $('#add-user').onclick=()=>userForm(null);
    $$('[data-user-edit]').forEach(b=>b.onclick=()=>userForm(rows.find(r=>r.id===b.dataset.userEdit)));
  }
  function userForm(row) {
    modal(row?'แก้ไขผู้ใช้ / รีเซ็ตรหัสผ่าน':'เพิ่มบัญชีเจ้าหน้าที่',`<form id="user-form"><div class="field"><label for="u-username">Username (a-z, 0-9, จุด, ขีด)</label><input id="u-username" required pattern="[a-z0-9._-]{3,50}" value="${esc(row?.username||'')}" ${row?'readonly':''}></div><div class="field"><label for="u-name">ชื่อผู้ใช้งาน</label><input id="u-name" required maxlength="150" value="${esc(row?.name||'')}"></div><div class="field"><label for="u-role">สิทธิ์</label><select id="u-role" ${row?'disabled':''}><option value="nacc"${row?.role==='nacc'?' selected':''}>nacc</option><option value="admin"${row?.role==='admin'?' selected':''}>admin</option></select></div><div class="field"><label for="u-password">${row?'รหัสผ่านใหม่ (เว้นว่างเพื่อไม่เปลี่ยน)':'รหัสผ่าน'}</label><input id="u-password" type="password" minlength="12" ${row?'':'required'} autocomplete="new-password"></div><div id="user-feedback" role="alert"></div><div class="form-actions"><button class="btn" type="submit">บันทึกบัญชี</button></div></form>`);
    $('#user-form').onsubmit=async e=>{
      e.preventDefault();const b=$('button[type=submit]',e.target);b.disabled=true;
      try {
        const body={action:row?'update':'create',...(row?{id:row.id}:{}),username:$('#u-username').value,name:$('#u-name').value.trim(),role:$('#u-role').value,password:$('#u-password').value};
        const {data,error}=await db.functions.invoke('manage-users',{body});
        if(error) {
          let msg='ติดต่อ manage-users ไม่สำเร็จ โปรดตรวจสอบว่าได้ติดตั้ง Edge Function แล้ว';
          try{const info=await error.context.json();if(info.error)msg=info.error;}catch{}
          throw new Error(msg);
        }
        if(data?.error)throw new Error(data.error);
        $('#modal').close();toast('บันทึกบัญชีสำเร็จ');await usersPage();icons();
      }catch(err){$('#user-feedback').className='form-error';$('#user-feedback').textContent=errorMessage(err);}finally{b.disabled=false;}
    };
  }
  function privacy() {
    main.innerHTML=heading('ความเป็นส่วนตัวและสถิติการเข้าชม')+`<div class="container page-body"><article class="paper"><h2>การเก็บสถิติการเปิดหน้าหลัก</h2><p>เมื่อเชื่อมต่อฐานข้อมูลแล้ว ระบบจะบันทึกประเภทอุปกรณ์หรือรุ่นที่เบราว์เซอร์เปิดเผย และวันเวลาที่เปิดหน้าหลัก เพื่อจัดทำสถิติโดยรวม โดยไม่เก็บ IP ตำแหน่ง GPS หรือคุกกี้ติดตามในโค้ดเว็บไซต์นี้</p><p>เบราว์เซอร์บางชนิดไม่เปิดเผยรุ่นอุปกรณ์ที่แน่นอน ระบบจึงแสดงเฉพาะระบบปฏิบัติการหรือประเภทอุปกรณ์ที่ตรวจสอบได้ สถิติเป็นจำนวนครั้งที่เปิดหน้าหลัก ไม่ใช่จำนวนผู้ใช้ไม่ซ้ำ และไม่นับการเปลี่ยนเมนูภายในการเปิดหน้าเดียวกัน</p><p>ผู้เยี่ยมชมดูได้เฉพาะยอดรวม ไม่สามารถอ่านรายการอุปกรณ์และวันเวลาแต่ละรายการผ่าน API สาธารณะได้ เจ้าของฐานข้อมูลควรกำหนดระยะเวลาเก็บรักษาให้เหมาะสม</p></article><article class="paper"><h2>ข้อมูลนักเรียนและไฟล์สาธารณะ</h2><p>รายชื่อ รูปภาพ ระดับชั้น รหัสนักเรียน และไฟล์ที่เจ้าหน้าที่เผยแพร่สามารถเข้าถึงได้สาธารณะ โปรดตรวจสอบสิทธิ์และความยินยอมก่อนเผยแพร่ โดยเฉพาะข้อมูลของผู้เยาว์ และอย่าอัปโหลดเลขประจำตัวประชาชน ข้อมูลสุขภาพ หรือเอกสารภายในที่ไม่อนุญาตให้เปิดเผย</p><p>แผนที่ใช้บริการ Google Maps และฟอนต์ใช้บริการ Google Fonts ผู้ให้บริการเหล่านี้อาจได้รับข้อมูลการเชื่อมต่อตามนโยบายของตน</p></article><article class="paper"><h2>การเข้าระบบเจ้าหน้าที่</h2><p>รหัสผ่านจัดการด้วย Supabase Auth ไม่ถูกเผยแพร่ในฐานข้อมูลที่อ่านได้จากหน้าเว็บ ระบบไม่บันทึกเซสชันลงพื้นที่เก็บข้อมูลของเบราว์เซอร์ จึงต้องเข้าสู่ระบบอีกครั้งเมื่อรีเฟรชหรือเปิดเว็บไซต์ใหม่</p></article></div>`;icons();
  }
  async function route() {
    const version=++routeVersion;
    closeNav();if($('#modal').open)$('#modal').close();
    const [key='',param='']=location.hash.replace(/^#\/?/,'').split('/');
    document.title=`${LABELS[key]||({login:'เข้าสู่ระบบเจ้าหน้าที่',admin:'จัดการข้อมูล',privacy:'ความเป็นส่วนตัว',news:'ข่าวสาร'}[key])||'หน้าหลัก'} | ป.ป.ช.สพฐ.น้อย โรงเรียนภูเขียว`;
    window.scrollTo({top:0,behavior:'instant'});
    try {
      if(!key)await home(version);
      else if(key==='login')login();
      else if(key==='admin')await adminPage(param||'Home',version);
      else if(key==='privacy')privacy();
      else if(key==='news'&&param)await article(decodeURIComponent(param),version);
      else await publicPage(key,version);
    }catch(e){
      if(version!==routeVersion)return;
      main.innerHTML=heading('โหลดข้อมูลไม่สำเร็จ')+`<div class="container page-body">${empty('ไม่สามารถอ่านข้อมูลได้',errorMessage(e),'wifi-off')}<div class="form-actions"><button class="btn" id="retry">ลองอีกครั้ง</button><a class="btn secondary" href="#/">กลับหน้าหลัก</a></div></div>`;
      $('#retry').onclick=route;icons();
    }
  }
  setupShell();
  window.addEventListener('hashchange',route);
  route();
})();
