# Nexo · Organización del equipo

Una web en español para organizar asuntos en un tablero Kanban, asignar colaboradores y registrar el tiempo de cada persona. Está hecha con HTML, CSS y JavaScript editables, sin compilación ni instalación de paquetes.

**Puedes probarla inmediatamente con Marina, Hoda y Antonio. Para que los tres trabajéis desde vuestros ordenadores sobre los mismos datos, activa el modo compartido con Supabase siguiendo esta guía.**

## 1. Qué incluye

- Tablero con cuatro estados, asuntos editables, prioridades, proyectos, fechas y colaboradores.
- Registro de horas asociado a una persona, un asunto, una fecha y una nota.
- Cronómetro local que prepara un registro de tiempo al detenerlo, para revisarlo antes de guardarlo.
- Vista de horas con filtros por fechas, persona y asunto, resúmenes y exportación CSV.
- Vista de equipo y administración de los accesos.
- Diseño adaptable a ordenador y móvil.
- Modo de demostración local y modo compartido conectado a Supabase.

El modo compartido está preparado en el código, pero esta entrega **no crea un proyecto Supabase, cuentas reales ni un repositorio GitHub**, y no se ha conectado a una base de datos tuya. La configuración de las secciones 4 y 5 es necesaria antes de usarlo entre distintos dispositivos.

## 2. Archivos

| Archivo | Para qué sirve |
| --- | --- |
| `index.html` | Estructura de la página y formularios de acceso. |
| `styles.css` | Colores, tipografía, tamaños y distribución visual. |
| `app.js` | Tablero, vistas, formularios, filtros, cronómetro y exportación. |
| `data.js` | Datos de demostración y conexión con la base de datos y la autenticación. |
| `config.js` | Selección entre demostración y Supabase, URL y clave pública. |
| `supabase.sql` | Tablas, reglas de acceso y operaciones de la versión compartida. |
| `README.md` | Esta guía. |

Conserva los cinco archivos de la web en la misma carpeta. Las rutas son relativas para que funcionen también en una dirección de proyecto de GitHub Pages.

## 3. Probar la demostración

1. Descomprime el proyecto.
2. En Visual Studio Code, selecciona **Archivo → Abrir carpeta** y abre `nexo-equipo`.
3. Abre `index.html` en un navegador. También puedes servir esa carpeta con la extensión Live Server de VS Code.
4. Entra con una de estas cuentas.

| Persona | Usuario de demostración | Contraseña de demostración | Rol |
| --- | --- | --- | --- |
| Marina | `marina` | `MarinaDemo2026!` | Administradora |
| Hoda | `hoda` | `HodaDemo2026!` | Miembro |
| Antonio | `antonio` | `AntonioDemo2026!` | Miembro |

Estas contraseñas aparecen en el código porque son **solo para la demostración**. No las reutilices en las cuentas reales.

Prueba a abrir un asunto, cambiarlo de estado, asignar dos colaboradores y registrar tiempo. Después cierra sesión y entra como otra persona. En el mismo navegador verás los datos compartidos de esa demostración.

### Dónde se guardan los cambios en la demostración

Los cambios se guardan en `localStorage`, dentro de ese navegador y esa dirección. No se envían a otros ordenadores. Otro navegador, otro dispositivo o una dirección diferente tendrán una demostración independiente. Borrar los datos del sitio puede eliminar estos cambios. El modo local no protege información confidencial ni constituye un sistema de autenticación seguro.

Al activar Supabase empezarás con una base de datos compartida vacía. Los asuntos y horas de prueba no se trasladan automáticamente.

## 4. Publicar los archivos en GitHub Pages

GitHub Pages publica HTML, CSS y JavaScript. Para esta aplicación alojará la interfaz, mientras que Supabase guardará los datos compartidos y gestionará las cuentas. Puedes publicar primero la demostración para comprobar la dirección y después activar Supabase. [Descripción oficial de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).

1. Crea un repositorio GitHub, por ejemplo `nexo-equipo`.
2. Sube a su raíz `index.html`, `styles.css`, `app.js`, `data.js` y `config.js`. Puedes conservar también esta guía y `supabase.sql`, sin introducir datos o contraseñas personales en ellos.
3. Guarda los archivos en la rama `main`.
4. Abre **Settings → Pages**.
5. En **Build and deployment → Source**, elige **Deploy from a branch**.
6. Selecciona la rama `main` y la carpeta **/(root)**. Pulsa **Save**.
7. Espera a que GitHub muestre la dirección publicada, normalmente con esta forma.

```text
https://TU_USUARIO.github.io/nexo-equipo/
```

Usa la dirección que te dé GitHub. Si cambias el nombre del repositorio, cambiará su ruta. Mantén `index.html` en la carpeta elegida como origen de publicación. [Configuración oficial de la publicación](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

Los cambios posteriores se publican al guardar y subir una nueva versión a esa rama. Puedes editar los archivos en VS Code y usar su panel **Control de código fuente**, o subir los archivos modificados desde GitHub.

## 5. Activar datos y cuentas compartidos

### Paso A. Crear el proyecto Supabase

1. Abre [Supabase](https://supabase.com/dashboard) y crea un proyecto para este equipo.
2. Cuando el proyecto esté disponible, abre **SQL Editor**.
3. Copia y ejecuta el contenido completo de `supabase.sql` en ese proyecto nuevo.

Ejecuta el script completo una sola vez. Es una instalación inicial, no una migración que deba repetirse. El archivo crea las tablas de Nexo y sus reglas de acceso. Utiliza un proyecto dedicado o revisa el SQL antes de ejecutarlo sobre una base de datos que ya contenga otras aplicaciones.

### Paso B. Autorizar el correo de Marina como administradora

Al final del SQL hay un ejemplo comentado para el primer acceso. Ejecuta en el **SQL Editor** una consulta como esta, sustituyendo el marcador por el correo real de Marina.

```sql
insert into public.nexo_access (email, name, role)
values (lower('CAMBIA_POR_TU_EMAIL_REAL'), 'Marina', 'admin');
```

Es una autorización para entrar, no crea todavía una cuenta ni asigna una contraseña. El correo autorizado debe coincidir con el de la cuenta de autenticación. Realiza la sustitución en el editor de Supabase, de modo que el archivo que subas a GitHub pueda conservar su marcador de ejemplo.

### Paso C. Configurar la autenticación

En la sección **Authentication** de Supabase, comprueba que el acceso por **Email** está habilitado y conserva **Confirm email** activado. Para el registro desde la web también debe estar permitido crear nuevos usuarios.

En **Authentication → URL Configuration**, configura la dirección publicada por GitHub Pages como **Site URL** y añádela también a **Redirect URLs**. Incluye el nombre del repositorio y la barra final.

```text
https://TU_USUARIO.github.io/nexo-equipo/
```

Si abres habitualmente la web terminando en `/index.html`, añade también esa dirección exacta a las redirecciones permitidas. Para trabajar con Live Server, añade además su URL local exacta. La configuración de estas direcciones determina dónde vuelven los enlaces de confirmación y recuperación. [Guía oficial de redirecciones](https://supabase.com/docs/guides/auth/redirect-urls).

### Paso D. Conectar `config.js`

Obtén la **Project URL** y una **publishable key** del proyecto Supabase. Completa `config.js` manteniendo esta estructura.

```javascript
window.NEXO_CONFIG = {
  MODE: "supabase",
  SUPABASE_URL: "https://TU_PROYECTO.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_SUSTITUYE_POR_TU_CLAVE_PUBLICA",
  SYNC_INTERVAL_MS: 15000
};
```

El nombre `SUPABASE_ANON_KEY` se conserva en el código, pero admite la clave pública moderna `sb_publishable_...`. También admite una clave `anon` heredada. **No pongas una clave `service_role`, `sb_secret_...`, la contraseña de la base de datos ni contraseñas personales en estos archivos.** Las claves públicas están diseñadas para el navegador y las reglas de la base de datos determinan qué puede hacer cada sesión. [Documentación oficial de claves](https://supabase.com/docs/guides/getting-started/api-keys).

Guarda el archivo y vuelve a subirlo a GitHub. Cuando la publicación termine, abre la web y comprueba que utiliza el modo compartido. Si la conexión falla, la aplicación muestra el error y no cambia silenciosamente a la demostración.

### Paso E. Elegir cómo crear las cuentas reales

Hay dos opciones. La primera permite probar rápidamente con tres personas conocidas. La segunda permite que nuevos miembros se registren por sí mismos y recuperen su contraseña por correo.

#### Opción 1. Crear las tres cuentas desde Supabase

La propietaria del proyecto puede crear las cuentas manualmente, sin un correo de confirmación.

1. En Supabase, abre **Authentication → Users → Add user → Create new user**.
2. Introduce el correo real de Marina y una contraseña privada distinta de la demostración.
3. Marca la confirmación del usuario, normalmente **Auto Confirm User**, después de comprobar que se trata del correo correcto de la persona conocida.
4. Crea la cuenta. Entra en Nexo con ese correo completo y esa contraseña.
5. Desde la vista **Equipo**, autoriza los correos reales de Hoda y Antonio como miembros.
6. Crea sus cuentas en **Authentication → Users** del mismo modo. Cada cuenta debe usar exactamente el correo autorizado.
7. Facilita a cada persona su acceso por un medio privado. Los tres podéis entrar desde vuestros dispositivos en la misma URL.

Esta confirmación manual la realiza la administradora dentro de Supabase. Mantén activada la confirmación de correo para el registro público de la web. No desactives esa comprobación como solución a un problema de envío.

Supabase admite la creación administrativa de usuarios y la confirmación explícita de su correo. Estas operaciones privilegiadas no se ejecutan desde los archivos públicos de Nexo. [Referencia oficial de creación administrativa](https://supabase.com/docs/reference/javascript/auth-admin-createuser).

#### Opción 2. Registro individual con confirmación por correo

Configura un servicio **SMTP personalizado** en Supabase para que pueda enviar las confirmaciones y los mensajes de recuperación a tu equipo. El SMTP de prueba de Supabase solo envía a direcciones pertenecientes a la organización del proyecto Supabase y tiene límites estrictos. Ser miembro autorizado en Nexo no convierte a una persona en miembro de esa organización. [Configuración oficial de SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

Una vez configurado el envío, sigue esta secuencia.

1. Marina abre la web, selecciona el registro e introduce su nombre, el correo autorizado en el paso B y una contraseña privada.
2. Confirma su correo mediante el enlace recibido y entra en Nexo.
3. En **Equipo**, Marina autoriza los correos de Hoda y Antonio.
4. Hoda y Antonio abren la misma web y se registran con sus respectivos correos autorizados.
5. Cada persona confirma su correo y accede con correo y contraseña.

**Autorizar o invitar a alguien desde Nexo no envía un mensaje.** Registra el permiso para entrar. Comparte la URL con esa persona, que puede crear después su cuenta. El mensaje de confirmación lo envía Supabase cuando se solicita el registro.

La versión real utiliza el correo como identificador de acceso. Los usuarios cortos `marina`, `hoda` y `antonio` pertenecen únicamente a la demostración.

## 6. Añadir más personas y gestionar permisos

Una administradora puede autorizar nuevos correos desde **Equipo**. Después, crea las cuentas manualmente o permite que esas personas se registren con confirmación por correo, según la opción que hayas elegido.

| Acción | Miembro | Administradora |
| --- | --- | --- |
| Consultar los asuntos y las horas del equipo | Sí | Sí |
| Crear y editar asuntos y colaboradores | Sí | Sí |
| Registrar sus propias horas | Sí | Sí |
| Editar o borrar sus propios registros de tiempo | Sí | Sí |
| Gestionar registros de tiempo de otras personas | No | Sí |
| Autorizar o revocar accesos | No | Sí |

Cada equipo comparte una única base de asuntos. Esta versión no separa varios equipos ni incorpora permisos particulares por proyecto.

La revocación impide acceder de nuevo a los datos compartidos, conservando los registros históricos. No puede borrar información que una persona ya haya visto o exportado. La aplicación impide que la administradora revoque accidentalmente su propio acceso.

Las reglas se aplican en la base de datos mediante RLS, además de los controles de interfaz. Un visitante sin autorización no obtiene acceso a los asuntos por conocer la URL de la web. [Introducción oficial a RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).

## 7. Cómo trabajar a diario

### Organizar los asuntos

Crea un asunto con un título claro, un proyecto y las personas que colaboran en él. La estimación ayuda a comparar el esfuerzo previsto con las horas registradas. Mueve la tarjeta entre estados o cambia el estado desde el formulario de edición, también disponible en móvil y con teclado.

Las horas pertenecen a sus registros individuales. Asignar una segunda persona a un asunto no duplica las horas ya registradas. Para eliminar un asunto con tiempo asociado, primero deben resolverse sus registros de horas. Si quieres conservar el histórico, déjalo en el estado final.

### Registrar y consultar las horas

Introduce tiempo manualmente o inicia el cronómetro para un asunto. Al detenerlo, revisa el tiempo propuesto antes de guardarlo. El cronómetro es local, no una sesión compartida entre dispositivos. Solo el registro guardado aparece en los resúmenes del equipo.

Usa los filtros de la vista de horas para seleccionar el periodo, la persona o el asunto. La exportación CSV contiene los registros que correspondan a esos filtros y puede abrirse con Excel, LibreOffice o Google Sheets. Los tiempos se guardan en minutos completos, con un máximo de 24 horas por persona y fecha. El cronómetro redondea al minuto siguiente y sigue contando aunque cierres la pestaña. Si una sesión cruza medianoche, reparte el tiempo entre las fechas correspondientes antes de registrarlo. Las contraseñas de las cuentas nuevas deben tener entre 12 y 128 caracteres.

### Cambios de otros compañeros

En modo compartido, la aplicación consulta las novedades aproximadamente cada 15 segundos mientras está abierta. También puedes actualizar manualmente. No necesita activar Supabase Realtime. Una mala conexión o una pestaña en segundo plano pueden retrasar la actualización.

Si dos personas editan el mismo registro a la vez, el control de versiones detecta una edición desactualizada. Vuelve a cargar la información y aplica tu modificación sobre la versión vigente. No es un editor simultáneo de texto.

## 8. Personalizarla en VS Code

| Quieres cambiar | Archivo principal |
| --- | --- |
| Nombre y textos fijos de la web | `index.html` y `app.js` |
| Colores, anchuras y tamaños | Variables y reglas de `styles.css` |
| Datos y cuentas ficticias de prueba | Datos iniciales de `data.js` |
| Modo, URL y clave pública | `config.js` |
| Funciones de las vistas y formularios | `app.js` |
| Reglas de permisos o modelo de datos compartido | `supabase.sql` y `data.js` |

Cambiar los datos iniciales de la demostración en el código no reemplaza automáticamente los que tu navegador ya guardó. Para ver una demostración nueva, utiliza otro perfil de navegador o borra únicamente los datos locales de ese sitio, sabiendo que perderás los cambios de prueba.

Si cambias la estructura de la base de datos después de empezar a trabajar, prepara una migración concreta. No elimines y vuelvas a crear las tablas con datos reales para aplicar un cambio visual.

## 9. Comprobar que el equipo comparte los datos

Después de configurar Supabase, realiza una prueba con dos navegadores o dispositivos distintos.

1. Entra como Marina y crea un asunto llamado `Prueba del equipo`.
2. Entra como Hoda desde el segundo navegador y actualiza el tablero.
3. Comprueba que aparece el asunto, asígnate como colaboradora y registra 30 minutos.
4. Vuelve a Marina y comprueba el registro en la vista de horas.
5. Cierra sesión y recarga la página para comprobar que vuelve a solicitar acceso.
6. Prueba una cuenta con un correo que no esté autorizado y comprueba que no puede entrar al espacio de trabajo.

Estas comprobaciones se realizan contra tu proyecto real. Las pruebas locales de demostración no verifican tus ajustes particulares de Supabase, SMTP o GitHub.

## 10. Problemas habituales

| Qué ocurre | Qué revisar |
| --- | --- |
| Hoda no ve los cambios de Marina | Comprueba que ambas abren la misma web en modo Supabase y que el `config.js` publicado apunta al mismo proyecto. En demostración los datos son locales. |
| La web se ve sin estilo o aparece un 404 | Revisa que los cinco archivos estén juntos y que Pages publique la carpeta donde está `index.html`. Respeta mayúsculas y minúsculas en los nombres. |
| No se puede entrar con `marina` | En modo real se entra con el correo completo. Los nombres cortos solo funcionan en la demostración. |
| El correo no está autorizado para el equipo | La administradora debe autorizar exactamente ese correo en Nexo o en `nexo_access`. |
| Supabase indica que el correo no está confirmado | Confirma el enlace recibido o revisa la cuenta creada manualmente por la propietaria. Mantén activa la confirmación para los registros de la web. |
| No llega el email o aparece `Email address not authorized` | Revisa SMTP, los límites del proveedor y la carpeta de correo no deseado. El SMTP de prueba no envía libremente a todos los usuarios de la app. |
| El enlace de email lleva a `localhost` o a una dirección equivocada | Corrige Site URL y Redirect URLs, incluyendo la ruta del repositorio. Solicita un nuevo enlace. |
| Error de permisos o tablas inexistentes | Comprueba que ejecutaste `supabase.sql` completo en el mismo proyecto al que apunta `config.js`. No desactives RLS para solucionarlo. |
| Un cambio no se guarda por conflicto | Actualiza los datos y reabre el registro. Otro compañero puede haber guardado una versión posterior. |
| No permite borrar un asunto | Revisa si tiene horas asociadas. Conservar el asunto mantiene la relación con su histórico. |
| GitHub muestra una versión anterior | Comprueba la publicación en la pestaña Actions y vuelve a cargar la página después de que finalice. |

## 11. Alcance de esta versión

Es una aplicación para un equipo pequeño con un espacio de trabajo compartido. No incluye archivos adjuntos, comentarios, facturación, notificaciones por correo sobre tareas ni una auditoría completa de cada modificación. La exportación de horas permite descargar los registros visibles, pero no sustituye una copia de seguridad de toda la base de datos.

En modo compartido hace falta conexión para consultar y guardar cambios. No hay una cola de escrituras sin conexión. Revisa los límites y condiciones de tus servicios de Supabase, correo y GitHub cuando decidas utilizarlos de forma continuada.


## 11. Comprobaciones de esta entrega

Se ha comprobado la sintaxis de los tres archivos JavaScript y el flujo de demostración en navegador. Las comprobaciones incluyen iniciar sesión como Marina y Hoda, crear asuntos con varios colaboradores, buscar y arrastrar tarjetas, guardar horas, comprobar sumas y filtros, guardar una sesión de cronómetro, exportar CSV y conservar los cambios después de recargar. También se revisó la distribución a un ancho móvil de 390 píxeles.

La capa de datos de demostración se verificó además con conflictos de versión, propiedad de registros, límite diario, conservación de asuntos con horas y edición del histórico tras retirar un acceso. El SQL se ha revisado; la conexión real, los correos y la publicación deben verificarse con vuestro proyecto y la prueba de la sección 9.
