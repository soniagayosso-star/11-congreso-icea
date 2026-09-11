const $=s=>document.querySelector(s);
let DATA={evento:{},trabajos:[],mesas:[],programaGeneral:[]},view='inicio';
let filters={q:'',day:'1',mesa:'all',modalidad:'all',tipo:'all'};
const KEY='iceaAgenda2026';
const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const OPS={
 '1|Mesa 1':['Dr. Martín Aubert Hernández Calzada','Dr. Martín Aubert Hernández Calzada','Dra. Jessica Mendoza Moheno'],
 '1|Mesa 2':['Dra. Angélica María Vázquez Rojas / Dra. Judith Alejandra Velázquez Castro','Dra. Brenda Midhely García Ortiz','Dr. Oscar González Ruiz'],
 '1|Mesa 3':['Dra. Brenda Midhely García Ortiz / Dr. Zeus Salvador Hernández Veleros','Dra. Diana Xóchitl González Gómez','Dra. Liza Viviana Velasco Álvarez'],
 '1|Mesa 4':['Dra. María Aline Manzo Martínez','Dra. Lizet Manzo Martínez','—'],
 '1|Mesa 5':['Dr. Enrique Guardado Ibarra / Dra. Yolanda Sánchez Torres','Dra. Yolanda Sánchez Torres','Dra. Ruth Ortiz Zarco'],
 '1|Bloque virtual':['—','Dra. Karina Valencia Sandoval','Dra. Aide Maricel Carrizal Alonso'],
 '2|Mesa 1':['Dr. Martín Aubert Hernández Calzada','Dra. Blanca Cecilia Salazar Hernández','Dra. Karina Valencia Sandoval'],
 '2|Mesa 3':['Dra. Brenda Midhely García Ortiz / Dr. Zeus Salvador Hernández Veleros','Dra. Angélica María Vázquez Rojas','Dra. Liza Viviana Velasco Álvarez'],
 '2|Mesa 4':['Dra. María Aline Manzo Martínez','Dra. Nancy Testón Franco','—'],
 '2|Mesa 5':['Dr. Enrique Guardado Ibarra / Dra. Yolanda Sánchez Torres','Dr. Enrique Guardado Ibarra','Dr. Mario Cruz Cruz'],
 '2|Bloque virtual':['—','Dr. Elías Gaona Rivera','Dra. Aide Maricel Carrizal Alonso'],
 '3|Mesa 1':['Dr. Martín Aubert Hernández Calzada','Dra. Jessica Mendoza Moheno','Dra. Karina Valencia Sandoval'],
 '3|Mesa 3':['Dra. Brenda Midhely García Ortiz / Dr. Zeus Salvador Hernández Veleros','Dr. Pedro Alfonso Ramos Sánchez','Dr. Carlos Antonio Rosas Candelas'],
 '3|Mesa 4':['Dra. María Aline Manzo Martínez','Dr. Carlos Antonio Rosas Candelas','—'],
 '3|Bloque virtual':['—','Dra. Judith Alejandra Velázquez Castro','Dra. Aide Maricel Carrizal Alonso']
};

async function boot(){
 try{
  const v='20260910-mesas-final';
  const req=[fetch(`data/meta-20260907.json?v=${v}`,{cache:'no-store'}),...Array.from({length:6},(_,i)=>fetch(`data/works-20260907-${i+1}.json?v=${v}`,{cache:'no-store'})),fetch(`data.json?v=${v}`,{cache:'no-store'}).catch(()=>null)];
  const res=await Promise.all(req); if(!res[0].ok)throw Error('No se pudo cargar el programa final');
  const meta=await res[0].json(); const chunks=await Promise.all(res.slice(1,7).map(async r=>{if(!r.ok)throw Error('No se pudo cargar una parte del programa');return r.json()}));
  DATA={...meta,trabajos:chunks.flat()};
  // Corrección nominal fija solicitada: nunca mostrar esta autora en versales.
  DATA.trabajos.forEach(t=>t.autores=(t.autores||[]).map(a=>norm(a)==='veronica ocadiz amador'?'Verónica Ocadiz Amador':a));
  if(res[7]&&res[7].ok){const old=await res[7].json();const bios=new Map((old.works||[]).filter(x=>x.bio).map(x=>[norm(x.title),x.bio]));DATA.trabajos.forEach(t=>{if(!t.semblanza&&bios.has(norm(t.titulo)))t.semblanza=bios.get(norm(t.titulo));});}
  bind();render();countdown();
 }catch(e){console.error(e);$('#app').innerHTML=`<div class="error"><b>No se pudo cargar el programa.</b><br>${esc(e.message)}</div>`}
}
function bind(){document.querySelectorAll('.nav').forEach(b=>b.onclick=()=>go(b.dataset.view));$('#menuBtn').onclick=()=>{$('#sidebar').classList.add('open');$('#overlay').classList.add('show')};$('#overlay').onclick=closeMenu;$('#closeDialog').onclick=()=>$('#dialog').close();$('#globalSearch').oninput=e=>{filters.q=e.target.value;view='programa';render();setNav('programa')}}
function closeMenu(){$('#sidebar').classList.remove('open');$('#overlay').classList.remove('show')}
function setNav(v){document.querySelectorAll('.nav').forEach(b=>b.classList.toggle('active',b.dataset.view===v))}
function go(v){view=v;setNav(v);closeMenu();render();scrollTo({top:0,behavior:'smooth'})}
function render(){const a=$('#app');if(view==='inicio')a.innerHTML=inicio();else if(view==='programa')a.innerHTML=programa();else if(view==='agenda')a.innerHTML=agenda();else a.innerHTML=constancias();updateCount()}

function inicio(){
 const t=DATA.evento.totales||{}; const hi=highlights().slice(0,6);
 return `<section class="hero"><img class="hero-logo" src="assets/logos/logo-congreso.png" alt="11° Congreso Internacional"><div class="hero-actions"><button onclick="go('programa')">Programa completo</button><button class="secondary" onclick="filters.day='1';go('programa')">23 de septiembre</button><button class="secondary" onclick="filters.day='2';go('programa')">24 de septiembre</button><button class="secondary" onclick="filters.day='3';go('programa')">25 de septiembre</button></div></section>
 <section class="intro-strip"><div class="metric"><div id="countdown" class="countdown"></div></div><div class="metric"><b>${t.trabajos||DATA.trabajos.length}</b><span>Trabajos</span></div><div class="metric"><b>${t.ponencias||DATA.trabajos.filter(x=>x.tipo==='Ponencia').length}</b><span>Ponencias</span></div><div class="metric"><b>${t.carteles||DATA.trabajos.filter(x=>x.tipo==='Cartel').length}</b><span>Carteles</span></div></section>
 <div class="section-head"><div><div class="eyebrow">Imperdibles</div><h2 class="section-title">Momentos centrales del Congreso</h2><p class="lead">Actividades generales y encuentros especiales de los tres días.</p></div><button class="text-link" onclick="go('programa')">Ver programa →</button></div>
 <section class="highlights">${hi.map(highlightCard).join('')}</section>
 <section class="home-map"><div class="home-map-copy"><div class="eyebrow">Ubícate en ICEA</div><h2>Croquis de la sede</h2><p>Consulta los edificios y espacios del Congreso antes de dirigirte a tu mesa.</p></div><img src="assets/images/croquis-icea.png" alt="Croquis de sedes ICEA"></section>`;
}
function highlights(){return (DATA.programaGeneral||[]).filter(e=>/inaugur|conferencia magistral|foro de expertos|foro de turismo|clausura|encuentro de cierre|expo empresarial|reunión anual/i.test(e.actividad||''))}
function specialLocation(e){const a=norm(e.actividad);if(/inaugur|conferencia magistral|foro de expertos|foro de turismo|clausura/.test(a))return 'Presencial · Audiovisual 2 “Carlos Sepúlveda Álvarez”';if(a.includes('expo empresarial'))return 'Presencial · Planta Baja de la Biblioteca';if(a.includes('encuentro de cierre'))return 'Presencial · Terraza de Gastronomía';return e.ubicacion||''}
function highlightCard(e){return `<article class="highlight"><time>${esc(e.fecha||'')} · ${esc(e.horario||'')}</time><h3>${esc(e.actividad||'')}</h3><p>${esc(specialLocation(e))}</p></article>`}

function programa(){
 const day=String(filters.day||'1'),items=filtered(),specials=specialsForDay(day);
 return `<div class="section-head"><div><div class="eyebrow">Programa académico</div><h1 class="section-title">Programa por mesa</h1><p class="lead">Cada mesa conserva su horario, sede, moderación y apoyo. Abre únicamente la mesa que necesitas consultar.</p></div></div>
 ${dayTabs()}
 <div class="notice"><b>Sesiones virtuales</b><span>Los enlaces de acceso estarán disponibles a partir del 23 de septiembre de 2026.</span></div>
 <div class="filters simple"><input value="${esc(filters.q)}" placeholder="Buscar título, autor o palabra clave…" oninput="filters.q=this.value;render()"><select onchange="filters.mesa=this.value;render()"><option value="all">Todas las mesas / bloques</option>${DATA.mesas.map(m=>`<option value="${esc(m.codigo)}" ${filters.mesa===m.codigo?'selected':''}>${esc(m.codigo)}</option>`).join('')}</select><select onchange="filters.modalidad=this.value;render()"><option value="all">Todas las modalidades</option><option ${filters.modalidad==='Presencial'?'selected':''}>Presencial</option><option ${filters.modalidad==='Virtual'?'selected':''}>Virtual</option></select></div>
 ${specials.length?`<section class="day-specials">${specials.map(specialCompact).join('')}</section>`:''}
 ${mesaBlocks(day,items)}`;
}
function dayTabs(){return `<div class="day-tabs">${[['1','Miércoles','23 septiembre'],['2','Jueves','24 septiembre'],['3','Viernes','25 septiembre']].map(d=>`<button class="day-tab ${filters.day===d[0]?'active':''}" onclick="filters.day='${d[0]}';render()"><span>${d[1]}</span><b>${d[2]}</b></button>`).join('')}</div>`}
function filtered(){const q=norm(filters.q);return DATA.trabajos.filter(t=>String(t.dia)===String(filters.day)&&(filters.mesa==='all'||t.mesa===filters.mesa)&&(filters.modalidad==='all'||t.modalidad===filters.modalidad)&&(!q||norm([t.codigo,t.titulo,(t.autores||[]).join(' '),t.mesa,t.sala].join(' ')).includes(q)))}
function specialsForDay(day){if(norm(filters.q))return [];const token=day==='1'?'23 septiembre':day==='2'?'24 septiembre':'25 septiembre';return (DATA.programaGeneral||[]).filter(e=>norm(e.fecha).includes(norm(token))&&/inaugur|conferencia magistral|foro de expertos|foro de turismo|expo empresarial|reunión anual|clausura|encuentro de cierre/i.test(e.actividad||''))}
function specialCompact(e){return `<article class="special-compact"><time>${esc(e.horario||'')}</time><div><b>${esc(e.actividad||'')}</b><span>${esc(specialLocation(e))}</span></div></article>`}
function timeKey(v=''){const m=String(v).match(/(\d{1,2}):(\d{2})/);return m?Number(m[1])*60+Number(m[2]):9999}
function mesaOrder(m){return {'Mesa 1':1,'Mesa 2':2,'Mesa 3':3,'Mesa 4':4,'Mesa 5':5,'Bloque virtual':6,'Sesión de carteles':7,'Bloque virtual de carteles':8}[m]||99}
function mesaBlocks(day,items){
 if(!items.length)return `<div class="empty">No hay resultados con esos filtros.</div>`;
 const groups={};items.forEach(t=>(groups[t.mesa]??=[]).push(t));
 return `<div class="mesa-stack">${Object.entries(groups).sort((a,b)=>mesaOrder(a[0])-mesaOrder(b[0])).map(([mesa,works],idx)=>mesaBlock(day,mesa,works,idx===0)).join('')}</div>`;
}
function mesaBlock(day,mesa,works,open){
 works.sort((a,b)=>timeKey(a.horario)-timeKey(b.horario)); const first=works[0],op=OPS[`${day}|${mesa}`]||null;
 const start=works[0]?.horario?.split('–')[0]||'', end=works[works.length-1]?.horario?.split('–')[1]||''; const span=start&&end?`${start}–${end}`:(first.horario||'');
 const title=first.mesaNombre&&first.mesaNombre!==mesa?first.mesaNombre:mesa;
 return `<details class="mesa-card" ${open?'open':''}><summary><div class="mesa-title"><b>${esc(mesa)}</b><span>${esc(title.replace(/^Mesa \d+\.\s*/,''))}</span></div><div class="mesa-facts"><b>${esc(span)}</b><span>${esc(first.modalidad)}</span><span>${esc(first.sala||'')}</span></div><span class="chev">⌄</span></summary>
 ${op?`<div class="roles"><div><span>Líder de mesa</span><b>${esc(op[0])}</b></div><div><span>Moderador/a</span><b>${esc(op[1])}</b></div><div><span>Apoyo</span><b>${esc(op[2])}</b></div></div>`:''}
 <div class="mesa-works">${works.map(workRow).join('')}</div></details>`;
}
function workRow(t){const s=saved(t.codigo);return `<article class="work-row"><time>${esc(t.horario)}</time><div><h4>${esc(t.titulo)}</h4><p>${(t.autores||[]).map(esc).join('; ')}</p></div><div class="session-actions"><button class="chip-btn ${s?'saved':''}" onclick="event.preventDefault();toggle('${esc(t.codigo)}')">${s?'★ Guardado':'☆ Mi Agenda'}</button><button class="chip-btn" onclick="event.preventDefault();detail('${esc(t.codigo)}')">${t.semblanza?'Detalles + semblanza':'Ver detalles'}</button></div></article>`}

function agenda(){const ids=getAgenda(),x=DATA.trabajos.filter(t=>ids.includes(t.codigo));return `<div class="section-head"><div><div class="eyebrow">Mi Agenda</div><h1 class="section-title">Lo que no quieres perderte</h1><p class="lead">Tus selecciones se guardan únicamente en este navegador.</p></div></div>${x.length?`<div class="agenda-list">${x.sort((a,b)=>a.dia-b.dia||timeKey(a.horario)-timeKey(b.horario)).map(t=>`<div class="agenda-day"><b>${esc(t.diaTexto)} · ${esc(t.horario)} · ${esc(t.mesa)}</b>${workRow(t)}</div>`).join('')}</div>`:`<div class="agenda-empty"><h3>Aún no has guardado actividades</h3><p>En Programa selecciona “☆ Mi Agenda” en las participaciones que quieras seguir.</p><button class="text-link" onclick="go('programa')">Explorar programa →</button></div>`}`}
function constancias(){const q=norm(filters.q),x=DATA.trabajos.filter(t=>!q||norm([t.codigo,t.titulo,(t.autores||[]).join(' ')].join(' ')).includes(q));return `<div class="section-head"><div><div class="eyebrow">Constancias</div><h1 class="section-title">Encuentra tu participación</h1><p class="lead">Busca por nombre, título o código.</p></div></div><div class="notice"><b>Disponibilidad</b><span>Las constancias podrán consultarse y descargarse a partir del 28 de septiembre de 2026.</span></div><div class="const-search"><input value="${esc(filters.q)}" placeholder="Nombre, título o código…" oninput="filters.q=this.value;render()"></div><div class="const-list">${x.slice(0,80).map(t=>`<article class="const-item"><div class="code">${esc(t.codigo)}<br>${esc(t.tipo)}</div><div><h4>${esc(t.titulo)}</h4><p>${(t.autores||[]).map(esc).join('; ')}</p></div><div class="session-actions"><button class="chip-btn" onclick="detail('${esc(t.codigo)}')">Ver participación</button><button class="chip-btn" onclick="openConstancia('${esc(t.codigo)}','${esc(t.tipo)}')">Constancia</button></div></article>`).join('')}</div>`}
function detail(code){const t=DATA.trabajos.find(x=>x.codigo===code);if(!t)return;$('#dialogBody').innerHTML=`<div class="dialog-head"><div class="eyebrow">${esc(t.codigo)} · ${esc(t.tipo)}</div><h2>${esc(t.titulo)}</h2></div><div class="dialog-content"><p><b>Autores:</b> ${(t.autores||[]).map(esc).join('; ')}</p><p><b>Fecha:</b> ${esc(t.diaTexto)} · ${esc(t.horario)}<br><b>Mesa / bloque:</b> ${esc(t.mesa)}<br><b>Sede:</b> ${esc(t.sala||'')}<br><b>Modalidad:</b> ${esc(t.modalidad)}</p>${t.semblanza?`<div class="bio-box"><div class="eyebrow">Semblanza</div><p>${esc(t.semblanza)}</p></div>`:''}</div>`;$('#dialog').showModal()}
async function openPdf(path,pending){try{const r=await fetch(path,{method:'HEAD',cache:'no-store'});if(!r.ok)throw Error();window.open(path,'_blank')}catch{$('#dialogBody').innerHTML=`<div class="dialog-head"><div class="eyebrow">Archivo</div><h2>Pendiente de incorporar</h2></div><div class="dialog-content"><p>${esc(pending)}</p></div>`;$('#dialog').showModal()}}
function openConstancia(code,tipo){const available=new Date('2026-09-28T00:00:00-06:00');if(Date.now()<available.getTime()){$('#dialogBody').innerHTML=`<div class="dialog-head"><div class="eyebrow">Constancias</div><h2>Disponibles a partir del 28 de septiembre</h2></div><div class="dialog-content"><p>Las constancias podrán consultarse y descargarse en este sitio a partir del 28 de septiembre de 2026.</p></div>`;$('#dialog').showModal();return}const folder=tipo==='Cartel'?'carteles':'ponencias';openPdf(`constancias/${folder}/${code}.pdf`,'La constancia todavía no ha sido incorporada al sitio.')}
function getAgenda(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function saved(c){return getAgenda().includes(c)}
function toggle(c){const s=new Set(getAgenda());s.has(c)?s.delete(c):s.add(c);localStorage.setItem(KEY,JSON.stringify([...s]));render()}
function updateCount(){const e=$('#agendaCount');if(e)e.textContent=getAgenda().length?`(${getAgenda().length})`:''}
function countdown(){function tick(){const e=$('#countdown');if(!e)return;let d=Math.max(0,new Date('2026-09-23T10:00:00-06:00')-Date.now());const vals=[['Días',Math.floor(d/86400000)],['Horas',Math.floor(d%86400000/3600000)],['Min',Math.floor(d%3600000/60000)],['Seg',Math.floor(d%60000/1000)]];e.innerHTML=vals.map(v=>`<div><b>${String(v[1]).padStart(2,'0')}</b><span>${v[0]}</span></div>`).join('')}tick();setInterval(tick,1000)}
function esc(s=''){return String(s).replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
boot();
