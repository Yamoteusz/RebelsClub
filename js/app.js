
async function loadJSON(path, fallback){try{const r=await fetch(path,{cache:'no-store'});if(!r.ok)throw new Error(r.status);return await r.json()}catch(e){console.warn('load fail',path,e);return fallback}}
function fmtDateISOtoPL(iso){try{const d=new Date(iso+'T12:00:00');const dd=String(d.getDate()).padStart(2,'0');const m=['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];return dd+' '+m[d.getMonth()]+' '+d.getFullYear()}catch(e){return iso}}
(async function init(){
  const site=await loadJSON('data/site.json',{});
  const trainers=await loadJSON('data/trainers.json',[]);
  const athletes=await loadJSON('data/athletes.json',[]);
  const news=await loadJSON('data/news.json',[]);
  const schedule=await loadJSON('data/schedule.json',[]);
  const pricing=await loadJSON('data/pricing.json',[]);
  const rules=await loadJSON('data/rules.json',{"content":""});

  document.querySelectorAll('.club-name').forEach(el=>el.textContent=site.clubName||'Rebels Club');
  document.querySelectorAll('.motto').forEach(el=>el.textContent=site.motto||'Dyscyplina • Charakter • Rebelia');
  document.querySelectorAll('.cta-text').forEach(el=>el.textContent=site.cta||'Pierwszy trening próbny — GRATIS');

  const stats=document.getElementById('stats');
  if(stats&&site.stats){stats.innerHTML=`
    <div class="stat"><div class="v">${site.stats.members||0}+</div><div class="meta">aktywnych klubowiczów</div></div>
    <div class="stat"><div class="v">${site.stats.medals||0}</div><div class="meta">medali 2024–2025</div></div>
    <div class="stat"><div class="v">${site.stats.founded||''}</div><div class="meta">rok założenia</div></div>`}

  const hero=document.getElementById('hero-trainings');
  if(hero&&site.heroTrainings){hero.innerHTML=site.heroTrainings.map(t=>`
    <div class="card"><div class="card-body">
      <div class="meta">${t.time} • ${t.room}</div>
      <h3>${t.title}</h3>
      <div class="meta">${t.coach}</div>
    </div></div>`).join('')}

  const contact=document.getElementById('contact-block');
  if(contact){contact.querySelector('.address').textContent=site.address||'';contact.querySelector('.email').textContent=site.email||'';const s=site.socials||{};contact.querySelector('.ig').href=s.instagram||'#';contact.querySelector('.fb').href=s.facebook||'#';contact.querySelector('.yt').href=s.youtube||'#'}

  const tw=document.getElementById('trainers');
  if(tw){tw.innerHTML=trainers.map(p=>`
    <div class="person">
      <img src="${p.photo}" alt="${p.alt||p.name}"/>
      <div><h4>${p.name}</h4><div class="meta">${p.role||''}</div><div class="tags">${(p.tags||[]).map(t=>`<span class="chip">${t}</span>`).join('')}</div></div>
    </div>`).join('')}

  const aw=document.getElementById('athletes');
  if(aw){aw.innerHTML=athletes.map(a=>`
    <div class="card"><img src="${a.photo}" alt="${a.alt||a.name}"/><div class="card-body"><h3>${a.name}</h3><p class="meta">${a.achievements||''}</p></div></div>`).join('')}

  const sb=document.getElementById('schedule-body');
  if(sb){sb.innerHTML=schedule.map(r=>`<tr><td>${r.day}</td><td>${r.time}</td><td>${r.group}</td><td>${r.coach||''}</td><td>${r.room||''}</td></tr>`).join('')}

  const nw=document.getElementById('news');
  if(nw){const sorted=news.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));nw.innerHTML=sorted.map(n=>`
    <article class="news-item"><img src="${n.cover}" alt="${n.alt||n.title}"/><div><h3>${n.title}</h3><p class="meta">Dodano: ${fmtDateISOtoPL(n.date||'')}</p><p>${n.lead||''}</p></div></article>`).join('')}

  const pw=document.getElementById('pricing');
  if(pw){pw.innerHTML=pricing.map(p=>`
    <div class="price-card">
      <div class="price-title">${p.name}</div>
      <div class="price-meta">${p.level||''} • ${p.sessions||''}</div>
      <div class="price-tag">${p.price||''}</div>
      <p class="meta">${p.note||''}</p>
    </div>`).join('')}

  const rulesEl=document.getElementById('rules');
  if(rulesEl){rulesEl.innerHTML=(rules.content||'').replace(/\\n/g,'<br/>')}

  document.getElementById('year').textContent=new Date().getFullYear();
  const el=document.getElementById('today-date'); if(el){const d=new Date();const days=['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];const months=['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];el.textContent=`${days[d.getDay()]} • ${String(d.getDate()).padStart(2,'0')} ${months[d.getMonth()]}`}
  document.querySelectorAll('a[href^=\"#\"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');const t=document.querySelector(id);if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth',block:'start'})}}));
})();