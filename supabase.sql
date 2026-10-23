-- NEXO · Ejecutar una vez en SQL Editor de un proyecto NUEVO de Supabase.
-- Las tablas tienen prefijo nexo_ para no mezclarse con otras aplicaciones.
-- No contiene contraseñas. Lee el paso de bootstrap al final del archivo.
-- El mismo proyecto representa UN equipo. No es un producto multiempresa.

begin;

create schema if not exists nexo_private;
revoke all on schema nexo_private from public, anon;
grant usage on schema nexo_private to authenticated;

create table public.nexo_access (
  email text primary key check (email = lower(trim(email)) and email like '%@%'),
  name text not null check (char_length(trim(name)) between 1 and 100),
  role text not null default 'member' check (role in ('admin', 'member')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.nexo_profiles (
  id uuid primary key references auth.users(id) on delete restrict,
  email text not null unique,
  name text not null check (char_length(trim(name)) between 1 and 100),
  role text not null default 'member' check (role in ('admin', 'member')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.nexo_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(trim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 5000),
  project text not null default 'General' check (char_length(trim(project)) between 1 and 80),
  status text not null default 'todo' check (status in ('todo','doing','review','done')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  due_date date,
  estimated_minutes integer not null default 0 check (estimated_minutes between 0 and 600000),
  collaborators uuid[] not null default '{}'::uuid[] check (cardinality(collaborators) <= 100),
  created_by uuid not null default auth.uid() references public.nexo_profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0)
);

create table public.nexo_time_entries (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.nexo_tasks(id) on delete restrict,
  user_id uuid not null default auth.uid() references public.nexo_profiles(id),
  work_date date not null default current_date,
  minutes integer not null check (minutes between 1 and 1440),
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  version integer not null default 1 check (version > 0)
);

create index nexo_tasks_status_idx on public.nexo_tasks(status);
create index nexo_entries_task_idx on public.nexo_time_entries(task_id);
create index nexo_entries_user_date_idx on public.nexo_time_entries(user_id, work_date);

-- La membresía se comprueba con el correo ACTUAL confirmado de Supabase Auth.
-- Ni user_metadata ni los campos enviados por el navegador conceden permisos.
create function nexo_private.is_member()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    join public.nexo_access a on a.email = lower(u.email)
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null and a.active
  );
$$;

create function nexo_private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from auth.users u
    join public.nexo_access a on a.email = lower(u.email)
    where u.id = (select auth.uid()) and u.email_confirmed_at is not null
      and a.active and a.role = 'admin'
  );
$$;

revoke all on function nexo_private.is_member() from public, anon;
revoke all on function nexo_private.is_admin() from public, anon;
grant execute on function nexo_private.is_member() to authenticated;
grant execute on function nexo_private.is_admin() to authenticated;

-- Registrar el perfil solo cuando el correo esté autorizado y confirmado.
create function public.nexo_claim_membership()
returns public.nexo_profiles language plpgsql security definer set search_path = '' as $$
declare
  v_email text;
  v_confirmed timestamptz;
  v_access public.nexo_access;
  v_profile public.nexo_profiles;
begin
  perform pg_advisory_xact_lock(94622021);
  if auth.uid() is null then raise exception 'NEXO_AUTH: Inicia sesión para continuar.'; end if;
  select lower(email), email_confirmed_at into v_email, v_confirmed from auth.users where id = auth.uid();
  if v_confirmed is null then raise exception 'NEXO_CONFIRM: Confirma tu correo antes de entrar.'; end if;
  select * into v_access from public.nexo_access where email = v_email and active;
  if not found then raise exception 'NEXO_ACCESS: Tu correo no está autorizado. Pide acceso a la persona administradora.'; end if;
  insert into public.nexo_profiles(id,email,name,role,active)
    values(auth.uid(),v_email,v_access.name,v_access.role,true)
  on conflict(id) do update set email=excluded.email, name=excluded.name, role=excluded.role, active=true
    where (nexo_profiles.email,nexo_profiles.name,nexo_profiles.role,nexo_profiles.active)
      is distinct from (excluded.email,excluded.name,excluded.role,excluded.active);
  select * into v_profile from public.nexo_profiles where id = auth.uid();
  return v_profile;
end;
$$;

-- Autorizar un correo NO envía un email. Comparte la URL con la persona.
create function public.nexo_invite(p_email text, p_name text, p_role text default 'member')
returns public.nexo_access language plpgsql security definer set search_path = '' as $$
declare v_result public.nexo_access; v_self text;
begin
  perform pg_advisory_xact_lock(94622021);
  if not nexo_private.is_admin() then raise exception 'NEXO_ADMIN: Solo la administración puede gestionar accesos.'; end if;
  p_email := lower(trim(p_email)); p_name := trim(p_name);
  if p_email is null or p_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    then raise exception 'NEXO_EMAIL: Escribe un correo válido.'; end if;
  if p_name is null or char_length(p_name) not between 1 and 100
    then raise exception 'NEXO_NAME: El nombre debe tener entre 1 y 100 caracteres.'; end if;
  if p_role is null or p_role not in ('admin','member') then raise exception 'NEXO_ROLE: Rol no válido.'; end if;
  select lower(email) into v_self from auth.users where id=auth.uid();
  if p_email=v_self and p_role<>'admin' then raise exception 'NEXO_SELF: No puedes quitarte tu propio rol de administración.'; end if;
  insert into public.nexo_access(email,name,role,active) values(p_email,p_name,p_role,true)
    on conflict(email) do update set name=excluded.name,role=excluded.role,active=true returning * into v_result;
  update public.nexo_profiles set name=p_name,role=p_role,active=true where email=p_email;
  return v_result;
end;
$$;

create function public.nexo_revoke(p_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_self text;
begin
  perform pg_advisory_xact_lock(94622021);
  if not nexo_private.is_admin() then raise exception 'NEXO_ADMIN: Solo la administración puede gestionar accesos.'; end if;
  p_email := lower(trim(p_email));
  select lower(email) into v_self from auth.users where id=auth.uid();
  if p_email=v_self then raise exception 'NEXO_SELF: No puedes revocar tu propio acceso.'; end if;
  update public.nexo_access set active=false where email=p_email;
  update public.nexo_profiles set active=false where email=p_email;
end;
$$;

-- Versiones: una edición incrementa version. El cliente compara la versión
-- que abrió y avisa si otra persona guardó antes, evitando sobreescrituras.
create function nexo_private.version_row()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.version := 1; new.created_at := now();
  else
    new.version := old.version+1; new.created_at := old.created_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create function nexo_private.validate_collaborators()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists (
    select 1 from unnest(new.collaborators) x
    where x is null or not exists(select 1 from public.nexo_profiles p where p.id=x)
  ) then raise exception 'NEXO_COLLABORATOR: Selecciona colaboradores registrados en el equipo.'; end if;
  return new;
end;
$$;

-- Las altas requieren una persona activa. La administración puede corregir
-- registros históricos de una persona revocada; la autoría permanece fija.
-- El bloqueo serializa guardados simultáneos de horas de una persona/día.
create function nexo_private.validate_entry()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_total bigint;
begin
  if tg_op='INSERT' and not exists(
    select 1 from public.nexo_profiles p
    join auth.users u on u.id=p.id
    join public.nexo_access a on a.email=lower(u.email)
    where p.id=new.user_id and p.active and a.active and u.email_confirmed_at is not null
  )
    then raise exception 'NEXO_PERSON: La persona seleccionada no está activa.'; end if;
  if tg_op='UPDATE' and new.user_id<>old.user_id
    then raise exception 'NEXO_OWNER: No se puede cambiar la autoría de un registro.'; end if;
  perform pg_advisory_xact_lock(hashtextextended(new.user_id::text||':'||new.work_date::text,0));
  select coalesce(sum(minutes),0) into v_total from public.nexo_time_entries
    where user_id=new.user_id and work_date=new.work_date and id<>new.id;
  if v_total+new.minutes>1440 then raise exception 'NEXO_HOURS: Los registros de una persona no pueden superar 24 horas en un día.'; end if;
  return new;
end;
$$;

revoke all on function nexo_private.version_row() from public,anon,authenticated;
revoke all on function nexo_private.validate_collaborators() from public,anon,authenticated;
revoke all on function nexo_private.validate_entry() from public,anon,authenticated;

create trigger nexo_tasks_version before insert or update on public.nexo_tasks
  for each row execute function nexo_private.version_row();
create trigger nexo_tasks_collaborators before insert or update on public.nexo_tasks
  for each row execute function nexo_private.validate_collaborators();
create trigger nexo_entries_version before insert or update on public.nexo_time_entries
  for each row execute function nexo_private.version_row();
create trigger nexo_entries_validate before insert or update on public.nexo_time_entries
  for each row execute function nexo_private.validate_entry();

alter table public.nexo_access enable row level security;
alter table public.nexo_profiles enable row level security;
alter table public.nexo_tasks enable row level security;
alter table public.nexo_time_entries enable row level security;

create policy nexo_access_read on public.nexo_access for select to authenticated
  using ((select nexo_private.is_admin()));
create policy nexo_profiles_read on public.nexo_profiles for select to authenticated
  using ((select nexo_private.is_member()));
create policy nexo_tasks_read on public.nexo_tasks for select to authenticated
  using ((select nexo_private.is_member()));
create policy nexo_tasks_insert on public.nexo_tasks for insert to authenticated
  with check ((select nexo_private.is_member()) and created_by=(select auth.uid()));
create policy nexo_tasks_update on public.nexo_tasks for update to authenticated
  using ((select nexo_private.is_member())) with check ((select nexo_private.is_member()));
create policy nexo_tasks_delete on public.nexo_tasks for delete to authenticated
  using ((select nexo_private.is_member()));
create policy nexo_entries_read on public.nexo_time_entries for select to authenticated
  using ((select nexo_private.is_member()));
create policy nexo_entries_insert on public.nexo_time_entries for insert to authenticated
  with check ((select nexo_private.is_member()) and (user_id=(select auth.uid()) or (select nexo_private.is_admin())));
create policy nexo_entries_update on public.nexo_time_entries for update to authenticated
  using ((select nexo_private.is_member()) and (user_id=(select auth.uid()) or (select nexo_private.is_admin())))
  with check ((select nexo_private.is_member()) and (user_id=(select auth.uid()) or (select nexo_private.is_admin())));
create policy nexo_entries_delete on public.nexo_time_entries for delete to authenticated
  using ((select nexo_private.is_member()) and (user_id=(select auth.uid()) or (select nexo_private.is_admin())));

-- Quitar permisos automáticos amplios; conceder solo lo que usa la web.
revoke all on public.nexo_access,public.nexo_profiles,public.nexo_tasks,public.nexo_time_entries from public,anon,authenticated;
grant select on public.nexo_access,public.nexo_profiles,public.nexo_tasks,public.nexo_time_entries to authenticated;
grant insert(id,title,description,project,status,priority,due_date,estimated_minutes,collaborators,created_by)
  on public.nexo_tasks to authenticated;
grant update(title,description,project,status,priority,due_date,estimated_minutes,collaborators)
  on public.nexo_tasks to authenticated;
grant delete on public.nexo_tasks to authenticated;
grant insert(id,task_id,user_id,work_date,minutes,note) on public.nexo_time_entries to authenticated;
grant update(task_id,work_date,minutes,note) on public.nexo_time_entries to authenticated;
grant delete on public.nexo_time_entries to authenticated;

revoke all on function public.nexo_claim_membership() from public,anon;
revoke all on function public.nexo_invite(text,text,text) from public,anon;
revoke all on function public.nexo_revoke(text) from public,anon;
grant execute on function public.nexo_claim_membership() to authenticated;
grant execute on function public.nexo_invite(text,text,text) to authenticated;
grant execute on function public.nexo_revoke(text) to authenticated;

commit;

-- PASO FINAL · Autorizar el primer acceso (ejecutar aparte tras sustituir).
-- Usa el correo REAL de Marina en minúsculas. No uses las cuentas demo.
-- Descomenta estas líneas, sustituye el correo y ejecútalas en SQL Editor.
-- insert into public.nexo_access (email,name,role)
-- values ('CAMBIA_POR_TU_EMAIL_REAL','Marina','admin');
--
-- Opcional: autorizar los otros dos correos antes del primer inicio.
-- insert into public.nexo_access (email,name,role) values
-- ('correo.real.de.hoda@tu-dominio.es','Hoda','member'),
-- ('correo.real.de.antonio@tu-dominio.es','Antonio','member');
--
-- Después, cada persona usa «Crear cuenta» en la web, confirma su correo y
-- entra con su contraseña privada. Marina puede autorizar más correos en Equipo.
-- Mantén Email confirmations activado en Authentication y configura SMTP.
-- Site URL y Redirect URLs deben incluir la URL exacta de GitHub Pages.
