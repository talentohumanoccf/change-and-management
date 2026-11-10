# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Aplicación de una sola página para dinamizar una sesión presencial de gestión del cambio
(«Encuentro de Líderes», Comfamiliar Risaralda). Un facilitador proyecta la pantalla y los
participantes entran desde el celular con un código QR. Son tres archivos:

- `index.html` (~3300 líneas): la aplicación; marcado, estilos y un único
  `<script type="module">`.
- `session-content.js`: contenido compartido (`MOODS`, `COLABORADOR_STEPS`, cálculo del
  perfil de Prisma), expuesto en `window.SESSION_CONTENT`. Es un script
  clásico y no un módulo para que cargue también al abrir el archivo desde el disco. Las
  preguntas de las encuestas se editan aquí.
- `results-dashboard.html`: resumen de la sesión, de solo lectura y en vivo. Muestra solo
  totales, nunca nombres ni respuestas individuales. Se abre desde el botón «Tablero» de la
  barra del facilitador.

## Comandos

No hay build, linter, pruebas ni `package.json`. Las dependencias llegan por CDN
(Tailwind, Chart.js, html2canvas, Font Awesome, Firebase 11.6.1 como módulos ES).

- Ejecutar: servir la carpeta con cualquier servidor estático (por ejemplo
  `python -m http.server 8000`) y abrir `index.html`. Hace falta internet para los CDN.
- Verificar un cambio: a mano en el navegador, con dos pestañas (una como facilitador y otra
  como participante) para comprobar la sincronización, y en ancho de celular.
- `env.js` y `firebase-config.js` se cargan en `<head>` y no están versionados. El segundo
  define `window.__firebase_config` (objeto o JSON como texto); sin él, `index.html` arranca
  en modo local y el tablero muestra un error de conexión. `env.js` puede definir
  `window.GEMINI_API_KEY` y `window.__app_id`.

## Arquitectura

### Cuatro vistas, una visible

Las vistas son secciones hermanas que se alternan con la clase `hidden`; no hay router ni URL
por vista:

| Sección (`id`) | Actividad (`activeActivity`) | Contenido |
| --- | --- | --- |
| `welcome-cover` | `welcome` | Portada |
| `team-mood-main` | `team-mood` | Árbol de emociones: 30 puestos (`TREE_POSITIONS_30`), cada participante ocupa uno con su nombre y un estado de `MOODS` |
| `prisma-main` | `prisma` | Evaluación de pensamiento convergente/divergente con temporizador (`setupPensamientoAssessment`) |
| `colaborador-main` | `colaborador` | Encuestas en vivo por pasos, tipo Mentimeter (`COLABORADOR_STEPS`, `renderColaboradorStep`) |

Cada vista tiene su función `navigateTo*(fromRemote)`. Al agregar una vista hay que tocar
**todas** las `navigateTo*` (cada una oculta a mano a las demás), el listener de `routing` en
`initFirebase` y `updateAdminUIVisibility`.

### Sala sincronizada por Firestore

El facilitador gobierna qué ve toda la sala. El estado compartido está en Firestore bajo
`/artifacts/${appId}/public/data/`:

- `session-control/routing` (un documento): `activeActivity`, `mentiStep`, `mentiRevealed`.
  Lo escribe el facilitador (`broadcastFacilitatorRouting`, `setMentiStep`); todos los
  clientes lo escuchan y navegan solos. `toggleMentiReveal` y `freeSlot` existen pero nadie
  los llama.
- `team-mood-30`: un documento por puesto del árbol (`index`, `userId`, `name`, `mood`).
- `menti-colaborador`: un documento por usuario con sus votos. Un voto no se puede cambiar
  (`submitMentiVote` lo bloquea con `myMentiVotes`).
- `pensamiento-assessment`: puntajes individuales, de los que sale el resultado grupal.

Reglas que no se ven a simple vista:

- `navigateTo*(fromRemote = true)` es la navegación disparada por el listener: no vuelve a
  publicar. Solo publica el facilitador cuando navega él mismo. Romper esa distinción crea
  un bucle de escrituras.
- El listener de `routing` aplica la primera instantánea solo si es reciente
  (`ROUTING_FRESH_MS`, 3 horas): quien entra tarde o recarga se une a la actividad en curso,
  y un estado de otra sesión se ignora. Las siguientes son cambios en vivo y se aplican
  siempre; no filtrarlas por hora, porque el reloj del celular difiere del reloj del
  facilitador.
- Los repintados disparados por Firestore en la vista de encuestas pasan por
  `renderColaboradorStepFromRemote`, que espera mientras alguien escribe en la nube de
  palabras; `renderColaboradorStep` repinta todo con `innerHTML`.
- El facilitador no es arrastrado por el listener, salvo en la primera instantánea: al
  recargar vuelve a la actividad en curso (`followsRoom`).
- `currentMentiStep` lo fija la sala. Entrar a la vista de encuestas no lo reinicia; solo
  vuelve a cero al reiniciar los votos.
- Las actividades se desbloquean en cadena (`isPrismaUnlocked`, `isColaboradorUnlocked`).

### Modo sin conexión

Si `initFirebase` falla, `window.onload` cae a `initOfflineStorage`: el estado vive en
`localStorage` (`team_mood_state_${appId}`) y no hay sincronización. Esto no cubre un fallo
del CDN de Firebase: los `import` están al inicio del módulo y, si no cargan, no se ejecuta
nada. `isConnected` se fija una sola vez al arrancar. Por eso toda escritura
remota va detrás de `if (isConnected && db)` y actualiza primero el estado local; mantener
ese patrón al agregar escrituras.

### Modo facilitador

`promptAdminAction(onAuthorized, options)` es la única puerta: pide la clave, activa
`isFacilitatorMode` (persistido en `sessionStorage`) y ejecuta la acción. Toda acción de
facilitador o destructiva (reiniciar, lanzar actividad, borrar votos) pasa por ahí. Con el
modo ya activo la acción corre sin preguntar, salvo con `requireReauth: true`, que vuelve a
pedir la clave: lo llevan los tres reinicios que borran datos y debe llevarlo cualquier
acción destructiva nueva. `updateAdminUIVisibility` centraliza qué controles
se muestran. La clave se compara en el cliente: es una barrera de uso, no de seguridad, y
las reglas de Firestore son la única protección real de los datos.

Atajos del facilitador en la vista de encuestas: `→`/`PageDown`/`L` avanza, `←`/`PageUp`/`J`
retrocede, `R`/`↓` alterna los resultados solo en la pantalla del facilitador.

### Análisis con IA

`generateAIAnalysis(prompt)` llama a la API de Gemini directamente desde el navegador y
prueba varios modelos en orden; devuelve `null` si todos fallan. El único llamador (el
resultado de Prisma) oculta la tarjeta en ese caso.

## Convenciones

- Texto visible en español; identificadores en inglés.
- Las claves de `localStorage`/`sessionStorage` usan el prefijo `intercajas_` o `team_mood_`
  (salvo `gemini_api_key`).
- Los estilos son clases de Tailwind en el marcado; el bloque `<style>` guarda solo
  variables CSS, `glass-card`, animaciones y lo que Tailwind no cubre.
- Todo texto escrito por un participante (nombre, palabra) pasa por `escapeHtml` antes de
  entrar a un `innerHTML`.
- Reiniciar votos escribe `mentiResetAt` en `routing`; cada dispositivo borra sus votos
  locales la primera vez que ve esa marca.
- Los nombres de los participantes son datos personales: no copiarlos a registros, prompts
  de ejemplo ni archivos del repositorio.
- No agregar credenciales nuevas al archivo: van en `env.js`, fuera del repositorio.
