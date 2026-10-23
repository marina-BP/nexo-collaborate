/* NEXO · Capa de datos. JavaScript clásico, sin npm ni compilación.
 * DEMO: datos locales de prueba y credenciales visibles; no es autenticación real.
 * SUPABASE: Auth + Postgres con permisos aplicados por supabase.sql.
 */
(function () {
  'use strict';
  const config = window.NEXO_CONFIG || {};
  const mode = config.MODE || 'demo';
  const DATA_KEY = 'nexo.demo.v1.data';
  const SESSION_KEY = 'nexo.demo.v1.session';
  const STATES = ['todo', 'doing', 'review', 'done'];
  const PRIORITIES = ['low', 'medium', 'high'];
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let client = null;
  let currentUser = null;
  let initialized = false;
  let passwordRecovery = /(?:[?#&])type=recovery(?:&|$)/.test(location.hash + location.search);
  const listeners = new Set();

  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function uuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    if (!window.crypto || !crypto.getRandomValues) throw new Error('Tu navegador no permite generar identificadores. Abre la web con HTTPS o localhost.');
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    const hex = Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
    return hex.slice(0,8)+'-'+hex.slice(8,12)+'-'+hex.slice(12,16)+'-'+hex.slice(16,20)+'-'+hex.slice(20);
  }
  function dateOffset(offset) {
    const date = new Date(); date.setHours(12, 0, 0, 0); date.setDate(date.getDate() + offset);
    return date.getFullYear() + '-' + String(date.getMonth()+1).padStart(2,'0') + '-' + String(date.getDate()).padStart(2,'0');
  }
  function profileOnly(profile) {
    if (!profile) return null;
    const { id, name, email, role, username, active, created_at } = profile;
    return { id, name, email, role, username, active: active !== false, created_at };
  }
  function notify() {
    for (const fn of listeners) {
      try { Promise.resolve(fn()).catch(() => {}); } catch (_) { /* El consumidor muestra sus propios errores. */ }
    }
  }
  function seed() {
    const now = new Date().toISOString();
    const profiles = [
      {id:'10000000-0000-4000-8000-000000000001',name:'Marina',username:'marina',email:'marina@demo.local',role:'admin',active:true,password:'MarinaDemo2026!',created_at:now},
      {id:'10000000-0000-4000-8000-000000000002',name:'Hoda',username:'hoda',email:'hoda@demo.local',role:'member',active:true,password:'HodaDemo2026!',created_at:now},
      {id:'10000000-0000-4000-8000-000000000003',name:'Antonio',username:'antonio',email:'antonio@demo.local',role:'member',active:true,password:'AntonioDemo2026!',created_at:now}
    ];
    const [m,h,a] = profiles.map(p => p.id);
    const definitions = [
      ['Definir los objetivos del próximo mes','Acordar prioridades, responsables y entregables para el próximo ciclo.','Planificación','todo','high',5,360,[m,h]],
      ['Preparar la guía de trabajo del equipo','Documentar los acuerdos de coordinación y dónde encontrar cada recurso.','Equipo','todo','medium',8,240,[a]],
      ['Analizar los resultados del proyecto','Revisar los resultados, contrastar conclusiones y preparar el resumen.','Investigación','doing','high',2,720,[m,h]],
      ['Organizar los materiales compartidos','Ordenar las carpetas y comprobar que el equipo tiene los recursos necesarios.','Equipo','doing','medium',4,360,[h,a]],
      ['Preparar la próxima reunión','Recoger los avances y dudas del equipo para la reunión de seguimiento.','Planificación','doing','low',1,180,[m]],
      ['Revisar el primer borrador','Leer la propuesta y dejar resueltos los comentarios pendientes.','Investigación','review','high',3,480,[m,a]],
      ['Validar el calendario de entregas','Comprobar dependencias y confirmar las fechas con todo el equipo.','Planificación','review','medium',6,240,[h,a]],
      ['Crear el espacio de coordinación','Definir un lugar común para registrar asuntos, responsables y horas.','Equipo','done','medium',-1,180,[m,h,a]]
    ];
    const tasks = definitions.map((d, i) => ({
      id:'20000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),
      title:d[0],description:d[1],project:d[2],status:d[3],priority:d[4],due_date:dateOffset(d[5]),
      estimated_minutes:d[6],collaborators:d[7],created_by:m,created_at:now,updated_at:now,version:1
    }));
    const logs = [[2,m,180,-2,'Revisión de los primeros resultados.'],[2,h,150,-1,'Contraste de datos y notas.'],[3,a,120,-2,'Organización de materiales.'],[3,h,90,0,'Revisión de documentos compartidos.'],[4,m,45,0,'Preparación de la agenda.'],[5,a,120,-1,'Lectura y comentarios del borrador.'],[5,m,90,0,'Revisión de los cambios.'],[6,h,60,-1,'Coordinación de las fechas.'],[7,m,60,-3,'Preparación del tablero.'],[7,h,45,-3,'Prueba del registro de horas.'],[7,a,60,-3,'Organización inicial del equipo.']];
    const entries = logs.map((x,i) => ({id:'30000000-0000-4000-8000-'+String(i+1).padStart(12,'0'),task_id:tasks[x[0]].id,user_id:x[1],minutes:x[2],work_date:dateOffset(x[3]),note:x[4],created_at:now,updated_at:now,version:1}));
    return { schema:1, profiles, tasks, entries, invitations:[] };
  }
  function readDemo() {
    let raw;
    try { raw = localStorage.getItem(DATA_KEY); }
    catch (_) { throw new Error('El navegador bloquea el almacenamiento local. Permítelo o abre la web con Live Server.'); }
    if (!raw) { const data=seed(); writeDemo(data); return data; }
    try {
      const data=JSON.parse(raw);
      if (data.schema!==1 || !Array.isArray(data.profiles) || !Array.isArray(data.tasks) || !Array.isArray(data.entries)) throw new Error();
      return data;
    } catch (_) { throw new Error('Los datos locales no se pueden leer. Conserva una copia del almacenamiento antes de reiniciar la demostración.'); }
  }
  function writeDemo(data) {
    try { localStorage.setItem(DATA_KEY, JSON.stringify(data)); }
    catch (_) { throw new Error('No se pudo guardar. El navegador bloquea el almacenamiento o no queda espacio.'); }
  }
  function demoUser(data) {
    if (!currentUser) throw new Error('Inicia sesión para continuar.');
    const user=data.profiles.find(p=>p.id===currentUser.id && p.active!==false);
    if (!user) { currentUser=null; throw new Error('Tu acceso ha sido revocado. Inicia sesión con una cuenta autorizada.'); }
    currentUser=profileOnly(user); return user;
  }
  function fail(error) {
    if (!error) return;
    const text=String(error.message || error);
    if (text.includes('NEXO_')) throw new Error(text.replace(/^.*?NEXO_[A-Z]+:\s*/,''));
    if (/Invalid login credentials/i.test(text)) throw new Error('El correo o la contraseña no son correctos.');
    if (/Email not confirmed/i.test(text)) throw new Error('Confirma tu correo antes de iniciar sesión.');
    if (/rate limit|too many requests/i.test(text)) throw new Error('Se ha alcanzado el límite de intentos o correos. Espera unos minutos y vuelve a probar.');
    if (/row-level security|permission denied|JWT expired|invalid JWT/i.test(text) || error.code==='42501') throw new Error('Tu sesión o tus permisos ya no son válidos. Vuelve a iniciar sesión.');
    if (error.code==='23503') throw new Error('Este asunto tiene registros de horas asociados o una referencia ya no existe. Actualiza los datos.');
    if (error.code==='23505') throw new Error('Este registro ya existe. Actualiza los datos antes de volver a guardar.');
    if (error.code==='23514' || error.code==='22007') throw new Error('Revisa los campos. Algún valor supera los límites o la fecha no es válida.');
    if (/fetch|network|Failed to load/i.test(text)) throw new Error('No se pudo conectar. Comprueba tu conexión y vuelve a intentarlo. Los cambios no se han confirmado.');
    if (/relation .* does not exist|function .* does not exist|Could not find/i.test(text)) throw new Error('La base de datos no está preparada. Ejecuta supabase.sql y comprueba la configuración.');
    throw new Error(text);
  }
  function requiredText(value,label,max) {
    const text=String(value==null?'':value).trim();
    if (!text || text.length>max) throw new Error(label+' debe tener entre 1 y '+max+' caracteres.');
    return text;
  }
  function optionalText(value,label,max) {
    const text=String(value==null?'':value).trim();
    if (text.length>max) throw new Error(label+' no puede superar '+max+' caracteres.');
    return text;
  }
  function validDate(value,optional) {
    if (!value && optional) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) throw new Error('Introduce una fecha válida.');
    const date=new Date(value+'T12:00:00Z');
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0,10)!==value) throw new Error('Introduce una fecha válida.');
    return value;
  }
  function int(value,min,max,label) {
    const n=Number(value);
    if (!Number.isInteger(n) || n<min || n>max) throw new Error(label+' debe ser un número entero entre '+min+' y '+max+'.');
    return n;
  }
  function taskFields(task) {
    if (!STATES.includes(task.status)) throw new Error('Selecciona un estado válido.');
    if (!PRIORITIES.includes(task.priority)) throw new Error('Selecciona una prioridad válida.');
    const collaborators=Array.isArray(task.collaborators)?[...new Set(task.collaborators)]:[];
    if (collaborators.length>100 || collaborators.some(id=>!UUID_RE.test(id))) throw new Error('Selecciona colaboradores válidos.');
    return {title:requiredText(task.title,'El título',160),description:optionalText(task.description,'La descripción',5000),project:requiredText(task.project || 'General','El proyecto',80),status:task.status,priority:task.priority,due_date:validDate(task.due_date,true),estimated_minutes:int(task.estimated_minutes || 0,0,600000,'La estimación'),collaborators};
  }
  function entryFields(entry) {
    if (!UUID_RE.test(entry.task_id || '')) throw new Error('Selecciona un asunto válido.');
    return {task_id:entry.task_id,work_date:validDate(entry.work_date,false),minutes:int(entry.minutes,1,1440,'Los minutos'),note:optionalText(entry.note,'La nota',1000)};
  }
  function requireVersion(record,version) {
    if (!record || record.version!==Number(version)) throw new Error('Otra persona ha modificado o eliminado este registro. Actualiza los datos y vuelve a abrirlo.');
  }
  function email(value) {
    const result=String(value || '').trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new Error('Escribe un correo válido.');
    return result;
  }
  function password(value) {
    if (typeof value!=='string' || value.length<12 || value.length>128) throw new Error('Utiliza una contraseña de entre 12 y 128 caracteres.');
    return value;
  }
  function redirectUrl() { return location.origin+location.pathname; }
  function requireCloud() { if (!client) throw new Error('La conexión compartida todavía no está preparada.'); }
  function requireLogin() { if (!currentUser) throw new Error('Inicia sesión para continuar.'); }

  async function loadSDK() {
    if (window.supabase && window.supabase.createClient) return;
    await new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      script.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      script.async=true;
      const timeout=setTimeout(()=>{script.remove();reject(new Error('No se pudo cargar la conexión compartida. Comprueba internet o el bloqueo de scripts.'));},20000);
      script.onload=()=>{clearTimeout(timeout);resolve();};
      script.onerror=()=>{clearTimeout(timeout);reject(new Error('No se pudo cargar la conexión compartida. Comprueba internet o el bloqueo de scripts.'));};
      document.head.appendChild(script);
    });
    if (!window.supabase || !window.supabase.createClient) throw new Error('No se ha podido inicializar Supabase.');
  }
  function validateConfig() {
    let url;
    try { url=new URL(config.SUPABASE_URL); } catch (_) { throw new Error('Completa SUPABASE_URL en config.js.'); }
    if (url.protocol!=='https:' || url.username || url.password) throw new Error('SUPABASE_URL debe ser una URL HTTPS válida.');
    const key=String(config.SUPABASE_ANON_KEY || '').trim();
    if (key.startsWith('sb_secret_')) throw new Error('No uses una clave secreta. Sustitúyela por la clave publicable del proyecto.');
    if (key.startsWith('sb_publishable_')) return;
    try {
      const payload=JSON.parse(atob(key.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));
      if (payload.role==='anon') return;
    } catch (_) { /* Mostrar el mensaje de configuración siguiente. */ }
    throw new Error('Completa SUPABASE_ANON_KEY con una clave publicable sb_publishable_... o anon. Nunca uses service_role.');
  }
  async function claim() {
    const {data,error}=await client.rpc('nexo_claim_membership').single(); fail(error);
    if (!data) throw new Error('No se pudo comprobar tu acceso al equipo.');
    currentUser=profileOnly(data); return clone(currentUser);
  }
  async function allRows(table,key) {
    const result=[]; const pageSize=500;
    for (let offset=0; ; offset+=pageSize) {
      const {data,error}=await client.from(table).select('*').order(key || 'id',{ascending:true}).range(offset,offset+pageSize-1);
      fail(error); result.push(...data);
      if (data.length<pageSize) return result;
    }
  }
  async function init() {
    if (initialized) return {mode,user:currentUser?clone(currentUser):null,passwordRecovery};
    if (!['demo','supabase'].includes(mode)) throw new Error('MODE en config.js debe ser demo o supabase.');
    if (mode==='demo') {
      const data=readDemo(); let id=null;
      try { id=sessionStorage.getItem(SESSION_KEY); } catch (_) { /* Sin sesión persistente, se puede iniciar sesión igualmente. */ }
      currentUser=profileOnly(data.profiles.find(p=>p.id===id && p.active!==false));
    } else {
      if (location.protocol==='file:') throw new Error('Para el modo compartido, abre la carpeta con Live Server o publica la web en GitHub Pages.');
      validateConfig(); await loadSDK();
      if (!client) {
        client=window.supabase.createClient(config.SUPABASE_URL,config.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'nexo-auth-'+new URL(config.SUPABASE_URL).host}});
        // Callback síncrono: nunca llamar/esperar otras operaciones de Auth aquí.
        client.auth.onAuthStateChange((event)=>{
          if (event==='PASSWORD_RECOVERY') passwordRecovery=true;
          if (event==='SIGNED_OUT') { currentUser=null; passwordRecovery=false; }
        });
      }
      const {data,error}=await client.auth.getSession(); fail(error);
      if (data.session) {
        try { await claim(); }
        catch (error) { await client.auth.signOut({scope:'local'}); currentUser=null; passwordRecovery=false; throw error; }
      } else passwordRecovery=false;
    }
    initialized=true; return {mode,user:currentUser?clone(currentUser):null,passwordRecovery};
  }
  async function login(identifier,secret) {
    if (!initialized) await init();
    if (mode==='demo') {
      const data=readDemo(); const name=String(identifier || '').trim().toLowerCase();
      const found=data.profiles.find(p=>(p.username===name || p.email===name) && p.password===secret && p.active!==false);
      if (!found) throw new Error('El usuario o la contraseña de demostración no son correctos.');
      currentUser=profileOnly(found);
      try { sessionStorage.setItem(SESSION_KEY,found.id); } catch (_) { /* Sesión solo en memoria. */ }
      return clone(currentUser);
    }
    requireCloud();
    const {error}=await client.auth.signInWithPassword({email:email(identifier),password:secret}); fail(error);
    try { return await claim(); }
    catch (error) { await client.auth.signOut({scope:'local'}); throw error; }
  }
  async function signup(input) {
    if (mode==='demo') throw new Error('En demostración, Marina puede añadir usuarios desde Equipo.');
    requireCloud();
    const {data,error}=await client.auth.signUp({email:email(input.email),password:password(input.password),options:{data:{name:requiredText(input.name,'El nombre',100)},emailRedirectTo:redirectUrl()}});
    fail(error);
    // Por seguridad no se concede acceso automáticamente solo por registrarse.
    if (data.session) await client.auth.signOut({scope:'local'});
    return {needsConfirmation:true};
  }
  async function logout() {
    if (client) { const {error}=await client.auth.signOut({scope:'local'}); fail(error); }
    currentUser=null; passwordRecovery=false;
    try { sessionStorage.removeItem(SESSION_KEY); } catch (_) { /* Sin sesión persistente. */ }
  }
  async function load() {
    if (mode==='demo') {
      const data=readDemo(); const user=demoUser(data);
      return clone({profiles:data.profiles.map(profileOnly),tasks:data.tasks,entries:data.entries,invitations:user.role==='admin'?data.invitations:[]});
    }
    requireCloud(); requireLogin(); await claim();
    const [profiles,tasks,entries,invitations]=await Promise.all([
      allRows('nexo_profiles'),allRows('nexo_tasks'),allRows('nexo_time_entries'),currentUser.role==='admin'?allRows('nexo_access','email'):Promise.resolve([])
    ]);
    return {profiles,tasks,entries,invitations};
  }
  async function saveTask(task) {
    requireLogin(); const fields=taskFields(task);
    if (task.id && !UUID_RE.test(task.id)) throw new Error('El identificador del asunto no es válido.');
    if (mode==='demo') {
      const data=readDemo(); const user=demoUser(data);
      if (fields.collaborators.some(id=>!data.profiles.some(p=>p.id===id))) throw new Error('Algún colaborador ya no existe. Actualiza el equipo.');
      const now=new Date().toISOString(); let saved;
      if (task.version!=null) {
        const index=data.tasks.findIndex(t=>t.id===task.id); requireVersion(data.tasks[index],task.version);
        saved={...data.tasks[index],...fields,updated_at:now,version:data.tasks[index].version+1}; data.tasks[index]=saved;
      } else {
        const id=task.id || uuid(); if (data.tasks.some(t=>t.id===id)) throw new Error('Este asunto ya existe. Actualiza el tablero.');
        saved={id,...fields,created_by:user.id,created_at:now,updated_at:now,version:1}; data.tasks.push(saved);
      }
      writeDemo(data); return clone(saved);
    }
    const query=task.version!=null
      ? client.from('nexo_tasks').update(fields).eq('id',task.id).eq('version',task.version)
      : client.from('nexo_tasks').insert({...fields,id:task.id || uuid(),created_by:currentUser.id});
    const {data,error}=await query.select('*').maybeSingle(); fail(error);
    if (!data) requireVersion(null,task.version); return data;
  }
  async function moveTask(id,status,version) {
    requireLogin(); if (!STATES.includes(status)) throw new Error('Selecciona un estado válido.');
    if (mode==='demo') {
      const data=readDemo(); demoUser(data); const row=data.tasks.find(t=>t.id===id); requireVersion(row,version);
      row.status=status; row.version+=1; row.updated_at=new Date().toISOString(); writeDemo(data); return clone(row);
    }
    const {data,error}=await client.from('nexo_tasks').update({status}).eq('id',id).eq('version',version).select('*').maybeSingle();
    fail(error); if (!data) requireVersion(null,version); return data;
  }
  async function deleteTask(id,version) {
    requireLogin();
    if (mode==='demo') {
      const data=readDemo(); demoUser(data); requireVersion(data.tasks.find(t=>t.id===id),version);
      if (data.entries.some(e=>e.task_id===id)) throw new Error('Este asunto tiene horas registradas. Consérvalo como completado para mantener el historial.');
      data.tasks=data.tasks.filter(t=>t.id!==id); writeDemo(data); return;
    }
    const {data,error}=await client.from('nexo_tasks').delete().eq('id',id).eq('version',version).select('id').maybeSingle();
    fail(error); if (!data) requireVersion(null,version);
  }
  async function saveEntry(entry) {
    requireLogin(); const fields=entryFields(entry);
    if (entry.id && !UUID_RE.test(entry.id)) throw new Error('El identificador del registro no es válido.');
    if (mode==='demo') {
      const data=readDemo(); const user=demoUser(data); const now=new Date().toISOString();
      const existing=entry.version!=null?data.entries.find(e=>e.id===entry.id):null;
      if (entry.version!=null) requireVersion(existing,entry.version);
      const userId=existing?existing.user_id:(entry.user_id || user.id);
      if (userId!==user.id && user.role!=='admin') throw new Error('Solo puedes modificar tus propios registros de horas.');
      if (!existing && !data.profiles.some(p=>p.id===userId && p.active!==false)) throw new Error('La persona seleccionada no está activa.');
      if (!data.tasks.some(t=>t.id===fields.task_id)) throw new Error('Este asunto ya no existe. Actualiza los datos.');
      const total=data.entries.filter(e=>e.id!==entry.id && e.user_id===userId && e.work_date===fields.work_date).reduce((sum,e)=>sum+e.minutes,0);
      if (total+fields.minutes>1440) throw new Error('Los registros de una persona no pueden superar 24 horas en un día.');
      let saved;
      if (existing) {
        saved={...existing,...fields,updated_at:now,version:existing.version+1}; data.entries[data.entries.indexOf(existing)]=saved;
      } else {
        const id=entry.id || uuid(); if (data.entries.some(e=>e.id===id)) throw new Error('Este registro ya existe. Actualiza las horas.');
        saved={id,...fields,user_id:userId,created_at:now,updated_at:now,version:1}; data.entries.push(saved);
      }
      writeDemo(data); return clone(saved);
    }
    const query=entry.version!=null
      ? client.from('nexo_time_entries').update(fields).eq('id',entry.id).eq('version',entry.version)
      : client.from('nexo_time_entries').insert({...fields,id:entry.id || uuid(),user_id:entry.user_id || currentUser.id});
    const {data,error}=await query.select('*').maybeSingle(); fail(error);
    if (!data) requireVersion(null,entry.version); return data;
  }
  async function deleteEntry(id,version) {
    requireLogin();
    if (mode==='demo') {
      const data=readDemo(); const user=demoUser(data); const row=data.entries.find(e=>e.id===id);
      if (!row) throw new Error('El registro ya no existe.');
      if (version!=null) requireVersion(row,version);
      if (row.user_id!==user.id && user.role!=='admin') throw new Error('Solo puedes eliminar tus propios registros.');
      data.entries=data.entries.filter(e=>e.id!==id); writeDemo(data); return;
    }
    let query=client.from('nexo_time_entries').delete().eq('id',id);
    if (version!=null) query=query.eq('version',version);
    const {data,error}=await query.select('id').maybeSingle(); fail(error);
    if (!data) throw new Error('No se pudo eliminar el registro. Comprueba tus permisos y actualiza los datos.');
  }
  async function invite(input) {
    requireLogin(); if (mode==='demo') throw new Error('En demostración, utiliza Añadir usuario de prueba.');
    const {data,error}=await client.rpc('nexo_invite',{p_email:email(input.email),p_name:requiredText(input.name,'El nombre',100),p_role:input.role || 'member'}).single();
    fail(error); return data;
  }
  async function revokeInvite(value) {
    requireLogin(); const target=email(value);
    if (mode==='demo') {
      const data=readDemo(); const user=demoUser(data);
      if (user.role!=='admin') throw new Error('Solo la administración puede gestionar accesos.');
      if (user.email===target) throw new Error('No puedes revocar tu propio acceso.');
      const row=data.profiles.find(p=>p.email===target); if (row) row.active=false; writeDemo(data); return;
    }
    const {error}=await client.rpc('nexo_revoke',{p_email:target}); fail(error);
  }
  async function addDemoMember(input) {
    if (mode!=='demo') throw new Error('En modo compartido, autoriza el correo de la persona.');
    const data=readDemo(); const user=demoUser(data);
    if (user.role!=='admin') throw new Error('Solo Marina o una persona administradora puede añadir usuarios.');
    const username=String(input.username || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{3,32}$/.test(username)) throw new Error('El usuario debe tener de 3 a 32 letras sin acentos, números, puntos o guiones.');
    if (data.profiles.some(p=>p.username===username)) throw new Error('Este nombre de usuario ya existe.');
    const saved={id:uuid(),name:requiredText(input.name,'El nombre',100),username,email:username+'@demo.local',role:'member',active:true,password:password(input.password),created_at:new Date().toISOString()};
    data.profiles.push(saved); writeDemo(data); return profileOnly(saved);
  }
  async function resetPassword(value) {
    if (mode==='demo') throw new Error('Las credenciales de demostración aparecen en la pantalla de acceso.');
    requireCloud(); const {error}=await client.auth.resetPasswordForEmail(email(value),{redirectTo:redirectUrl()}); fail(error);
  }
  async function updatePassword(value) {
    requireLogin(); const secret=password(value);
    if (mode==='demo') {
      const data=readDemo(); const user=demoUser(data); user.password=secret; writeDemo(data);
    } else { const {error}=await client.auth.updateUser({password:secret}); fail(error); }
    passwordRecovery=false;
  }
  function subscribe(callback) {
    listeners.add(callback);
    const onStorage=e=>{if(e.key===DATA_KEY) callback();};
    const onResume=()=>{if(!document.hidden && currentUser) callback();};
    window.addEventListener('storage',onStorage); window.addEventListener('focus',onResume); window.addEventListener('online',onResume);
    const interval=mode==='supabase'?setInterval(onResume,Math.max(5000,Number(config.SYNC_INTERVAL_MS)||15000)):null;
    return ()=>{listeners.delete(callback);window.removeEventListener('storage',onStorage);window.removeEventListener('focus',onResume);window.removeEventListener('online',onResume);if(interval)clearInterval(interval);};
  }

  window.NexoData=Object.freeze({init,login,signup,logout,load,saveTask,moveTask,deleteTask,saveEntry,deleteEntry,invite,revokeInvite,addDemoMember,resetPassword,updatePassword,subscribe,uuid,
    get mode(){return mode;},get user(){return currentUser?clone(currentUser):null;},get passwordRecovery(){return passwordRecovery;}
  });
})();
