const $=s=>document.querySelector(s);
let DATA={evento:{},trabajos:[],mesas:[],programaGeneral:[]},view='inicio';
let filters={q:'',day:'1',mesa:'all',modalidad:'all',tipo:'all'};
const KEY='iceaAgenda2026';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

async function boot(){
  try{
    const req=[fetch('data/meta-20260907.json?v=2',{cache:'no-store'}),...Array.from({length:6},(_,i)=>fetch(`data/works-20260907-${i+1}.json?v=2`,{cache:'no-store'})),fetch('data.json?v=bios',{cache:'no-store'}).catch(()=>null)];
    const res=await Promise.all(req);
    if(!res[0].ok) throw new Error('No se pudo cargar el programa final');
    const meta=await res[0].json();
    const chunks=await Promise.all(res.slice(1,7).map(async r=>{if(!r.ok)throw new Error('No se pudo cargar una parte del programa');return r.json()}));
    DATA={...meta,trabajos:chunks.flat()};
    if(res[7]&&res[7].ok){
      const old=await res[7].json();
      const bios=new Map((old.works||[]).filter(x=>x.bio).map(x=>[norm(x.title),x.bio]));
      DATA.trabajos.forEach(t=>{if(!t.semblanza&&bios.has(norm(t.titulo)))t.semblanza=bios.get(norm(t.titulo));});
    }
    if(!Array.isArray(DATA.mesas)||!DATA.mesas.length) DATA.mesas=[...new Set(DATA.trabajos.map(x=>x.mesa).filter(Boolean))].sort().map(c=>({codigo:c,nombre:''}));
    bind();render();countdown();
  }catch(e){console.error(e);$('#app').innerHTML=`<div class="error"><b>No se pudo cargar el programa.</b><br>${esc(e.message)}</div>`}
}
function bind(){
  document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>go(b.dataset.view));
  $('#menuBtn').onclick=()=>{$('#sidebar').classList.add('open');$('#overlay').classList.add('show')};
  $('#overlay').onclick=closeMenu;
  $('#closeDialog').onclick=()=>$('#dialog').close();
  $('#globalSearch').oninput=e=>{filters.q=e.target.value;view='programa';render();setNav('programa')};
}
function closeMenu(){$('#sidebar').classList.remove('open');$('#overlay').classList.remove('show')}
function setNav(v){document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v))}
function go(v){view=v;setNav(v);closeMenu();render();scrollTo({top:0,behavior:'smooth'})}
function render(){const a=$('#app');if(view==='inicio')a.innerHTML=inicio();else if(view==='programa')a.innerHTML=programa();else if(view==='agenda')a.innerHTML=agenda();else if(view==='constancias')a.innerHTML=constancias();else a.innerHTML=info();updateCount()}

function inicio(){
  const t=DATA.evento.totales||{};
  const hi=highlights().slice(0,6);
  return `<section class="hero"><img class="hero-logo" src="assets/logos/logo-congreso.png" alt="Logo del Congreso"><div class="hero-actions"><button onclick="go('programa')">Consultar programa</button><button class="secondary" onclick="filters.day='2';go('programa')">Ver 24 de septiembre</button></div></section>
  <section class="intro-strip"><div class="metric"><div id="countdown" class="countdown"></div></div><div class="metric"><b>${t.trabajos||DATA.trabajos.length}</b><span>Trabajos</span></div><div class="metric"><b>${t.ponencias||DATA.trabajos.filter(x=>x.tipo==='Ponencia').length}</b><span>Ponencias</span></div><div class="metric"><b>${t.carteles||DATA.trabajos.filter(x=>x.tipo==='Cartel').length}</b><span>Carteles</span></div></section>
  <div class="section-head"><div><div class="eyebrow">Imperdibles</div><h2 class="section-title">Momentos centrales del Congreso</h2><p class="lead">Una selección de actividades plenarias y encuentros especiales. El resto del programa se consulta por día.</p></div><button class="text-link" onclick="go('programa')">Ver programa completo →</button></div>
  <section class="highlights">${hi.map(highlightCard).join('')}</section>`;
}
function highlights(){
  return (DATA.programaGeneral||[]).filter(e=>/inaugur|conferencia magistral|foro de expertos|foro de turismo|clausura|encuentro de cierre|expo-venta|reunión anual/i.test(e.actividad||''));
}
function highlightCard(e){return `<article class="highlight"><time>${esc(e.fecha||'')}</time><h3>${esc(e.actividad||'')}</h3><p>${esc(e.ubicacion||'')}</p><b>${esc(e.horario||'')}</b></article>`}

function programa(){
  const day=String(filters.day||'1');
  const items=filtered();
  const specials=specialsForDay(day);
  return `<div class="section-head"><div><div class="eyebrow">Programa académico</div><h1 class="section-title">Tu día en el Congreso</h1><p class="lead">Elige la fecha y consulta las actividades en orden cronológico. Ponencias, carteles y actividades especiales viven en una sola agenda.</p></div></div>
  ${dayTabs()}
  <div class="filters"><input value="${esc(filters.q)}" placeholder="Buscar título, autor o código…" oninput="filters.q=this.value;render()"><select onchange="filters.mesa=this.value;render()"><option value="all">Todas las mesas / bloques</option>${DATA.mesas.map(m=>`<option value="${esc(m.codigo)}" ${filters.mesa===m.codigo?'selected':''}>${esc(m.codigo)}</option>`).join('')}</select><select onchange="filters.modalidad=this.value;render()"><option value="all">Todas las modalidades</option><option ${filters.modalidad==='Presencial'?'selected':''}>Presencial</option><option ${filters.modalidad==='Virtual'?'selected':''}>Virtual</option></select><select onchange="filters.tipo=this.value;render()"><option value="all">Ponencias y carteles</option><option ${filters.tipo==='Ponencia'?'selected':''}>Ponencia</option><option ${filters.tipo==='Cartel'?'selected':''}>Cartel</option></select></div>
  ${timeline(day,items,specials)}`;
}
function dayTabs(){return `<div class="day-tabs">${[['1','Miércoles','23 septiembre'],['2','Jueves','24 septiembre'],['3','Viernes','25 septiembre']].map(d=>`<button class="day-tab ${filters.day===d[0]?'active':''}" onclick="filters.day='${d[0]}';render()"><span>${d[1]}</span><b>${d[2]}</b></button>`).join('')}</div>`}
function filtered(){const q=norm(filters.q);return DATA.trabajos.filter(t=>String(t.dia)===String(filters.day)&&(filters.mesa==='all'||t.mesa===filters.mesa)&&(filters.modalidad==='all'||t.modalidad===filters.modalidad)&&(filters.tipo==='all'||t.tipo===filters.tipo)&&(!q||norm([t.codigo,t.titulo,(t.autores||[]).join(' '),t.mesa,t.sala].join(' ')).includes(q)))}
function specialsForDay(day){const token=day==='1'?'23 septiembre':day==='2'?'24 septiembre':'25 septiembre';return (DATA.programaGeneral||[]).filter(e=>norm(e.fecha).includes(norm(token))&&/inaugur|conferencia magistral|foro|expo|reunión anual|clausura|encuentro de cierre/i.test(e.actividad||''))}
function timeKey(v=''){const m=String(v).match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):9999}
function timeline(day,items,specials){
  if(!items.length&&!specials.length)return `<div class="empty">No hay resultados con esos filtros.</div>`;
  const workEvents=items.map(t=>({kind:'work',time:t.horario||'',sort:timeKey(t.horario),item:t}));
  const specialEvents=specials.map(s=>({kind:'special',time:s.horario||'',sort:timeKey(s.horario),item:s}));
  const all=[...workEvents,...specialEvents].sort((a,b)=>a.sort-b.sort||a.kind.localeCompare(b.kind));
  const grouped=[];
  for(const e of all){const k=e.time||'Horario por confirmar';let g=grouped.find(x=>x.time===k);if(!g){g={time:k,events:[]};grouped.push(g)}g.events.push(e)}
  return `<div class="timeline">${grouped.map(g=>`<section class="time-block"><div class="time-block-head"><time>${esc(g.time)}</time><h3>${g.events.some(x=>x.kind==='special')?'Actividad del Congreso':'Sesión académica'}</h3><span>${g.events.filter(x=>x.kind==='work').length?g.events.filter(x=>x.kind==='work').length+' participación(es)':''}</span></div><div class="session-list">${g.events.map(e=>e.kind==='special'?specialRow(e.item):sessionRow(e.item)).join('')}</div></section>`).join('')}</div>`
}
function specialRow(e){return `<article class="special-row"><time>${esc(e.fecha||'')}</time><div><h3>${esc(e.actividad||'')}</h3><p>${esc(e.ubicacion||'')}</p></div><span class="badge">Actividad especial</span></article>`}
function sessionRow(t){const s=saved(t.codigo);return `<article class="session"><div class="session-meta"><b>${esc(t.mesa||t.tipo)}</b>${esc(t.tipo)} · ${esc(t.modalidad)}<br>${esc(t.sala||'')}</div><div><h4>${esc(t.titulo)}</h4><div class="authors">${(t.autores||[]).map(esc).join('; ')}</div></div><div class="session-actions"><button class="chip-btn ${s?'saved':''}" onclick="toggle('${esc(t.codigo)}')">${s?'★ Guardado':'☆ Mi Agenda'}</button><button class="chip-btn" onclick="detail('${esc(t.codigo)}')">${t.semblanza?'Detalles + semblanza':'Ver detalles'}</button>${t.tipo==='Cartel'?`<button class="chip-btn" onclick="openPdf('carteles/${esc(t.codigo)}.pdf','El cartel todavía no ha sido cargado.')">Ver cartel</button>`:''}</div></article>`}

function agenda(){const ids=getAgenda(),x=DATA.trabajos.filter(t=>ids.includes(t.codigo));return `<div class="section-head"><div><div class="eyebrow">Mi Agenda</div><h1 class="section-title">Lo que no quieres perderte</h1><p class="lead">Tus selecciones se guardan únicamente en este navegador.</p></div></div>${x.length?`<div class="timeline">${x.sort((a,b)=>a.dia-b.dia||timeKey(a.horario)-timeKey(b.horario)).map(t=>`<section class="time-block"><div class="time-block-head"><time>${esc(t.diaTexto)}<br>${esc(t.horario)}</time><h3>${esc(t.mesa)}</h3><span>${esc(t.modalidad)}</span></div><div class="session-list">${sessionRow(t)}</div></section>`).join('')}</div>`:`<div class="agenda-empty"><h3>Aún no has guardado actividades</h3><p>En el Programa toca “☆ Mi Agenda” en las participaciones que quieras seguir.</p><button class="text-link" onclick="go('programa')">Explorar programa →</button></div>`}`}

function constancias(){const q=norm(filters.q),x=DATA.trabajos.filter(t=>!q||norm([t.codigo,t.titulo,(t.autores||[]).join(' ')].join(' ')).includes(q));return `<div class="section-head"><div><div class="eyebrow">Constancias</div><h1 class="section-title">Encuentra tu participación</h1><p class="lead">Busca por nombre, título o código. Los archivos aparecerán aquí conforme sean incorporados.</p></div></div><div class="const-search"><input value="${esc(filters.q)}" placeholder="Nombre, título o código…" oninput="filters.q=this.value;render()"></div><div class="const-list">${x.slice(0,80).map(t=>`<article class="const-item"><div class="code">${esc(t.codigo)}<br>${esc(t.tipo)}</div><div><h4>${esc(t.titulo)}</h4><p>${(t.autores||[]).map(esc).join('; ')}</p></div><div class="session-actions"><button class="chip-btn" onclick="detail('${esc(t.codigo)}')">Ver participación</button><button class="chip-btn" onclick="openConstancia('${esc(t.codigo)}','${esc(t.tipo)}')">Constancia</button></div></article>`).join('')}</div>`}

function info(){return `<div class="section-head"><div><div class="eyebrow">Información</div><h1 class="section-title">Sede y orientación</h1><p class="lead">Todo lo necesario para ubicarte durante el Congreso.</p></div></div><section class="info-hero"><img class="info-photo" src="assets/images/acceso-icea.jpeg" alt="Acceso al ICEA"><div class="info-copy"><div><h2>Instituto de Ciencias Económico-Administrativas</h2><p>San Agustín Tlaxiaca, Hidalgo.</p><p><b>Fechas:</b> 23, 24 y 25 de septiembre de 2026 · <b>Modalidad:</b> híbrida.</p></div><button class="text-link" onclick="go('programa')">Consultar sedes en el programa →</button></div></section><section class="map-section"><div class="section-head"><div><div class="eyebrow">Ubicación</div><h2 class="section-title" style="font-size:30px">Croquis de la sede</h2></div></div><img src="assets/images/croquis-icea.png" alt="Croquis ICEA"></section>`}

function detail(code){const t=DATA.trabajos.find(x=>x.codigo===code);if(!t)return;$('#dialogBody').innerHTML=`<div class="dialog-head"><div class="eyebrow">${esc(t.codigo)} · ${esc(t.tipo)}</div><h2>${esc(t.titulo)}</h2></div><div class="dialog-content"><p><b>Autores:</b> ${(t.autores||[]).map(esc).join('; ')}</p><p><b>Fecha:</b> ${esc(t.diaTexto)} · ${esc(t.horario)}<br><b>Mesa / bloque:</b> ${esc(t.mesa)}${t.mesaNombre&&t.mesaNombre!==t.mesa?' · '+esc(t.mesaNombre):''}<br><b>Sede:</b> ${esc(t.sala||'')}<br><b>Modalidad:</b> ${esc(t.modalidad)}</p>${t.semblanza?`<div class="bio-box"><div class="eyebrow">Semblanza</div><p>${esc(t.semblanza)}</p></div>`:''}</div>`;$('#dialog').showModal()}
async function openPdf(path,pending){try{const r=await fetch(path,{method:'HEAD',cache:'no-store'});if(!r.ok)throw Error();window.open(path,'_blank')}catch{$('#dialogBody').innerHTML=`<div class="dialog-head"><div class="eyebrow">Archivo</div><h2>Pendiente de incorporar</h2></div><div class="dialog-content"><p>${esc(pending)}</p></div>`;$('#dialog').showModal()}}
function openConstancia(code,tipo){const folder=tipo==='Cartel'?'carteles':'ponencias';openPdf(`constancias/${folder}/${code}.pdf`,'La constancia todavía no ha sido incorporada al sitio.')}
function getAgenda(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function saved(c){return getAgenda().includes(c)}
function toggle(c){const s=new Set(getAgenda());s.has(c)?s.delete(c):s.add(c);localStorage.setItem(KEY,JSON.stringify([...s]));render()}
function updateCount(){const e=$('#agendaCount');if(e)e.textContent=getAgenda().length?`(${getAgenda().length})`:''}
function countdown(){function tick(){const e=$('#countdown');if(!e)return;let d=Math.max(0,new Date('2026-09-23T10:00:00-06:00')-Date.now());const vals=[['Días',Math.floor(d/86400000)],['Horas',Math.floor(d%86400000/3600000)],['Min',Math.floor(d%3600000/60000)],['Seg',Math.floor(d%60000/1000)]];e.innerHTML=vals.map(v=>`<div><b>${String(v[1]).padStart(2,'0')}</b><span>${v[0]}</span></div>`).join('')}tick();setInterval(tick,1000)}
function esc(s=''){return String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
boot();
