const $=s=>document.querySelector(s);
let DATA={evento:{},trabajos:[],mesas:[],programaGeneral:[]},view='inicio';
let filters={q:'',day:'all',mesa:'all',modalidad:'all'};
const KEY='iceaAgenda2026';
const colors={'Mesa 1':'#78001f','Mesa 2':'#174f86','Mesa 3':'#0f7f78','Mesa 4':'#c8102e','Mesa 5':'#a76400'};

async function boot(){
 try{
   const r=await fetch('data/programa.json?v=20260901c',{cache:'no-store'});
   if(!r.ok) throw new Error('HTTP '+r.status);
   DATA=await r.json();
   if(!Array.isArray(DATA.trabajos)) throw new Error('La base no contiene trabajos');
   if(!Array.isArray(DATA.mesas)||!DATA.mesas.length){
     DATA.mesas=[...new Set(DATA.trabajos.map(x=>x.mesa).filter(Boolean))].sort().map(c=>({codigo:c,nombre:''}));
   }
   bind(); render(); countdown();
 }catch(e){
   console.error(e);
   $('#app').innerHTML=`<div class="error"><b>No se pudo cargar el programa.</b><br>${e.message}</div>`;
 }
}
function bind(){
 document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>go(b.dataset.view));
 $('#menuBtn').onclick=()=>{$('#sidebar').classList.add('open');$('#overlay').classList.add('show')};
 $('#overlay').onclick=()=>{$('#sidebar').classList.remove('open');$('#overlay').classList.remove('show')};
 $('#closeDialog').onclick=()=>$('#dialog').close();
 $('#globalSearch').oninput=e=>{filters.q=e.target.value;view='programa';render()};
}
function go(v){view=v;document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v));$('#sidebar').classList.remove('open');$('#overlay').classList.remove('show');render();scrollTo(0,0)}
function render(){
 const a=$('#app');
 if(view==='inicio')a.innerHTML=inicio();
 else if(view==='programa')a.innerHTML=programa();
 else if(view==='agenda')a.innerHTML=agenda();
 else if(view==='eventos')a.innerHTML=eventos();
 else if(view==='carteles')a.innerHTML=carteles();
 else if(view==='constancias')a.innerHTML=constancias();
 else a.innerHTML=info();
 updateCount();
}
function inicio(){
 const t=DATA.evento.totales||{};
 return `<section class="hero"><div class="kicker">Plataforma oficial</div><h1>11° Congreso Internacional ICEA 2026</h1><p>Programa académico, eventos destacados, carteles, constancias y orientación para asistentes en una sola plataforma.</p><div class="actions"><button class="btn primary" onclick="go('programa')">Ver programa</button><button class="btn" onclick="go('eventos')">Eventos destacados</button></div></section>
 <section class="stats"><div class="stat"><div id="countdown" class="countdown"></div></div><div class="stat"><b>${t.trabajos||DATA.trabajos.length}</b><span>Trabajos</span></div><div class="stat"><b>${t.mesas||5}</b><span>Mesas</span></div><div class="stat"><b>${t.ponencias||0}</b><span>Ponencias</span></div><div class="stat"><b>${t.carteles||0}</b><span>Carteles</span></div></section>
 <div class="section-kicker">Eventos destacados</div><h2 class="section-title">Momentos centrales del Congreso</h2><p class="lead">El cronograma general permanece visible y el programa académico puede consultarse por día, mesa y modalidad.</p>${eventCards((DATA.programaGeneral||[]).filter(e=>/inauguración|panel|conferencia|foro|reunión|clausura|brindis/i.test(e.actividad)))}
 <div style="margin-top:28px" class="section-kicker">Cronograma</div><h2 class="section-title">Programa general</h2>${schedule(DATA.programaGeneral||[])}`;
}
function header(title,lead){
 return `<div class="section-kicker">Programa académico</div><h1 class="section-title">${title}</h1><p class="lead">${lead}</p>
 <div class="tabs">${[['all','Todos'],['1','Miércoles 23'],['2','Jueves 24'],['3','Viernes 25']].map(x=>`<button class="tab ${filters.day===x[0]?'active':''}" onclick="filters.day='${x[0]}';render()">${x[1]}</button>`).join('')}</div>
 <div class="toolbar"><input value="${esc(filters.q)}" placeholder="Título, autor, código…" oninput="filters.q=this.value;render()"><select onchange="filters.mesa=this.value;render()"><option value="all">Todas las mesas</option>${DATA.mesas.map(m=>`<option ${filters.mesa===m.codigo?'selected':''}>${m.codigo}</option>`).join('')}</select><select onchange="filters.modalidad=this.value;render()"><option value="all">Todas las modalidades</option><option ${filters.modalidad==='Presencial'?'selected':''}>Presencial</option><option ${filters.modalidad==='Virtual'?'selected':''}>Virtual</option></select></div>`;
}
function filtered(type){
 const q=filters.q.toLowerCase().trim();
 return DATA.trabajos.filter(t=>(!type||t.tipo===type)&&(filters.day==='all'||String(t.dia)===filters.day)&&(filters.mesa==='all'||t.mesa===filters.mesa)&&(filters.modalidad==='all'||t.modalidad===filters.modalidad)&&(!q||[t.codigo,t.titulo,(t.autores||[]).join(' '),t.mesa,t.sala].join(' ').toLowerCase().includes(q)));
}
function cards(items){return items.length?`<div class="grid">${items.map(card).join('')}</div>`:`<div class="empty">No hay resultados con esos filtros.</div>`}
function card(t){const s=saved(t.codigo);return `<article class="card" style="--mesa:${colors[t.mesa]||'#c8102e'}"><div class="meta">${t.codigo} · ${t.tipo} · ${t.modalidad}</div><h3>${t.titulo}</h3><p><b>${(t.autores||[]).join('; ')}</b><br>${t.diaTexto} · ${t.horario}<br>${t.mesa} · ${t.sala||''}</p><div class="actions"><button class="small ${s?'saved':''}" onclick="toggle('${t.codigo}')">${s?'★ Guardado':'☆ Mi Agenda'}</button><button class="small" onclick="detail('${t.codigo}')">${t.semblanza?'Información y semblanza':'Ver detalles'}</button>${t.tipo==='Cartel'?`<button class="small" onclick="openPdf('carteles/${t.codigo}.pdf','El cartel todavía no ha sido cargado.')">Ver cartel</button>`:''}</div></article>`}
function programa(){return header('Consulta por día, mesa o autor','La base corresponde al programa final del 31 de agosto de 2026.')+cards(filtered())}
function carteles(){return header('Carteles académicos','Consulta los carteles presenciales y virtuales del Congreso.')+cards(filtered('Cartel'))}
function agenda(){const ids=getAgenda();const x=DATA.trabajos.filter(t=>ids.includes(t.codigo));return `<div class="section-kicker">Mi Agenda</div><h1 class="section-title">Actividades guardadas</h1><p class="lead">Tu selección se guarda únicamente en este navegador.</p>${cards(x)}`}
function eventos(){return `<div class="section-kicker">Eventos destacados</div><h1 class="section-title">Programa general</h1><p class="lead">Inauguración, paneles, conferencia, foro, reunión, clausura y brindis.</p>${eventCards(DATA.programaGeneral||[])}`}
function eventCards(items){return `<div class="event-grid">${items.map(e=>`<article class="event"><div><div class="kicker">${e.fecha||''}</div><h3>${e.actividad}</h3><p>${e.ubicacion||''}</p></div><b>${e.horario||''}</b></article>`).join('')}</div>`}
function schedule(items){return `<div>${items.map(e=>`<div class="agenda-row"><time>${e.fecha}<br>${e.horario||''}</time><div><b>${e.actividad}</b><span>${e.ubicacion||''}</span></div></div>`).join('')}</div>`}
function constancias(){
 const q=filters.q.toLowerCase().trim(), x=DATA.trabajos.filter(t=>!q||[t.codigo,t.titulo,(t.autores||[]).join(' ')].join(' ').toLowerCase().includes(q));
 return `<div class="section-kicker">Constancias</div><h1 class="section-title">Busca tu participación</h1><p class="lead">Localiza tu trabajo por nombre, título o código. Cuando el PDF esté incorporado podrás abrirlo desde aquí.</p><div class="toolbar"><input value="${esc(filters.q)}" placeholder="Nombre, título o código…" oninput="filters.q=this.value;render()"></div>${x.length?`<div class="grid">${x.map(t=>`<article class="card" style="--mesa:${colors[t.mesa]||'#c8102e'}"><div class="meta">${t.codigo} · ${t.tipo}</div><h3>${t.titulo}</h3><p><b>${(t.autores||[]).join('; ')}</b><br>${t.diaTexto} · ${t.mesa}</p><div class="actions"><button class="small" onclick="detail('${t.codigo}')">Ver participación</button><button class="small" onclick="openConstancia('${t.codigo}','${t.tipo}')">Consultar constancia</button></div></article>`).join('')}</div>`:`<div class="empty">No encontramos una participación con esos datos.</div>`}`;
}
function info(){return `<div class="section-kicker">Información</div><h1 class="section-title">Sede y orientación</h1><div class="info"><div class="panel"><h2>ICEA · UAEH</h2><img class="info-photo" src="assets/images/acceso-icea.jpeg" alt="Acceso ICEA"><p>Instituto de Ciencias Económico-Administrativas. San Agustín Tlaxiaca, Hidalgo.</p><p><b>Fechas:</b> 23, 24 y 25 de septiembre de 2026.<br><b>Modalidad:</b> híbrida.</p></div><div class="panel"><h2>Croquis de la sede</h2><img class="map-img" src="assets/images/croquis-icea.png" alt="Croquis ICEA"><p>Consulta el programa para identificar edificio, piso y sala de cada participación.</p></div></div>`}
function detail(code){const t=DATA.trabajos.find(x=>x.codigo===code);if(!t)return;$('#dialogBody').innerHTML=`<div class="dialog-body"><div class="dialog-head"><div class="kicker">${t.codigo} · ${t.tipo}</div><h2>${t.titulo}</h2></div><p><b>Autores:</b> ${(t.autores||[]).join('; ')}</p><p><b>Fecha:</b> ${t.diaTexto} · ${t.horario}<br><b>Mesa:</b> ${t.mesa} · ${t.mesaNombre||''}<br><b>Sede:</b> ${t.sala||''}<br><b>Modalidad:</b> ${t.modalidad}</p>${t.semblanza?`<div class="bio-box"><div class="section-kicker">Semblanza</div><p>${t.semblanza}</p></div>`:''}</div>`;$('#dialog').showModal()}
async function openPdf(path,pending){try{const r=await fetch(path,{method:'HEAD',cache:'no-store'});if(!r.ok)throw Error();window.open(path,'_blank')}catch{$('#dialogBody').innerHTML=`<div class="dialog-body"><h2>Archivo pendiente</h2><p>${pending}</p></div>`;$('#dialog').showModal()}}
function openConstancia(code,tipo){const folder=tipo==='Cartel'?'carteles':'ponencias';openPdf(`constancias/${folder}/${code}.pdf`,'La constancia todavía no ha sido incorporada al sitio.')}
function getAgenda(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function saved(c){return getAgenda().includes(c)}
function toggle(c){const s=new Set(getAgenda());s.has(c)?s.delete(c):s.add(c);localStorage.setItem(KEY,JSON.stringify([...s]));render()}
function updateCount(){const e=$('#agendaCount');if(e)e.textContent=getAgenda().length?`(${getAgenda().length})`:''}
function countdown(){function tick(){const e=$('#countdown');if(!e)return;let d=Math.max(0,new Date('2026-09-23T10:00:00-06:00')-Date.now());const vals=[['Días',Math.floor(d/86400000)],['Horas',Math.floor(d%86400000/3600000)],['Min',Math.floor(d%3600000/60000)],['Seg',Math.floor(d%60000/1000)]];e.innerHTML=vals.map(v=>`<div><b>${String(v[1]).padStart(2,'0')}</b><span>${v[0]}</span></div>`).join('')}tick();setInterval(tick,1000)}
function esc(s=''){return String(s).replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
boot();