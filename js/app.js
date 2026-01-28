// /js/app.js
async function loadJSON(path, fallback){
  try{
    const r = await fetch(path,{cache:'no-store'});
    if(!r.ok) throw new Error(r.status);
    return await r.json();
  }catch(e){ console.warn('load fail', path, e); return fallback }
}

// PL data helpers
function fmtDateISOtoPL(iso){
  try{
    const d=new Date(iso+'T12:00:00');
    const dd=String(d.getDate()).padStart(2,'0');
    const m=['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
    return dd+' '+m[d.getMonth()]+' '+d.getFullYear();
  }catch(e){ return iso }
}
const DAYS_PL = ['Niedziela','Poniedziałek','Wtorek','Środa','Czwartek','Piątek','Sobota'];
const MONTHS_PL = ['stycznia','lutego','marca','kwietnia','maja','czerwca','lipca','sierpnia','września','października','listopada','grudnia'];
const norm = s => (s||'').toString().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
const asList = (data) =>
  Array.isArray(data) ? data : (data && Array.isArray(data.ROOT) ? data.ROOT : []);

(async function init(){
  const site     = await loadJSON('data/site.json', {});
  const trainers = asList(await loadJSON('data/trainers.json', []));
  const athletes = asList(await loadJSON('data/athletes.json', []));
  const news     = asList(await loadJSON('data/news.json', []));
  const schedule = asList(await loadJSON('data/schedule.json', []));
  const pricing  = asList(await loadJSON('data/pricing.json', []));
  const rules    = await loadJSON('data/rules.json', {"content":""});
  const sponsors = asList(await loadJSON('data/sponsors.json', []));


  // basic texts
  document.querySelectorAll('.club-name').forEach(el=>el.textContent=site.clubName||'Rebels Club');
  document.querySelectorAll('.motto').forEach(el=>el.textContent=site.motto||'Dyscyplina • Charakter • Rebelia');
  document.querySelectorAll('.cta-text').forEach(el=>el.textContent=site.cta||'Pierwszy trening próbny — GRATIS');

  // stats
  const stats=document.getElementById('stats');
  if(stats&&site.stats){
    stats.innerHTML = `
      <div class="stat"><div class="v">${site.stats.members||0}+</div><div class="meta">aktywnych klubowiczów</div></div>
      <div class="stat"><div class="v">${site.stats.founded||''}</div><div class="meta">rok założenia</div></div>`;
  }

  //      <div class="stat"><div class="v">${site.stats.medals||0}</div><div class="meta">medali</div></div>

  // === DZISIEJSZE TRENINGI z grafiku ===
  const hero = document.getElementById('hero-trainings');
  const today = new Date();
  const todayName = DAYS_PL[today.getDay()]; // np. "Środa"
  const todayLabel = `${todayName} • ${String(today.getDate()).padStart(2,'0')} ${MONTHS_PL[today.getMonth()]}`;
  const dateEl = document.getElementById('today-date');
  if(dateEl) dateEl.textContent = todayLabel;

  if(hero){
    const todays = schedule.filter(r => norm(r.day) === norm(todayName));
    if(todays.length){
      hero.innerHTML = todays.map(t=>`
        <div class="card">
          <div class="card-body">
            <div class="meta">${t.time}${t.room?` • ${t.room}`:''}</div>
            <h3>${t.group||''}</h3>
            <div class="meta">${t.coach||''}</div>
          </div>
        </div>`).join('');
    }else{
      hero.innerHTML = `
        <div class="card"><div class="card-body">
          <h3>Dziś nie trenujemy</h3>
          <p class="meta">Sprawdź pełny grafik poniżej.</p>
        </div></div>`;
    }
  }

  // kontakt
  const contact=document.getElementById('contact-block');
  if(contact){
    contact.querySelector('.address').textContent=site.address||'';
    contact.querySelector('.email').textContent=site.email||'';
    const s=site.socials||{};
    contact.querySelector('.ig').href=s.instagram||'#';
    contact.querySelector('.fb').href=s.facebook||'#';
    contact.querySelector('.yt').href=s.youtube||'#';
  }

  // trenerzy
  const tw=document.getElementById('trainers');
  if(tw){ tw.innerHTML = trainers.map(p=>`
    <div class="person">
      <img src="${p.photo}" alt="${p.alt||p.name}"/>
      <div><h4>${p.name}</h4><div class="meta">${p.role||''}</div><div class="tags">${(p.tags||[]).map(t=>`<span class="chip">${t}</span>`).join('')}</div></div>
    </div>`).join(''); 
  }
  
  const trainersSection = document.querySelector('#trenerzy')?.closest('section');
  if (trainersSection && (!trainers || trainers.length === 0)) {
    trainersSection.style.display = 'none';
  }  

  // zawodnicy
  const aw=document.getElementById('athletes');
  if(aw){ aw.innerHTML = athletes.map(a=>`
    <div class="card"><img src="${a.photo}" alt="${a.alt||a.name}"/><div class="card-body"><h3>${a.name}</h3><p class="meta">${a.achievements||''}</p></div></div>`).join(''); }

  const athletesSection = document.querySelector('#zawodnicy')?.closest('section');
    if (athletesSection && (!athletes || athletes.length === 0)) {
    athletesSection.style.display = 'none';
  }   

  // grafik (tabela)
  const sb=document.getElementById('schedule-body');
  if(sb){ sb.innerHTML = schedule.map(r=>`<tr><td>${r.day}</td><td>${r.time}</td><td>${r.group}</td><td>${r.coach||''}</td><td>${r.room||''}</td></tr>`).join(''); }

  // news
  const nw=document.getElementById('news');
  if(nw){
    const sorted=news.slice().sort((a,b)=>(b.date||'').localeCompare(a.date||''));
    nw.innerHTML = sorted.map(n=>`
      <article class="news-item">
        <img src="${n.cover}" alt="${n.alt||n.title}"/>
        <div><h3>${n.title}</h3><p class="meta">Dodano: ${fmtDateISOtoPL(n.date||'')}</p><p>${n.lead||''}</p></div>
      </article>`).join('');
  }

  const newsSection = document.querySelector('#aktualnosci')?.closest('section');
    if (newsSection && (!news || news.length === 0)) {
    newsSection.style.display = 'none';
  }

  // cennik
  const pw=document.getElementById('pricing');
  if(pw){ pw.innerHTML = pricing.map(p=>`
    <div class="price-card">
      <div class="price-title">${p.name}</div>
      <div class="price-meta">${p.level||''} • ${p.sessions||''}</div>
      <div class="price-tag">${p.price||''}</div>
      <p class="meta">${p.note||''}</p>
    </div>`).join('');
  }

  const pricingSection = document.querySelector('#cennik')?.closest('section');
    if (pricingSection && (!pricing || pricing.length === 0)) {
      pricingSection.style.display = 'none';
    }

  // Sponsorzy / Partnerzy
  const spWrap = document.getElementById('sponsors');
  if (spWrap) {
    const ordered = (sponsors || []).slice().sort((a,b)=>(a.order||999)-(b.order||999));
    if (ordered.length === 0) {
      // brak sponsorów → schowaj całą sekcję
      const sponsorsSection = document.querySelector('#sponsorzy')?.closest('section');
      if (sponsorsSection) sponsorsSection.style.display = 'none';
    } else {
      spWrap.innerHTML = ordered.map(s => {
        const img = `<img src="${s.logo}" alt="${s.name||'Sponsor'}" loading="lazy" />`;
        return s.url
          ? `<a class="sponsor" href="${s.url}" target="_blank" rel="noopener">${img}</a>`
          : `<div class="sponsor">${img}</div>`;
      }).join('');
    }
  }


  // regulamin
  const rulesEl=document.getElementById('rules');
  if(rulesEl){ rulesEl.innerHTML = (rules.content||'').replace(/\n/g,'<br/>'); }

  // footer rok
  const y=document.getElementById('year'); if(y){ y.textContent = new Date().getFullYear(); }

  // smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a=>{
    a.addEventListener('click',e=>{
      const id=a.getAttribute('href'); const t=document.querySelector(id);
      if(t){ e.preventDefault(); t.scrollIntoView({behavior:'smooth',block:'start'}); }
    });
  });
})();
