/* Nexo — interfaz. JavaScript sin frameworks y sin proceso de compilación. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const API = window.NexoData;
  const ICONS = {
    board: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 4v16"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>', chevron: '<path d="m8 10 4 4 4-4"/>',
    check: '<path d="m5 12 4 4L19 6"/>', logout: '<path d="M9 4H4v16h5m5-4 4-4-4-4M8 12h12"/>',
    download: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/>', calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>', play: '<path d="m8 5 12 7-12 7z"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>',
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-2l2 3M4 16l2 3a7 7 0 0 0 12-2"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    pencil: '<path d="m15 4 5 5M4 20l5-1L20 8a2 2 0 0 0-5-5L4 14z"/>',
    trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    folder: '<path d="M3 7V5a2 2 0 0 1 2-2h4l3 4h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9 9a3 3 0 1 1 5 2c-2 1-2 2-2 3M12 17h.01"/>',
    briefcase: '<rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V3h8v4M3 12a20 20 0 0 0 18 0M10 12h4"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
    chart: '<path d="M4 4v16h16M8 16v-4M12 16V8M16 16V5"/>',
    flag: '<path d="M5 21V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0"/>',
    spark: '<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/>',
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.info}</svg>`;
  $$('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });

  // Toda cadena procedente de usuarios se escapa antes de insertarse en HTML.
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => API.uuid();
  const dayKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const today = () => dayKey();
  const monthStart = () => { const d = new Date(); d.setDate(1); return dayKey(d); };
  const weekStart = () => { const d = new Date(); d.setDate(d.getDate() - (d.getDay()+6)%7); return dayKey(d); };
  const fmtDate = (key, long = false) => key ? new Date(`${key}T12:00:00`).toLocaleDateString('es-ES',{day:'numeric',month:long?'long':'short'}) : 'Sin fecha';
  const duration = minutes => { const m = Math.round(Number(minutes) || 0); return m >= 60 ? `${Math.floor(m/60)} h${m%60 ? ` ${m%60} min` : ''}` : `${m} min`; };
  const hoursNumber = minutes => new Intl.NumberFormat('es-ES',{maximumFractionDigits:2}).format((Number(minutes)||0)/60);
  const sumMinutes = entries => entries.reduce((sum, entry) => sum + Number(entry.minutes || 0), 0);
  const STATUSES = [{id:'todo',name:'Por hacer'},{id:'doing',name:'En curso'},{id:'review',name:'En revisión'},{id:'done',name:'Hecho'}];
  const PRIORITIES = {high:'Alta',medium:'Media',low:'Baja'};
  const state = {mode:'demo',user:null,profiles:[],tasks:[],entries:[],invitations:[],view:'board',query:'',member:'all',project:'all',mine:false,hours:{from:monthStart(),to:today(),member:'all',task:'all'},page:1,lastSync:null,timer:null};
  let authMode = 'login';
  let unsubscribe = null;
  let reloadPromise = null;
  let dragId = null;
  let lastFocus = null;
  const content = $('#view-content');
  const dialog = $('#main-dialog');
  const activeProfiles = () => state.profiles.filter(p => p.active !== false);
  const profile = id => state.profiles.find(p => p.id === id);
  const task = id => state.tasks.find(t => t.id === id);
  const isAdmin = () => state.user?.role === 'admin';
  const taskMinutes = id => sumMinutes(state.entries.filter(e => e.task_id === id));
  function avatar(person, small = false) {
    const name = person?.name || 'Sin asignar';
    return `<span class="avatar${small ? ' small-avatar' : ''}" title="${esc(name)}" aria-label="${esc(name)}">${esc(name.split(/\s+/).slice(0,2).map(n=>n[0]).join('').toUpperCase())}</span>`;
  }
  function toast(message, error = false) {
    const el = document.createElement('div');
    el.className = `toast${error?' error':''}`;
    el.innerHTML = `${icon(error?'info':'check')}<span>${esc(message)}</span>`;
    $('#toast-region').append(el);
    setTimeout(() => el.remove(), error?7500:4200);
  }
  function showError(el, error) { el.textContent = error.message || String(error); el.hidden = false; }
  function clearAuthMessages() { $('#auth-error').hidden = true; $('#auth-info').hidden = true; }
  function showAuthInfo(message) { $('#auth-info').textContent = message; $('#auth-info').hidden = false; }
  function stat(label, value, note) {
    return `<div class="stat-card"><div class="stat-top"><span class="stat-label">${esc(label)}</span></div><div class="stat-value">${esc(value)}</div><span class="stat-note">${esc(note)}</span></div>`;
  }
  function option(value, label, selected) { return `<option value="${esc(value)}"${value===selected?' selected':''}>${esc(label)}</option>`; }
  function memberOptions(selected, all = true, includeInactive = false) {
    return (all?option('all','Todas las personas',selected):'') + (includeInactive?state.profiles:activeProfiles()).map(p=>option(p.id,`${p.name}${p.active===false?' (inactivo)':''}`,selected)).join('');
  }
  function heading(overline, title, subtitle, actions) {
    return `<div class="page-heading"><div class="heading-copy"><p class="overline">${esc(overline)}</p><h1>${esc(title)}</h1><p class="subtitle">${esc(subtitle)}</p></div><div class="page-actions">${actions}</div></div>`;
  }
  const addTaskButton = '<button class="btn btn-primary" data-action="new-task">' + icon('plus') + 'Nuevo asunto</button>';
  const addTimeButton = '<button class="btn btn-secondary" data-action="new-entry">' + icon('clock') + 'Registrar horas</button>';

  function renderShell() {
    $('#auth-view').hidden = true;
    $('#app-view').hidden = false;
    $('#demo-banner').hidden = state.mode !== 'demo';
    $('#mode-label').textContent = state.mode === 'demo' ? 'Demostración local' : 'Espacio compartido';
    $('#mode-dot').classList.toggle('online', state.mode !== 'demo');
    $('#current-user-name').textContent = state.user.name;
    $('#current-user-role').textContent = isAdmin()?'Administración':'Miembro';
    $('#sidebar-avatar').innerHTML = avatar(state.user);
    $('#topbar-avatars').innerHTML = activeProfiles().slice(0,4).map(p=>avatar(p,true)).join('');
    $('#nav-task-count').textContent = state.tasks.filter(t=>t.status!=='done').length;
    $('#nav-team-count').textContent = activeProfiles().length;
    $('#topbar-date').textContent = new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long'});
    $('#sync-label').textContent = state.mode === 'demo' ? 'Solo en este navegador' : state.lastSync ? `Actualizado ${state.lastSync.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}` : 'Conectando…';
    $$('[data-view]').forEach(el => { el.classList.toggle('active',el.dataset.view===state.view); if(el.dataset.view===state.view) el.setAttribute('aria-current','page'); else el.removeAttribute('aria-current'); });
    $('#current-view-name').textContent = {board:'Asuntos',hours:'Horas',team:'Equipo'}[state.view];
    renderTimerBanner();
  }
  function renderView() {
    if (!state.user) return;
    renderShell();
    ({board:renderBoard,hours:renderHours,team:renderTeam}[state.view])();
  }
  function filteredTasks() {
    const query = state.query.toLocaleLowerCase('es').trim();
    return state.tasks.filter(t => (!query || `${t.title} ${t.description} ${t.project}`.toLocaleLowerCase('es').includes(query)) &&
      (state.member==='all' || t.collaborators.includes(state.member)) &&
      (state.project==='all' || t.project===state.project) &&
      (!state.mine || t.collaborators.includes(state.user.id)));
  }
  function card(t) {
    const minutes = taskMinutes(t.id);
    const overdue = t.due_date && t.due_date < today() && t.status !== 'done';
    const people = t.collaborators.map(profile).filter(Boolean);
    const progress = t.estimated_minutes ? Math.min(100, Math.round(minutes/t.estimated_minutes*100)) : 0;
    return `<article class="task-card" draggable="true" data-task-id="${esc(t.id)}" aria-label="${esc(t.title)}">
      <div class="task-meta"><span class="task-project">${esc(t.project || 'General')}</span><span class="priority priority-${esc(t.priority)}"><span class="priority-mark"></span>${esc(PRIORITIES[t.priority] || 'Media')}</span></div>
      <button class="task-title" data-action="edit-task" data-id="${esc(t.id)}">${esc(t.title)}</button>
      ${t.description?`<p class="task-description">${esc(t.description)}</p>`:''}
      <div class="task-tags">${t.due_date?`<span class="task-due${overdue?' overdue':''}" title="${overdue?'Fecha vencida':'Fecha límite'}">${icon('calendar')}${esc(fmtDate(t.due_date))}</span>`:'<span class="task-due muted">Sin fecha límite</span>'}</div>
      ${t.estimated_minutes?`<div class="task-progress" title="${esc(duration(minutes))} registradas de ${esc(duration(t.estimated_minutes))} estimadas"><span style="width:${progress}%"></span></div>`:''}
      <div class="task-footer"><div class="avatar-stack">${people.slice(0,3).map(p=>avatar(p,true)).join('')}${people.length>3?`<span class="avatar small-avatar">+${people.length-3}</span>`:''}${!people.length?'<span class="unassigned">Sin asignar</span>':''}</div><button class="task-hours" data-action="task-time" data-id="${esc(t.id)}" title="Registrar horas en este asunto">${icon('clock')}${esc(duration(minutes))}</button></div>
    </article>`;
  }
  function renderBoard() {
    content.innerHTML = heading('01 / ESPACIO DE TRABAJO','Asuntos','Proyectos, tareas y responsables.',addTimeButton + addTaskButton) +
      `<div class="stats-grid">${stat('Pendientes',state.tasks.filter(t=>t.status!=='done').length,'Asuntos pendientes')}${stat('Esta semana',`${hoursNumber(sumMinutes(state.entries.filter(e=>e.work_date>=weekStart() && e.work_date<=today())))} h`,'Tiempo registrado')}${stat('Completados',state.tasks.filter(t=>t.status==='done').length,'Asuntos finalizados')}${stat('Equipo',activeProfiles().length,'Personas con acceso')}</div>
      <div class="toolbar"><div class="search-box">${icon('search')}<input id="task-search" type="search" value="${esc(state.query)}" placeholder="Buscar un asunto…" aria-label="Buscar asuntos"></div><div class="filters"><select id="member-filter" aria-label="Filtrar asuntos por persona">${memberOptions(state.member)}</select><select id="project-filter" aria-label="Filtrar asuntos por proyecto">${option('all','Todos los proyectos',state.project)}${[...new Set(state.tasks.map(t=>t.project).filter(Boolean))].sort().map(p=>option(p,p,state.project)).join('')}</select><button class="filter-chip${state.mine?' active':''}" data-action="mine" aria-pressed="${state.mine}">${icon('users')}Mis asuntos</button></div></div>
      <div id="board-columns" class="board"></div><p class="board-hint">Arrastra para cambiar el estado. Pulsa el título para editar.</p>`;
    renderColumns();
  }
  function renderColumns() {
    const visible = filteredTasks();
    $('#board-columns').innerHTML = STATUSES.map(s => {
      const items = visible.filter(t=>t.status===s.id);
      return `<section class="kanban-column" data-status="${s.id}" aria-label="${s.name}"><div class="column-heading"><div><span class="status-dot"></span><h2>${s.name}</h2><span class="column-count">${items.length}</span></div><button class="icon-button column-add" data-action="new-task" data-status="${s.id}" aria-label="Añadir asunto en ${s.name}">${icon('plus')}</button></div><div class="task-list">${items.map(card).join('')}${!items.length?'<div class="column-empty">Sin asuntos.</div>':''}</div><button class="add-card" data-action="new-task" data-status="${s.id}">${icon('plus')}Añadir asunto</button></section>`;
    }).join('');
  }

  function hourEntries() {
    return state.entries.filter(e=>(!state.hours.from||e.work_date>=state.hours.from)&&(!state.hours.to||e.work_date<=state.hours.to)&&(state.hours.member==='all'||e.user_id===state.hours.member)&&(state.hours.task==='all'||e.task_id===state.hours.task))
      .sort((a,b)=>b.work_date.localeCompare(a.work_date)||b.created_at.localeCompare(a.created_at));
  }
  function bars(items, empty) {
    if (!items.length) return `<p class="empty-cell">${esc(empty)}</p>`;
    const max = Math.max(...items.map(x=>x.minutes),1);
    return `<div class="summary-bars">${items.map(item=>`<div class="bar-row"><div class="bar-label">${item.person?avatar(item.person,true):icon('folder')}<span>${esc(item.name)}</span></div><div class="bar-track"><span class="bar-fill" style="width:${Math.max(2,item.minutes/max*100)}%"></span></div><span class="bar-value">${esc(duration(item.minutes))}</span></div>`).join('')}</div>`;
  }
  function renderHours() {
    const entries = hourEntries();
    const total = sumMinutes(entries);
    const own = sumMinutes(entries.filter(e=>e.user_id===state.user.id));
    const byPerson = state.profiles.map(p=>({person:p,name:p.name,minutes:sumMinutes(entries.filter(e=>e.user_id===p.id))})).filter(p=>p.minutes>0).sort((a,b)=>b.minutes-a.minutes);
    const projectNames = [...new Set(entries.map(e=>task(e.task_id)?.project||'General'))];
    const byProject = projectNames.map(name=>({name,minutes:sumMinutes(entries.filter(e=>(task(e.task_id)?.project||'General')===name))})).sort((a,b)=>b.minutes-a.minutes);
    const totalPages = Math.max(1,Math.ceil(entries.length/25));
    state.page = Math.min(state.page,totalPages);
    const rows = entries.slice((state.page-1)*25,state.page*25);
    content.innerHTML = heading('02 / REGISTRO DE ACTIVIDAD','Horas','Tiempo registrado por persona y proyecto.',`<button class="btn btn-secondary" data-action="export">${icon('download')}Exportar CSV</button>${addTimeButton.replace('btn-secondary','btn-primary')}`) +
      `<div class="toolbar hours-toolbar"><div class="period-filter"><label>Desde<input type="date" id="hours-from" value="${esc(state.hours.from)}" aria-label="Fecha inicial"></label><label>Hasta<input type="date" id="hours-to" value="${esc(state.hours.to)}" aria-label="Fecha final"></label><button class="filter-chip" data-action="this-week">Esta semana</button><button class="filter-chip" data-action="this-month">Este mes</button><button class="filter-chip" data-action="all-time">Todo</button></div><div class="filters"><select id="hours-member" aria-label="Horas por persona">${memberOptions(state.hours.member,true,true)}</select><select id="hours-task" aria-label="Horas por asunto">${option('all','Todos los asuntos',state.hours.task)}${state.tasks.map(t=>option(t.id,t.title,state.hours.task)).join('')}</select></div></div>
      <div class="stats-grid">${stat('Horas del equipo',`${hoursNumber(total)} h`,'En el periodo seleccionado')}${stat('Mis horas',`${hoursNumber(own)} h`,'Tiempo propio registrado')}${stat('Asuntos con actividad',new Set(entries.map(e=>e.task_id)).size,'Con tiempo registrado')}${stat('Registros de tiempo',entries.length,'Sesiones registradas')}</div>
      <div class="two-column"><section class="panel"><div class="panel-header"><h2>Tiempo por persona</h2><span class="badge">${byPerson.length} personas</span></div><div class="panel-body">${bars(byPerson,'Todavía no hay horas en este periodo.')}</div></section><section class="panel"><div class="panel-header"><h2>Tiempo por proyecto</h2>${icon('folder')}</div><div class="panel-body">${bars(byProject,'Los proyectos aparecerán al registrar horas.')}</div></section></div>
      <section class="panel entries-panel"><div class="panel-header"><div><h2>Detalle de actividad</h2><p class="hint">Todos pueden consultar el tiempo. Cada persona edita sus registros; administración puede editar cualquiera.</p></div><span class="badge">${entries.length} registros</span></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Persona</th><th>Asunto y proyecto</th><th>Fecha</th><th class="numeric">Tiempo</th><th>Nota</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>${rows.map(e=>`<tr><td><div class="table-person">${avatar(profile(e.user_id),true)}<span>${esc(profile(e.user_id)?.name||'Miembro anterior')}</span></div></td><td><strong>${esc(task(e.task_id)?.title||'Asunto no disponible')}</strong><small>${esc(task(e.task_id)?.project||'General')}</small></td><td class="nowrap">${esc(fmtDate(e.work_date))}<small>${esc(e.work_date.slice(0,4))}</small></td><td class="numeric nowrap"><strong>${esc(duration(e.minutes))}</strong></td><td class="entry-note">${esc(e.note||'—')}</td><td><div class="table-actions">${e.user_id===state.user.id||isAdmin()?`<button class="icon-button" data-action="edit-entry" data-id="${esc(e.id)}" aria-label="Editar registro de ${esc(profile(e.user_id)?.name)} del ${esc(e.work_date)}">${icon('pencil')}</button><button class="icon-button danger-icon" data-action="delete-entry" data-id="${esc(e.id)}" aria-label="Eliminar registro del ${esc(e.work_date)}">${icon('trash')}</button>`:''}</div></td></tr>`).join('')||'<tr><td colspan="6" class="empty-cell">No hay registros con estos filtros. Registra tus primeras horas para empezar.</td></tr>'}</tbody></table></div><div class="pagination"><span>${entries.length?`${(state.page-1)*25+1}–${Math.min(state.page*25,entries.length)} de ${entries.length}`:'0 registros'}</span><div><button class="btn btn-ghost" data-action="prev-page"${state.page===1?' disabled':''}>Anterior</button><span>${state.page} / ${totalPages}</span><button class="btn btn-ghost" data-action="next-page"${state.page===totalPages?' disabled':''}>Siguiente</button></div></div></section>`;
  }

  function renderTeam() {
    const people = activeProfiles();
    const invitations = state.invitations.filter(i=>i.active!==false);
    content.innerHTML = heading('03 / PERSONAS Y ACCESOS','Equipo','Miembros, actividad y permisos.',isAdmin()?`<button class="btn btn-primary" data-action="invite">${icon('plus')}${state.mode==='demo'?'Añadir persona de prueba':'Autorizar una persona'}</button>`:'') +
      `<div class="team-grid">${people.map(p=>{const tasks=state.tasks.filter(t=>t.collaborators.includes(p.id)&&t.status!=='done');return `<article class="member-card"><div class="member-header">${avatar(p)}<span class="member-role">${p.role==='admin'?'Administración':'Miembro'}</span></div><h2>${esc(p.name)}${p.id===state.user.id?' <span class="you-badge">Tú</span>':''}</h2><p class="muted member-email">${esc(state.mode==='demo'?'@'+(p.username||p.name.toLowerCase()):p.email)}</p><div class="member-stats"><div><strong>${tasks.length}</strong><span>asuntos activos</span></div><div><strong>${hoursNumber(sumMinutes(state.entries.filter(e=>e.user_id===p.id && e.work_date>=weekStart() && e.work_date<=today())))} h</strong><span>esta semana</span></div></div><div class="member-projects">${[...new Set(tasks.map(t=>t.project||'General'))].slice(0,3).map(n=>`<span class="tag">${esc(n)}</span>`).join('')||'<span class="hint">Sin proyectos activos</span>'}</div><button class="btn btn-ghost member-task-link" data-action="person-tasks" data-id="${esc(p.id)}">Ver sus asuntos ${icon('arrow')}</button></article>`;}).join('')}</div>
      <section class="panel team-permissions"><div class="panel-header"><h2>${icon('lock')}Permisos</h2></div><div class="panel-body permissions-grid"><div><h3>Todos los miembros</h3><p>Crean y editan asuntos, asignan colaboradores, consultan las horas del equipo y gestionan sus propios registros.</p></div><div><h3>Administración</h3><p>También gestiona el acceso del equipo y puede corregir o eliminar registros de horas de cualquier persona.</p></div></div></section>
      ${isAdmin()&&state.mode!=='demo'?`<section class="panel"><div class="panel-header"><div><h2>Correos autorizados</h2><p class="hint">Autorizar un correo permite unirse al equipo. Comparte el enlace de la web con esa persona; esta acción no envía un email.</p></div><button class="btn btn-secondary" data-action="invite">${icon('plus')}Autorizar</button></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Persona</th><th>Correo</th><th>Rol</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>${invitations.map(i=>`<tr><td>${esc(i.name)}</td><td>${esc(i.email)}</td><td>${i.role==='admin'?'Administración':'Miembro'}</td><td><span class="tag">${people.some(p=>p.email?.toLowerCase()===i.email?.toLowerCase())?'En el equipo':'Pendiente de registro'}</span></td><td>${i.email?.toLowerCase()!==state.user.email?.toLowerCase()?`<button class="text-button danger-icon" data-action="revoke" data-email="${esc(i.email)}">Retirar acceso</button>`:'Tu acceso'}</td></tr>`).join('')||'<tr><td colspan="5" class="empty-cell">No hay correos autorizados.</td></tr>'}</tbody></table></div></section>`:''}
      ${state.mode!=='demo'?`<div class="team-footer"><button class="btn btn-secondary" data-action="password">${icon('lock')}Cambiar mi contraseña</button></div>`:''}`;
  }

  function openDialog(title, subtitle, body, footer = '', wide = false) {
    if (!dialog.open) lastFocus = document.activeElement;
    dialog.classList.toggle('modal-wide',wide);
    dialog.innerHTML = `<div class="modal-content"><div class="modal-header"><div><h2 id="dialog-title">${esc(title)}</h2>${subtitle?`<p class="hint">${esc(subtitle)}</p>`:''}</div><button type="button" class="icon-button" data-action="close-dialog" aria-label="Cerrar ventana">${icon('close')}</button></div>${body}${footer}</div>`;
    if (!dialog.open) dialog.showModal();
    const focusTarget = $('input:not([type="hidden"]),select,textarea,button[type="submit"]',dialog);
    if (focusTarget) focusTarget.focus();
  }
  function closeDialog(force = false) { if(dialog.dataset.saving==='true' && !force) return; dialog.close(); lastFocus?.focus?.(); }
  function formError(error) { showError($('#dialog-error',dialog),error); }
  const errorMarkup = '<p class="error-box full-width" id="dialog-error" role="alert" hidden></p>';
  const cancelButton = '<button class="btn btn-secondary" type="button" data-action="close-dialog">Cancelar</button>';
  const dialogSave = (label='Guardar cambios') => `<div class="modal-footer">${cancelButton}<button class="btn btn-primary" type="submit">${icon('check')}${label}</button></div>`;

  function openTask(id = null, initialStatus = 'todo') {
    const existing = id ? task(id) : null;
    if (id && !existing) return toast('El asunto ya no está disponible. Actualiza el tablero.',true);
    const data = existing || {id:uid(),title:'',description:'',project:'',status:initialStatus,priority:'medium',due_date:'',estimated_minutes:0,collaborators:[state.user.id]};
    const collaborators = state.profiles.filter(p=>p.active!==false || data.collaborators.includes(p.id));
    openDialog(existing?'Editar asunto':'Nuevo asunto','',
      `<form id="task-form" data-id="${esc(data.id)}" data-version="${data.version||''}"><div class="modal-body form-grid"><div class="form-field full-width"><label for="task-title">Título del asunto <span aria-hidden="true">*</span></label><input id="task-title" name="title" value="${esc(data.title)}" maxlength="160" required placeholder="¿En qué vamos a trabajar?"></div><div class="form-field full-width"><label for="task-description">Descripción</label><textarea id="task-description" name="description" rows="3" maxlength="5000" placeholder="Objetivo, contexto o siguiente paso…">${esc(data.description)}</textarea></div><div class="form-field"><label for="task-project">Proyecto</label><input id="task-project" name="project" list="projects-list" value="${esc(data.project)}" maxlength="80" placeholder="Ej. Investigación"><datalist id="projects-list">${[...new Set(state.tasks.map(t=>t.project).filter(Boolean))].map(p=>`<option value="${esc(p)}"></option>`).join('')}</datalist></div><div class="form-field"><label for="task-status">Estado</label><select id="task-status" name="status">${STATUSES.map(s=>option(s.id,s.name,data.status)).join('')}</select></div><div class="form-field"><label for="task-priority">Prioridad</label><select id="task-priority" name="priority">${Object.entries(PRIORITIES).map(([k,v])=>option(k,v,data.priority)).join('')}</select></div><div class="form-field"><label for="task-due">Fecha límite</label><input id="task-due" name="due_date" type="date" value="${esc(data.due_date||'')}"></div><div class="form-field full-width"><label for="task-estimate">Tiempo estimado en horas</label><input id="task-estimate" name="estimate" type="number" min="0" max="10000" step="0.25" value="${data.estimated_minutes?data.estimated_minutes/60:''}" placeholder="Opcional, por ejemplo 4,5"><small class="hint">La estimación no añade horas al registro.</small></div><fieldset class="form-field full-width"><legend>Personas que colaboran</legend><div class="collaborator-list">${collaborators.map(p=>`<label class="collaborator-option"><input type="checkbox" name="collaborators" value="${esc(p.id)}"${data.collaborators.includes(p.id)?' checked':''}>${avatar(p,true)}<span>${esc(p.name)}${p.active===false?' (inactivo)':''}</span></label>`).join('')}</div></fieldset>${existing?`<div class="task-detail-total full-width">${icon('clock')}<strong>${esc(duration(taskMinutes(existing.id)))}</strong> registradas en este asunto <button class="text-button" type="button" data-action="task-time" data-id="${esc(existing.id)}">Añadir horas</button></div>`:''}${errorMarkup}</div><div class="modal-footer">${existing?`<button class="btn btn-ghost danger-icon" type="button" data-action="delete-task" data-id="${esc(existing.id)}">${icon('trash')}Eliminar</button><span class="spacer"></span>`:''}${cancelButton}<button class="btn btn-primary" type="submit">${icon('check')}${existing?'Guardar cambios':'Crear asunto'}</button></div></form>`, '', true);
  }

  function openEntry(id = null, selectedTask = null, timerDraft = null) {
    if (!state.tasks.length) {
      toast('Crea primero un asunto para poder registrar horas.');
      return openTask();
    }
    const existing = id ? state.entries.find(e=>e.id===id) : null;
    if (id && !existing) return toast('Ese registro ya no está disponible.',true);
    const data = existing || {id:timerDraft?.id||uid(),task_id:selectedTask||state.tasks[0].id,user_id:state.user.id,work_date:timerDraft?.work_date||today(),minutes:timerDraft?.minutes||60,note:''};
    if (existing && existing.user_id!==state.user.id && !isAdmin()) return toast('Solo puedes editar tus propios registros.',true);
    openDialog(existing?'Editar registro':'Registrar horas',timerDraft?'Revisa el tiempo medido antes de guardarlo.':'El tiempo se añade a tu registro y al total del asunto.',
      `<form id="entry-form" data-id="${esc(data.id)}" data-version="${data.version||''}" data-timer="${timerDraft?'true':'false'}"><div class="modal-body form-grid"><div class="form-field full-width"><label for="entry-task">Asunto <span aria-hidden="true">*</span></label><select id="entry-task" name="task_id" required>${state.tasks.map(t=>option(t.id,`${t.title} · ${t.project||'General'}`,data.task_id)).join('')}</select></div>${isAdmin()?`<div class="form-field"><label for="entry-person">Persona</label><select id="entry-person" name="user_id"${existing?' disabled':''}>${state.profiles.filter(p=>p.active!==false||p.id===data.user_id).map(p=>option(p.id,p.name,data.user_id)).join('')}</select>${existing?`<input type="hidden" name="user_id" value="${esc(data.user_id)}"><small class="hint">La autoría de un registro se conserva.</small>`:''}</div>`:`<input type="hidden" name="user_id" value="${esc(state.user.id)}">`}<div class="form-field${!isAdmin()?' full-width':''}"><label for="entry-date">Fecha</label><input id="entry-date" name="work_date" type="date" value="${esc(data.work_date)}" max="${today()}" required></div><div class="form-field"><label for="entry-hours">Horas</label><input id="entry-hours" name="hours" type="number" min="0" max="24" step="1" value="${Math.floor(data.minutes/60)}" required></div><div class="form-field"><label for="entry-minutes">Minutos</label><input id="entry-minutes" name="minutes" type="number" min="0" max="59" step="1" value="${data.minutes%60}" required></div><div class="form-field full-width"><label for="entry-note">¿En qué has avanzado?</label><textarea id="entry-note" name="note" rows="3" maxlength="1000" placeholder="Una nota breve para dar contexto…">${esc(data.note)}</textarea><small class="hint">Mínimo 1 minuto. Máximo 24 horas por persona y día.</small></div>${timerDraft?'<div class="info-box full-width">Se redondea al minuto siguiente. Si la sesión cruzó medianoche, reparte las horas entre las fechas correspondientes mediante registros separados.</div>':''}${errorMarkup}</div>${dialogSave(existing?'Guardar cambios':'Guardar horas')}</form>`, '', true);
  }

  function openInvite() {
    if (!isAdmin()) return;
    const demo = state.mode==='demo';
    openDialog(demo?'Añadir persona de prueba':'Autorizar a una persona',demo?'La cuenta existirá solo en la demo de este navegador.':'Después, comparte la dirección de la web para que pueda crear su cuenta.',
      `<form id="invite-form"><div class="modal-body form-grid"><div class="form-field full-width"><label for="invite-name">Nombre</label><input id="invite-name" name="name" autocomplete="off" maxlength="80" required placeholder="Nombre de la persona"></div><div class="form-field full-width"><label for="invite-identifier">${demo?'Usuario de prueba':'Correo electrónico'}</label><input id="invite-identifier" name="identifier" type="${demo?'text':'email'}" autocomplete="off" autocapitalize="none" spellcheck="false" maxlength="254" required placeholder="${demo?'Ej. lucia':'persona@vuestro-dominio.com'}"${demo?' pattern="[a-zA-Z0-9._-]{3,32}"':''}></div>${demo?'<div class="form-field full-width"><label for="invite-password">Contraseña de prueba</label><input id="invite-password" name="password" type="password" minlength="12" maxlength="128" autocomplete="new-password" required><small class="hint">Mínimo 12 caracteres. No uses una contraseña real.</small></div>':'<div class="form-field full-width"><label for="invite-role">Rol</label><select id="invite-role" name="role"><option value="member">Miembro del equipo</option><option value="admin">Administración</option></select><small class="hint">Administración también puede gestionar accesos y corregir las horas de todos.</small></div><p class="info-box full-width">Autorizar no envía un email. Para registrarse, la persona debe usar este correo y confirmar su cuenta. También puede darse de alta desde el panel de Supabase.</p>'}${errorMarkup}</div>${dialogSave(demo?'Crear cuenta de prueba':'Autorizar correo')}</form>`);
  }
  function openPassword(recovery = false) {
    openDialog(recovery?'Elige una nueva contraseña':'Cambiar mi contraseña','Usa al menos 12 caracteres y una contraseña diferente de la demo.',
      `<form id="password-form" data-recovery="${recovery}"><div class="modal-body form-grid"><div class="form-field full-width"><label for="new-password">Nueva contraseña</label><input id="new-password" name="password" type="password" minlength="12" maxlength="128" required autocomplete="new-password"></div><div class="form-field full-width"><label for="repeat-password">Repetir contraseña</label><input id="repeat-password" name="repeat" type="password" minlength="12" maxlength="128" required autocomplete="new-password"></div>${errorMarkup}</div>${dialogSave('Guardar contraseña')}</form>`);
  }
  function confirmAction(title, message, callback, label = 'Eliminar') {
    openDialog(title,'',`<div class="modal-body confirm-content"><p>${esc(message)}</p>${errorMarkup}</div><div class="modal-footer">${cancelButton}<button class="btn btn-danger" id="confirm-action">${esc(label)}</button></div>`);
    $('#confirm-action',dialog).addEventListener('click', async event => {
      event.target.disabled = true;
      dialog.dataset.saving='true';
      try { await callback(); closeDialog(true); }
      catch (error) { formError(error); event.target.disabled = false; }
      finally { delete dialog.dataset.saving; }
    });
  }
  function openHelp() {
    openDialog('Ayuda','Asuntos, registro de tiempo y acceso al equipo.',
      `<div class="modal-body help-content"><section><h3>${icon('board')}1. Organizad los asuntos</h3><p>Crea un asunto, indica el proyecto y marca todas las personas que colaboran. Arrástralo entre Por hacer, En curso, En revisión y Hecho. También puedes cambiar el estado al editarlo.</p></section><section><h3>${icon('clock')}2. Dad visibilidad al tiempo</h3><p>Usa Registrar horas o pulsa el tiempo de una tarjeta. En Horas puedes consultar totales por persona y proyecto, filtrar fechas y descargar el detalle en CSV. El cronómetro está disponible desde esta pestaña.</p></section><section><h3>${icon('users')}3. Haced crecer el equipo</h3><p>En la demo, Marina puede crear más cuentas de prueba desde Equipo. En el modo compartido, administración autoriza un correo y la persona se registra con su propia contraseña.</p></section><section class="info-box"><h3>${state.mode==='demo'?'Para trabajar desde distintos ordenadores':'Vuestro espacio está conectado'}</h3><p>${state.mode==='demo'?'Esta demo guarda los cambios en este navegador. El proyecto incluye una conexión a Supabase para compartir cuentas y datos. Sigue README.md, ejecuta supabase.sql en tu proyecto y completa config.js. La web puede seguir alojada en GitHub Pages.':'Los cambios se guardan en Supabase y se consultan periódicamente. Usa Actualizar datos si necesitas ver un cambio enseguida. Los formularios detectan si otra persona editó el mismo registro antes de guardar.'}</p></section><p class="hint">El cronómetro se guarda en este navegador y sigue contando mientras la pestaña está cerrada. Revisa la duración antes de registrarla.</p></div><div class="modal-footer"><button class="btn btn-primary" data-action="close-dialog">Entendido ${icon('check')}</button></div>`, '', true);
  }

  // El cronómetro es local por usuario/dispositivo. Solo al guardar pasa al registro compartido.
  function timerKey() { return `nexo.timer.v1.${state.mode}.${window.NEXO_CONFIG?.SUPABASE_URL||'local'}.${state.user?.id||''}`; }
  function readTimer() {
    try { state.timer = JSON.parse(localStorage.getItem(timerKey())||'null'); }
    catch { state.timer = null; }
  }
  function writeTimer(value) {
    try { if (value) localStorage.setItem(timerKey(),JSON.stringify(value)); else localStorage.removeItem(timerKey()); state.timer = value; }
    catch { throw new Error('El navegador no permite guardar el cronómetro. Usa el registro manual de horas.'); }
    renderTimerBanner();
  }
  function timerElapsed() { return state.timer ? Math.max(0,(state.timer.stoppedAt || Date.now())-state.timer.startedAt) : 0; }
  function timerDisplay() {
    const seconds = Math.floor(timerElapsed()/1000);
    return `${String(Math.floor(seconds/3600)).padStart(2,'0')}:${String(Math.floor(seconds/60)%60).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;
  }
  function renderTimerBanner() {
    const el = $('#running-timer-banner');
    if (!state.user) { el.hidden = true; return; }
    if (!state.timer) {
      el.hidden = state.view!=='hours';
      el.innerHTML = `<div class="timer-panel"><span class="timer-panel-icon">${icon('clock')}</span><div><strong>Cronómetro</strong><p class="hint">Selecciona un asunto y registra la duración de la sesión.</p></div><button class="btn btn-secondary" data-action="start-timer">${icon('play')}Iniciar cronómetro</button></div>`;
      return;
    }
    el.hidden = false;
    el.innerHTML = `<div class="timer-panel timer-active"><span class="timer-panel-icon">${icon(state.timer.stoppedAt?'clock':'play')}</span><div><strong>${esc(task(state.timer.task_id)?.title||'Asunto no disponible')}</strong><p class="hint">${state.timer.stoppedAt?'Sesión detenida, pendiente de guardar':'Cronómetro en marcha · guardado en este navegador'}</p></div><span class="timer-display" id="timer-digits">${timerDisplay()}</span><button class="btn btn-primary" data-action="stop-timer">${icon(state.timer.stoppedAt?'check':'stop')}${state.timer.stoppedAt?'Guardar sesión':'Detener y registrar'}</button><button class="icon-button" data-action="discard-timer" aria-label="Descartar cronómetro" title="Descartar cronómetro">${icon('close')}</button></div>`;
  }
  function openStartTimer() {
    if (state.timer) return toast('Ya tienes un cronómetro activo o pendiente de guardar.');
    if (!state.tasks.length) { toast('Crea un asunto antes de iniciar el cronómetro.'); return openTask(); }
    openDialog('¿En qué vas a trabajar?','Puedes cerrar la pestaña y retomar el cronómetro en este navegador.',
      `<form id="timer-form"><div class="modal-body"><div class="form-field"><label for="timer-task">Asunto</label><select id="timer-task" name="task_id">${state.tasks.filter(t=>t.status!=='done').concat(state.tasks.filter(t=>t.status==='done')).map(t=>option(t.id,t.title,'')).join('')}</select></div>${errorMarkup}</div>${dialogSave('Iniciar cronómetro')}</form>`);
  }
  function stopTimer() {
    readTimer();
    if (!state.timer) return renderTimerBanner();
    if (!task(state.timer.task_id)) return toast('El asunto del cronómetro ya no existe. Descarta la sesión y registra el tiempo en otro asunto.',true);
    if (!state.timer.stoppedAt) writeTimer({...state.timer,stoppedAt:Date.now()});
    openEntry(null,state.timer.task_id,{id:state.timer.id,work_date:dayKey(new Date(state.timer.startedAt)),minutes:Math.max(1,Math.ceil(timerElapsed()/60000))});
  }
  function exportCSV() {
    const entries = hourEntries();
    if (!entries.length) return toast('No hay registros que exportar con estos filtros.');
    // Prefijo ' para impedir que un texto introducido por un usuario se evalúe como fórmula.
    const cell = value => { let text = String(value ?? ''); if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = "'" + text; return '"' + text.replace(/"/g,'""') + '"'; };
    const rows = [['Fecha','Persona','Proyecto','Asunto','Minutos','Horas decimales','Nota'],...entries.map(e=>[e.work_date,profile(e.user_id)?.name||'Miembro anterior',task(e.task_id)?.project||'General',task(e.task_id)?.title||'Asunto no disponible',e.minutes,(e.minutes/60).toFixed(4).replace('.',','),e.note])];
    const csv = '\uFEFF' + rows.map(row=>row.map(cell).join(';')).join('\r\n');
    const url = URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = `nexo-horas-${state.hours.from||'inicio'}-${state.hours.to||today()}.csv`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),5000);
    toast(`${entries.length} registros exportados.`);
  }

  let sessionGeneration = 0;
  async function reloadData(force = false) {
    if (!state.user) return;
    if (reloadPromise) { await reloadPromise; if (!force) return; }
    const generation = sessionGeneration;
    reloadPromise = (async () => {
      try {
        const snapshot = await API.load();
        if (generation !== sessionGeneration || !state.user) return;
        Object.assign(state,snapshot);
        state.user = API.user || state.user;
        state.lastSync = new Date();
        $('#app-error').hidden = true;
        // El sondeo no interrumpe a quien esté escribiendo o usando un selector.
        const interacting = content.contains(document.activeElement) && /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
        if (!force && (interacting || dragId)) renderShell(); else renderView();
      } catch (error) {
        if (generation !== sessionGeneration) return;
        if (!API.user) { showLogin(); showError($('#auth-error'),error); }
        else { showError($('#app-error'),error); $('#sync-label').textContent = 'Sin actualizar · pulsa ↻ para reintentar'; }
        if (force) throw error;
      } finally { reloadPromise = null; }
    })();
    await reloadPromise;
  }
  async function afterMutation(message) {
    toast(message);
    try { await reloadData(true); }
    catch { toast('El cambio se guardó, pero no se pudo actualizar la vista. Pulsa Actualizar datos.',true); }
  }
  function showLogin() {
    sessionGeneration++;
    unsubscribe?.(); unsubscribe=null;
    if (dialog.open) closeDialog();
    state.user=null; state.tasks=[]; state.entries=[]; state.profiles=[]; state.invitations=[]; state.timer=null;
    state.query=''; state.member='all'; state.project='all'; state.mine=false; state.view='board'; state.hours={from:monthStart(),to:today(),member:'all',task:'all'};
    content.replaceChildren();
    $('#app-view').hidden=true; $('#auth-view').hidden=false;
    $('#auth-password').value='';
    setAuthMode('login');
  }
  async function enterApp(user) {
    state.user=user; state.view='board';
    sessionGeneration++;
    readTimer();
    renderShell();
    content.innerHTML='<div class="empty-state">Preparando el espacio del equipo…</div>';
    try { await reloadData(true); }
    catch { /* El error visible incluye la acción de volver a actualizar. */ }
    unsubscribe?.();
    unsubscribe=API.subscribe(()=>reloadData(false));
    window.scrollTo(0,0);
  }
  function setAuthMode(mode) {
    authMode = mode;
    clearAuthMessages();
    const shared = state.mode==='supabase';
    $('#auth-mode-badge').textContent=shared?'ESPACIO COMPARTIDO':'DEMOSTRACIÓN';
    $('#auth-tabs').hidden=!shared;
    $('#demo-accounts').hidden=shared;
    $('#auth-name-wrap').hidden=mode!=='signup';
    $('#auth-name').required=mode==='signup';
    $('#signup-note').hidden=!shared;
    $('#forgot-password').hidden=!shared||mode==='signup';
    $('#auth-user-label').textContent=shared?'Correo electrónico':'Usuario';
    $('#auth-user').type=shared?'email':'text';
    $('#auth-user').placeholder=shared?'tu@correo.com':'Tu usuario';
    $('#auth-password').minLength=mode==='signup'?12:1;
    $('#auth-password').maxLength=128;
    $('#auth-password').autocomplete=mode==='signup'?'new-password':'current-password';
    $('#auth-title').textContent=mode==='signup'?'Crear cuenta':'Acceso';
    $('#auth-subtitle').textContent=mode==='signup'?'Regístrate con el correo autorizado.':'Introduce tus datos para entrar.';
    $('#auth-submit').innerHTML=(mode==='signup'?'Crear mi cuenta':'Entrar')+' '+icon('arrow');
    $$('[data-auth-mode]').forEach(el=>el.classList.toggle('active',el.dataset.authMode===mode));
  }

  $('#auth-form').addEventListener('submit',async event=>{
    event.preventDefault(); clearAuthMessages();
    const button=$('#auth-submit'); button.disabled=true;
    try {
      if (authMode==='signup') {
        await API.signup({name:$('#auth-name').value,email:$('#auth-user').value,password:$('#auth-password').value});
        setAuthMode('login'); $('#auth-password').value='';
        showAuthInfo('Si el registro puede completarse, recibirás un enlace de confirmación. Revisa el correo y la carpeta de spam antes de entrar.');
      } else {
        const user=await API.login($('#auth-user').value,$('#auth-password').value);
        $('#auth-password').value=''; await enterApp(user);
      }
    } catch(error) { showError($('#auth-error'),error); }
    finally { button.disabled=false; }
  });
  $$('[data-demo-user]').forEach(el=>el.addEventListener('click',()=>{
    const credentials={marina:'MarinaDemo2026!',hoda:'HodaDemo2026!',antonio:'AntonioDemo2026!'};
    $('#auth-user').value=el.dataset.demoUser;
    $('#auth-password').value=credentials[el.dataset.demoUser];
    clearAuthMessages(); $('#auth-submit').focus();
  }));
  $$('[data-auth-mode]').forEach(el=>el.addEventListener('click',()=>setAuthMode(el.dataset.authMode)));
  $('#toggle-password').addEventListener('click',()=>{
    const input=$('#auth-password'); input.type=input.type==='password'?'text':'password';
    $('#toggle-password').setAttribute('aria-label',input.type==='password'?'Mostrar contraseña':'Ocultar contraseña');
    $('#toggle-password').title=input.type==='password'?'Mostrar contraseña':'Ocultar contraseña';
  });
  $('#forgot-password').addEventListener('click',async event=>{
    clearAuthMessages();
    if (!$('#auth-user').value || !$('#auth-user').checkValidity()) { showError($('#auth-error'),new Error('Escribe primero tu correo electrónico en el campo de acceso.')); return $('#auth-user').focus(); }
    event.target.disabled=true;
    try { await API.resetPassword($('#auth-user').value); showAuthInfo('Si existe una cuenta para ese correo, recibirás un enlace para cambiar la contraseña.'); }
    catch(error) { showError($('#auth-error'),error); }
    finally { event.target.disabled=false; }
  });
  $('#logout-button').addEventListener('click',async event=>{
    const button=event.currentTarget; button.disabled=true;
    try { await API.logout(); showLogin(); }
    catch(error) { toast(error.message,true); }
    finally { button.disabled=false; }
  });
  $$('[data-view]').forEach(el=>el.addEventListener('click',()=>{state.view=el.dataset.view; renderView(); window.scrollTo(0,0);}));

  document.addEventListener('click',async event=>{
    const button=event.target.closest('[data-action]');
    if (!button || button.disabled) return;
    const action=button.dataset.action;
    try {
      if (action==='new-task') openTask(null,button.dataset.status||'todo');
      else if (action==='edit-task') openTask(button.dataset.id);
      else if (action==='new-entry') openEntry();
      else if (action==='task-time') openEntry(null,button.dataset.id);
      else if (action==='edit-entry') openEntry(button.dataset.id);
      else if (action==='close-dialog') closeDialog();
      else if (action==='help') openHelp();
      else if (action==='invite') openInvite();
      else if (action==='password') openPassword();
      else if (action==='mine') {state.mine=!state.mine;renderBoard();}
      else if (action==='person-tasks') {state.member=button.dataset.id;state.mine=false;state.project='all';state.query='';state.view='board';renderView();}
      else if (action==='export') exportCSV();
      else if (action==='refresh') { button.disabled=true; await reloadData(true); toast('Datos actualizados.'); }
      else if (action==='this-week') {state.hours.from=weekStart();state.hours.to=today();state.page=1;renderHours();}
      else if (action==='this-month') {state.hours.from=monthStart();state.hours.to=today();state.page=1;renderHours();}
      else if (action==='all-time') {state.hours.from='';state.hours.to='';state.page=1;renderHours();}
      else if (action==='prev-page'||action==='next-page') {state.page+=action==='next-page'?1:-1;renderHours();}
      else if (action==='start-timer') openStartTimer();
      else if (action==='stop-timer') stopTimer();
      else if (action==='discard-timer') confirmAction('¿Descartar esta sesión?','El tiempo del cronómetro se descartará. Los registros ya guardados no se modificarán.',async()=>{writeTimer(null);toast('Cronómetro descartado.');},'Descartar sesión');
      else if (action==='delete-task') {
        const record=task(button.dataset.id);
        if (state.entries.some(e=>e.task_id===record.id)) return toast('Este asunto tiene horas registradas. Márcalo como Hecho para conservar el historial.',true);
        confirmAction('¿Eliminar este asunto?',`Se eliminará «${record.title}». Esta acción no se puede deshacer.`,async()=>{await API.deleteTask(record.id,record.version);await afterMutation('Asunto eliminado.');});
      } else if (action==='delete-entry') {
        const record=state.entries.find(e=>e.id===button.dataset.id);
        confirmAction('¿Eliminar este registro?',`Se eliminarán ${duration(record.minutes)} del ${fmtDate(record.work_date,true)}. El total de horas se recalculará.`,async()=>{await API.deleteEntry(record.id,record.version);await afterMutation('Registro eliminado.');});
      } else if (action==='revoke') {
        const email=button.dataset.email;
        confirmAction('¿Retirar el acceso?',`${email} dejará de acceder a los datos del equipo. Se conservarán sus asuntos y registros anteriores.`,async()=>{await API.revokeInvite(email);await afterMutation('Acceso retirado.');},'Retirar acceso');
      }
    } catch(error) { toast(error.message,true); }
    finally { if(button.isConnected) button.disabled=false; }
  });
  content.addEventListener('input',event=>{
    if(event.target.id==='task-search') {state.query=event.target.value;renderColumns();}
  });
  content.addEventListener('change',event=>{
    const {id,value}=event.target;
    if(id==='member-filter') {state.member=value;renderColumns();}
    if(id==='project-filter') {state.project=value;renderColumns();}
    if(id.startsWith('hours-')) {
      const field=id.slice(6); const prev=state.hours[field];
      state.hours[field]=value;
      if(state.hours.from && state.hours.to && state.hours.from>state.hours.to) {state.hours[field]=prev;toast('La fecha inicial no puede ser posterior a la final.',true);}
      state.page=1;renderHours();
    }
  });
  content.addEventListener('dragstart',event=>{
    const cardEl=event.target.closest('.task-card');
    if (!cardEl) return;
    dragId=cardEl.dataset.taskId;
    event.dataTransfer.effectAllowed='move'; event.dataTransfer.setData('text/plain',dragId);
    cardEl.classList.add('dragging');
  });
  content.addEventListener('dragover',event=>{
    const column=event.target.closest('.kanban-column');
    if (!column || !dragId) return;
    event.preventDefault(); event.dataTransfer.dropEffect='move';
    $$('.kanban-column',content).forEach(el=>el.classList.toggle('drag-over',el===column));
  });
  content.addEventListener('dragend',()=>{dragId=null;$$('.dragging,.drag-over',content).forEach(el=>el.classList.remove('dragging','drag-over'));});
  content.addEventListener('drop',async event=>{
    const column=event.target.closest('.kanban-column');
    if (!column || !dragId) return;
    event.preventDefault();
    const record=task(dragId); const next=column.dataset.status;
    dragId=null;
    $$('.dragging,.drag-over',content).forEach(el=>el.classList.remove('dragging','drag-over'));
    if (!record || record.status===next) return;
    try {await API.moveTask(record.id,next,record.version);await afterMutation(`Asunto movido a ${STATUSES.find(s=>s.id===next).name}.`);}
    catch(error) {toast(error.message,true);await reloadData(false);}
  });

  dialog.addEventListener('submit',async event=>{
    event.preventDefault();
    const form=event.target;
    const values=new FormData(form);
    const button=$('button[type="submit"]',form);
    if(!button||button.disabled) return;
    button.disabled=true;
    dialog.dataset.saving='true';
    if($('#dialog-error',dialog)) $('#dialog-error',dialog).hidden=true;
    try {
      if(form.id==='task-form') {
        const payload={id:form.dataset.id,title:values.get('title').trim(),description:values.get('description').trim(),project:values.get('project').trim()||'General',status:values.get('status'),priority:values.get('priority'),due_date:values.get('due_date')||null,estimated_minutes:Math.round(Number(values.get('estimate')||0)*60),collaborators:values.getAll('collaborators')};
        if(form.dataset.version) payload.version=Number(form.dataset.version);
        await API.saveTask(payload);closeDialog(true);await afterMutation(payload.version?'Asunto actualizado.':'Nuevo asunto creado.');
      } else if(form.id==='entry-form') {
        const minutes=Number(values.get('hours'))*60+Number(values.get('minutes'));
        if(!Number.isInteger(minutes)||minutes<1||minutes>1440) throw new Error('La duración debe estar entre 1 minuto y 24 horas.');
        const payload={id:form.dataset.id,task_id:values.get('task_id'),user_id:values.get('user_id'),work_date:values.get('work_date'),minutes,note:values.get('note').trim()};
        if(form.dataset.version) payload.version=Number(form.dataset.version);
        await API.saveEntry(payload);
        if(form.dataset.timer==='true' && state.timer?.id===form.dataset.id) {writeTimer(null);}
        closeDialog(true);await afterMutation(payload.version?'Registro actualizado.':'Horas guardadas.');
      } else if(form.id==='invite-form') {
        if(state.mode==='demo') await API.addDemoMember({name:values.get('name').trim(),username:values.get('identifier').trim(),password:values.get('password')});
        else await API.invite({name:values.get('name').trim(),email:values.get('identifier').trim(),role:values.get('role')});
        closeDialog(true);await afterMutation(state.mode==='demo'?'Cuenta de prueba creada.':'Correo autorizado. Ya puedes compartir el enlace.');
      } else if(form.id==='password-form') {
        if(values.get('password')!==values.get('repeat')) throw new Error('Las dos contraseñas no coinciden.');
        await API.updatePassword(values.get('password'));closeDialog(true);toast('Contraseña actualizada.');
      } else if(form.id==='timer-form') {
        readTimer();
        if(state.timer) throw new Error('Ya existe una sesión activa. Guarda o descarta esa sesión primero.');
        writeTimer({id:uid(),task_id:values.get('task_id'),startedAt:Date.now(),user_id:state.user.id});
        closeDialog(true);toast('Cronómetro iniciado.');
      }
    } catch(error) {if(dialog.open && $('#dialog-error',dialog)) formError(error); else toast(error.message,true);}
    finally {delete dialog.dataset.saving;if(button.isConnected) button.disabled=false;}
  });
  dialog.addEventListener('cancel',event=>{if(dialog.dataset.saving==='true') event.preventDefault();});
  dialog.addEventListener('click',event=>{
    if(event.target!==dialog) return;
    const rect=dialog.getBoundingClientRect();
    if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom) closeDialog();
  });
  window.addEventListener('storage',event=>{
    if(state.user && event.key===timerKey()) {readTimer();renderTimerBanner();}
  });
  setInterval(()=>{if(state.timer && $('#timer-digits')) $('#timer-digits').textContent=timerDisplay();},1000);

  (async()=>{
    state.mode=window.NEXO_CONFIG?.MODE||'demo';
    setAuthMode('login');
    $('#auth-submit').disabled=true;
    try {
      if(!API) throw new Error('No se ha cargado data.js. Comprueba que todos los archivos estén juntos.');
      const initial=await API.init();
      state.mode=initial.mode;
      if(initial.user) {
        await enterApp(initial.user);
        if(initial.passwordRecovery||API.passwordRecovery) openPassword(true);
      }
    } catch(error) {showError($('#auth-error'),error);}
    finally {$('#auth-submit').disabled=false;}
  })();
})();
