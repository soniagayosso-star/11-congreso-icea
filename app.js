const $=s=>document.querySelector(s);
let DATA={evento:{},trabajos:[],bloques:[],actividadesGenerales:[]},view='inicio';
let filters={q:'',day:'all',mesa:'all',modalidad:'all',tipo:'all'};
const KEY='iceaAgenda2026';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const esc=s=>String(s??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));

async function boot(){
  try{
    const r=await fetch('data/programa.json?v=20260914-final-programa',{cache:'no-store'});
    if(!r.ok) throw new Error('No se pudo cargar el programa final');
    DATA=await r.json(); bind(); render(); countdown();
  }catch(e){console.error(e);$('#app').innerHTML=`<div class="error"><b>No se pudo cargar el programa.</b><br>${esc(e.message)}</div>`}
}
function bind(){
  document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>go(b.dataset.view));
  $('#menuBtn').onclick=()=>{$('#sidebar').classList.add('open');$('#overlay').classList.add('show')};
  $('#overlay').onclick=closeMenu; $('#closeDialog').onclick=()=>$('#dialog').close();
  $('#globalSearch').oninput=e=>{filters.q=e.target.value; if(filters.q.trim()) view='programa'; render(); setNav(view)};
}
function closeMenu(){$('#sidebar').classList.remove('open');$('#overlay').classList.remove('show')}
function setNav(v){document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v))}
function go(v){view=v;setNav(v);closeMenu();render();scrollTo({top:0,behavior:'smooth'})}
function render(){const a=$('#app');if(view==='inicio')a.innerHTML=inicio();else if(view==='programa')a.innerHTML=programa();else if(view==='agenda')a.innerHTML=agenda();else a.innerHTML=constancias();updateCount()}

function inicio(){
 const t=DATA.evento.totales||{}; const hi=(DATA.actividadesGenerales||[]).slice(0,6);
 return `<section class="hero"><img class="hero-logo" src="assets/logos/logo-congreso.png" alt="Logo del Congreso"></section>
 <section class="intro-strip"><div class="metric"><div id="countdown" class="countdown"></div></div><div class="metric"><b>${t.participaciones||0}</b><span>Participaciones</span></div><div class="metric"><b>${t.ponencias||0}</b><span>Ponencias</span></div><div class="metric"><b>${t.carteles||0}</b><span>Carteles</span></div></section>
 <div class="section-head"><div><div class="eyebrow">Eventos destacados</div><h2 class="section-title">Momentos centrales del Congreso</h2><p class="lead">Consulta las actividades generales y el programa académico completo desde Programa.</p></div></div>
 <section class="highlights">${hi.map(highlightCard).join('')}</section>
 <section class="home-map"><div class="home-map-copy"><div class="eyebrow">Sede ICEA</div><h2>Croquis del Congreso</h2><p>Ubica los espacios del Instituto de Ciencias Económico-Administrativas durante los tres días del Congreso.</p></div><img src="assets/images/croquis-icea.png" alt="Croquis de la sede ICEA"></section>`;
}
function highlightCard(e){return `<article class="highlight"><time>${esc(e.fecha)}</time><h3>${esc(e.actividad)}</h3><p>${esc(e.sede)}</p><b>${esc(e.horario)}</b></article>`}

function programa(){
 const q=norm(filters.q); const blocks=visibleBlocks(); const specials=visibleSpecials();
 return `<div class="section-head"><div><div class="eyebrow">Programa académico</div><h1 class="section-title">Programa del Congreso</h1><p class="lead">Consulta el programa general o navega por día. Las participaciones se presentan por mesa o bloque.</p></div></div>
 ${dayTabs()}
 <div class="filters simple"><select onchange="filters.mesa=this.value;render()"><option value="all">Todas las mesas / bloques</option>${blockNames().map(x=>`<option value="${esc(x)}" ${filters.mesa===x?'selected':''}>${esc(x)}</option>`).join('')}</select><select onchange="filters.modalidad=this.value;render()"><option value="all">Todas las modalidades</option><option value="Presencial" ${filters.modalidad==='Presencial'?'selected':''}>Presencial</option><option value="Virtual" ${filters.modalidad==='Virtual'?'selected':''}>Virtual</option></select><select onchange="filters.tipo=this.value;render()"><option value="all">Ponencias y carteles</option><option value="Ponencia" ${filters.tipo==='Ponencia'?'selected':''}>Ponencia</option><option value="Cartel" ${filters.tipo==='Cartel'?'selected':''}>Cartel</option></select></div>
 ${specials.length?`<div class="day-specials">${specials.map(specialCompact).join('')}</div>`:''}
 ${blocks.length?`<div class="mesa-stack">${blocks.map(blockCard).join('')}</div>`:`<div class="empty">No hay resultados relacionados con la búsqueda o filtros seleccionados.</div>`}`;
}
function dayTabs(){return `<div class="day-tabs">${[['all','Programa general','Tres días'],['1','Miércoles','23 septiembre'],['2','Jueves','24 septiembre'],['3','Viernes','25 septiembre']].map(d=>`<button class="day-tab ${String(filters.day)===d[0]?'active':''}" onclick="filters.day='${d[0]}';render()"><span>${d[1]}</span><b>${d[2]}</b></button>`).join('')}</div>`}
function blockNames(){return [...new Set((DATA.bloques||[]).map(b=>b.nombre))]}
function matchWork(w,q){return !q||norm([w.codigo,w.titulo,(w.autores||[]).join(' '),w.mesa,w.sala].join(' ')).includes(q)}
function visibleBlocks(){
 const q=norm(filters.q); return (DATA.bloques||[]).filter(b=>(filters.day==='all'||String(b.dia)===String(filters.day))&&(filters.mesa==='all'||b.nombre===filters.mesa)&&(filters.modalidad==='all'||b.modalidad===filters.modalidad)&&(filters.tipo==='all'||b.tipo===filters.tipo)).map(b=>{
   const blockMatch=q&&norm([b.nombre,b.titulo,b.sede,b.horario,b.roles?.lider,b.roles?.moderador,b.roles?.apoyo].join(' ')).includes(q);
   const works=(b.works||[]).filter(w=>blockMatch||matchWork(w,q)); return {...b,works};
 }).filter(b=>b.works.length);
}
function visibleSpecials(){
 const q=norm(filters.q); return (DATA.actividadesGenerales||[]).filter(e=>(filters.day==='all'||String(e.dia)===String(filters.day))&&(!q||norm([e.actividad,e.sede,e.modalidad,e.horario].join(' ')).includes(q)));
}
function specialCompact(e){return `<article class="special-compact"><time>${esc(e.fecha)}<br>${esc(e.horario)}</time><div><b>${esc(e.actividad)}</b><span>${esc(e.sede)} · ${esc(e.modalidad)}</span></div></article>`}
function blockCard(b){
 const roles=b.roles||{}; const roleHtml=(roles.lider||roles.moderador||roles.apoyo||b.coordinadores)?`<div class="roles">${roles.lider?`<div><span>Líder de mesa</span><b>${esc(roles.lider)}</b></div>`:''}${roles.moderador?`<div><span>Moderador(a)</span><b>${esc(roles.moderador)}</b></div>`:''}${roles.apoyo?`<div><span>Apoyo</span><b>${esc(roles.apoyo)}</b></div>`:''}${b.coordinadores?`<div class="wide-role"><span>Coordinadores de carteles</span><b>${esc(b.coordinadores).replace(/\n/g,'<br>')}</b></div>`:''}</div>`:'';
 const zoom=b.modalidad==='Virtual'&&b.zoom?`<a class="zoom-link" href="${esc(b.zoom)}" target="_blank" rel="noopener">Entrar a la sesión</a>`:'';
 return `<details class="mesa-card" open><summary><div class="mesa-title"><b>${esc(b.nombre)}</b><span>${esc(b.fecha)} · ${esc(b.tipo)}</span></div><div class="mesa-facts"><b>${esc(b.horario)}</b><span>${esc(b.sede)}</span>${zoom}</div><span class="chev">⌄</span></summary>${roleHtml}<div class="mesa-works">${b.works.map(workRow).join('')}</div></details>`;
}
function workRow(w){const s=saved(w.uid);return `<article class="work-row"><time>${esc(w.horario)}</time><div><h4>${w.codigo?`<span class="work-code">${esc(w.codigo)}</span> · `:''}${esc(w.titulo)}</h4><p>${(w.autores||[]).map(esc).join('; ')}</p></div><div class="session-actions"><button class="chip-btn ${s?'saved':''}" onclick="toggle('${esc(w.uid)}')">${s?'★ Guardado':'☆ Mi Agenda'}</button><button class="chip-btn" onclick="detail('${esc(w.uid)}')">Ver detalles</button></div></article>`}

function agenda(){
 const ids=getAgenda(), selected=DATA.trabajos.filter(w=>ids.includes(w.uid));
 return `<div class="section-head"><div><div class="eyebrow">Mi Agenda</div><h1 class="section-title">Mis participaciones guardadas</h1><p class="lead">Tus selecciones se guardan únicamente en este navegador.</p></div></div>${selected.length?`<div class="agenda-list">${[1,2,3].map(d=>{const x=selected.filter(w=>w.dia===d);return x.length?`<section class="agenda-day"><b>${d===1?'23 septiembre':d===2?'24 septiembre':'25 septiembre'}</b>${x.sort((a,b)=>timeKey(a.horario)-timeKey(b.horario)).map(workRow).join('')}</section>`:''}).join('')}</div>`:`<div class="agenda-empty"><h3>Aún no has guardado participaciones</h3><p>En Programa selecciona “☆ Mi Agenda” en las actividades que quieras seguir.</p></div>`}`;
}
function constancias(){
 const q=norm(filters.q); const x=DATA.trabajos.filter(w=>matchWork(w,q));
 return `<div class="section-head"><div><div class="eyebrow">Constancias</div><h1 class="section-title">Constancias de participación</h1><p class="lead">Cada constancia corresponde a un trabajo e incluye a todos sus autores.</p></div></div><div class="notice"><b>Disponibilidad:</b><span>Las constancias estarán disponibles a partir del 28 de septiembre de 2026. No se muestran enlaces de descarga hasta que los archivos hayan sido incorporados.</span></div><div class="const-list">${x.map(w=>`<article class="const-item"><div class="code">${esc(w.codigo||w.tipo)}</div><div><h4>${esc(w.titulo)}</h4><p>${(w.autores||[]).map(esc).join('; ')}</p></div><div class="session-actions"><button class="chip-btn" onclick="detail('${esc(w.uid)}')">Ver participación</button></div></article>`).join('')}</div>`;
}
function detail(uid){const w=DATA.trabajos.find(x=>x.uid===uid);if(!w)return;const b=DATA.bloques.find(x=>x.dia===w.dia&&x.nombre===w.mesa&&x.works.some(y=>y.uid===uid));$('#dialogBody').innerHTML=`<div class="dialog-head"><div class="eyebrow">${esc(w.codigo||w.tipo)} · ${esc(w.modalidad)}</div><h2>${esc(w.titulo)}</h2></div><div class="dialog-content"><p><b>Autores:</b> ${(w.autores||[]).map(esc).join('; ')}</p><p><b>Fecha:</b> ${esc(w.diaTexto)} · ${esc(w.horario)}<br><b>Mesa / bloque:</b> ${esc(w.mesa)}<br><b>Sede:</b> ${esc(w.sala)}<br><b>Modalidad:</b> ${esc(w.modalidad)}</p>${b&&b.modalidad==='Virtual'&&b.zoom?`<p><a class="zoom-link" href="${esc(b.zoom)}" target="_blank" rel="noopener">Entrar a la sesión</a></p>`:''}</div>`;$('#dialog').showModal()}
function timeKey(v=''){const m=String(v).match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):9999}
function getAgenda(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function saved(c){return getAgenda().includes(c)}
function toggle(c){const s=new Set(getAgenda());s.has(c)?s.delete(c):s.add(c);localStorage.setItem(KEY,JSON.stringify([...s]));render()}
function updateCount(){const e=$('#agendaCount');if(e)e.textContent=getAgenda().length?`(${getAgenda().length})`:''}
function countdown(){function tick(){const e=$('#countdown');if(!e)return;let d=Math.max(0,new Date('2026-09-23T10:00:00-06:00')-Date.now());const vals=[['Días',Math.floor(d/86400000)],['Horas',Math.floor(d%86400000/3600000)],['Min',Math.floor(d%3600000/60000)],['Seg',Math.floor(d%60000/1000)]];e.innerHTML=vals.map(v=>`<div><b>${String(v[1]).padStart(2,'0')}</b><span>${v[0]}</span></div>`).join('')}tick();setInterval(tick,1000)}
boot();
