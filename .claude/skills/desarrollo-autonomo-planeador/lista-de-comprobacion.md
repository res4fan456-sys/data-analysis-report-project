# Lista de comprobación del pre-vuelo

Cada punto dice qué se comprueba, cómo, y el ejemplo típico de lo que atrapa (para no volver a fiarse del artefacto). Lo que cada punto atrapó **en este proyecto** se acumula en `casos-del-pre-vuelo.md`, que es del proyecto.

| # | Qué | Cómo | Ejemplo típico |
|---|---|---|---|
| 1 | Los changes validan y sus artefactos existen | `openspec validate`, `status --json`, `instructions apply --json`; leer **todos** los `contextFiles` | — |
| 2 | Rutas y cifras ciertas | `ls`, `wc -l`, `grep -c`, `graft skeleton --no-refresh` sobre cada ruta, símbolo y cifra citados | Un change cita un módulo por una ruta donde ya no vive, o dice «7 efectos» cuando son 6 |
| 3 | Premisas sobre el estado actual | Abrir el código de cada «hoy X»; confirmar o corregir | «Los logs no registran X» cuando sí lo registran bajo otro nombre; «las vistas abren red al importarse» cuando no |
| 4 | Impact contra alcance real | `graft callers <símbolo> --no-refresh` / `grep -rn` en todas las áreas y en la suite de sistema; citas con ruta completa que `.claude/da/da citas` marcará | El Impact nombra el módulo principal y calla los consumidores, los tests satélite y las citas que se rompen al mover |
| 5 | Cada riesgo del `design.md` tiene tarea | Cruzar *Risks* con `tasks.md` | Un riesgo descrito con precisión y ninguna tarea que lo ejecute |
| 6 | Alcanzabilidad de cada tarea | ¿Existe el dato/estado/entorno? ¿Lo produce alguien antes? | Una tarea lee un campo que la vista no tiene; un fixture que nadie puede producir sin tocar otra área |
| 7 | Tope de PRs y partición | Contar grupos del grafo; >5 → olas; «mitad de la ola» = una ola | Una etapa de 8 PRs escrita como una sola ola |
| 8 | Dependencias entre changes y olas | Grupo / ola / etapa; desde dónde arranca la rama; nombres exactos de lo que consume de la anterior | «Depende de la etapa X» cuando depende de una ola concreta de X y de otra más |
| 9 | Orden interno del grafo | Los grupos «independientes» lo son de verdad (archivos y datos disjuntos) | Dos grupos «paralelos» que comparten un catálogo o un dato |
| 10 | Contratos intocables | `docs/ARQUITECTURA.md` §4: nada cambia salvo aditivo y declarado; declararlo ahí | Un campo nuevo en una proyección, un mensaje que pasa a opcional, un nombre accesible que cambia |
| 11 | Red de seguridad | Qué test guarda cada comportamiento movido; cuál no sobrevive; guarda anterior e independiente si hace falta | Los tests del núcleo importan internos que el refactor reescribe; un comportamiento guardado solo por los tests que la ola reescribe |
| 12 | Deuda heredada | *Deuda* y *Se coló* de `docs/olas/*.md`; auditorías en `docs/olas/`; memoria de deuda diferida | Hallazgos de una auditoría anterior que esta ola debía absorber y nadie nombró |
| 13 | La frase de al lado | PLAN (etapa, conteo, filas de acciones del usuario), ARQUITECTURA, CLAUDE.md *Comandos* | El PLAN dice «va en dos» tras partir otra etapa; filas «Pendiente» ya hechas |
| 14 | Tests que ya existen | Antes de «test nuevo de X», buscar X | Un rejuego o un fixture que ya existía en otra área con otro nombre |
| 15 | Entorno | Dependencias, credenciales, dispositivos, pila de la suite, `[PENDIENTE]` | Una dependencia nueva que solo el usuario instala |
| 16 | `tasks.md` sin mecánica copiada | La mecánica vive en los skills y en `CLAUDE.md`; `tasks.md` lleva el grafo, las dependencias y lo específico de la fase | Dos changes con la misma regla de verificación copiada: dos copias divergen |
| 17 | Tamaño de cada grupo | Estimar las líneas de diff por grupo (`wc -l` de lo que toca, `graft callers --no-refresh` de lo que arrastra); más de ~600 → partir en `tasks.md` | Grupos de más de 1800 líneas agotan el tope con 4–6 rondas |
| 18 | Hueco de habilidad | ¿Cada grupo tiene en `.claude/skills/` (y en `areas[].skills` del perfil) un skill para su lenguaje, framework o herramienta? Si no, proponer `/find-skills` al usuario antes de encargar | Un grupo en un framework nuevo sin skill: el implementador improvisa lo que un skill le habría dado |
