/* NEXO · Configuración que puedes editar sin tocar el resto de la aplicación.
 * 1. Prueba la web con MODE: 'demo'. Los datos se quedan en este navegador.
 * 2. Ejecuta supabase.sql y sigue README.md para el modo compartido.
 * 3. Usa una clave PUBLICABLE (sb_publishable_...) o anon, nunca una secret/service_role.
 * La protección de los datos la aplican las políticas SQL, no ocultar esta clave.
 */
window.NEXO_CONFIG = Object.freeze({
  MODE: 'demo',                 // 'demo' o 'supabase'
  SUPABASE_URL: '',              // https://tu-proyecto.supabase.co
  SUPABASE_ANON_KEY: '',         // Clave pública/publicable del proyecto
  SYNC_INTERVAL_MS: 15000        // Actualizar cambios compartidos cada 15 segundos
});
