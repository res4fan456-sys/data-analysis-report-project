# Brief — Ola 2-spending-patterns «Los 5 patrones»

Eres el **project manager** de la Ola 2-spending-patterns de Reporte de gasto mensual. Tu procedimiento es el
skill `desarrollo-autonomo-pm` (entra por §1) y tus reglas son `CLAUDE.md`. Este brief delimita la misión; lo que
no esté aquí lo decide el skill, y lo que el skill no decida lo escalas al Team Manager.

## 1. La ola

- Rama `ola/2-spending-patterns` desde `master` con la integración de la pila de las fases 0 y 1 (#29, a36b316),
  el archivado de esas olas y la PR #31;
  registro `docs/olas/2-spending-patterns.md`. El pre-vuelo leyó el código en `ola/1-monthly-summary` @ 09f4fe7
  (el mismo que la integración lleva a `master`) y los documentos en `master` @ 01a8e9b; el Team Manager te da el
  SHA de `master` desde el que arrancas.
- Changes: `detect-spending-patterns` y `chart-pattern-sections`, ya propuestos y refinados; los tomas, no los
  reescribes. Si `desarrollo-autonomo-pm` §1.3 destapa algo inalcanzable, `openspec-update-change` y registro.
- Entregable: `python -m reporte output/transacciones_2026-09.csv` produce una página con los hallazgos
  principales en el resumen y cinco secciones («Categoría dominante», «Zona favorita», «Quincena», «Fin de
  semana», «Viaje»), cada una con su gráfica ECharts incrustada y su hallazgo, sin red; y la suite de sistema
  confirma, con semilla 42 para las cuatro categorías dominantes, que lo detectado coincide con lo inyectado.
- PRs internas: 5, en este orden: **P1 → (P2 ∥ C1) → C2 → P3**.
  - P1 = `detect-spending-patterns` §1 (categoría, zona, viaje; crea `Analisis.patrones`).
  - P2 = `detect-spending-patterns` §2 (quincena, fin de semana, hallazgos) y C1 = `chart-pattern-sections` §1
    (ECharts, detector, tema, primera sección) en paralelo: áreas disjuntas (`nucleo` y `presentacion`), y C1 solo
    lee `patrones.dominante`, que ya existe tras P1.
  - C2 = `chart-pattern-sections` §2 (hallazgos y las otras cuatro secciones), tras P2 y C1.
  - P3 = `detect-spending-patterns` §3 (perfil del generador y suite de sistema), al final: su prueba recorre la
    página con las cinco secciones.
  - Cada grupo, unas 600 líneas de diff o menos (estimados: P1 550, P2 550, C1 560 sin `echarts.min.js`, C2 650,
    P3 250). C2 es el más grande; si al encargar pasa de 700, avisa al Team Manager antes de partir nada.
- No se empieza: desglose y atípicos (Fase 3), mapa (Fase 4), #28, `--abrir` (#12, fuera de esta ola por decisión
  del usuario del 2026-10-17).

## 2. Lecturas obligatorias antes del primer encargo

1. El skill `desarrollo-autonomo-pm` con sus archivos.
2. Nada de `docs/PLAN.md` ni de `docs/ARQUITECTURA.md` enteros: lo que gobierna la ola va en §3 y §4.
3. Los artefactos de los dos changes por la mecánica de OpenSpec; `context`/`operationGuidance` literales (en el
   pre-vuelo no venían: `openspec/config.yaml` no los define).
4. `docs/olas/2-spending-patterns-revision.md` (este pre-vuelo: hallazgos C1–C6, mediciones y decisiones).
5. Las guardas que no se ablandan: `tests/sistema/test_generador.py` (SHA-256 del CSV y de `-v`; guarda del
   refactor del generador), `tests/test_arquitectura.py` (capas), `tests/presentacion/test_presentacion_licencias.py`
   (activos declarados), `tests/presentacion/test_presentacion_red.py` (R16).

## 3. Reglas de la fase que mandan en cada PR

- El resumen de la Fase 1 no cambia: ninguna cifra, texto ni campo existente de `Analisis` o `Resumen`.
- Los campos nuevos de `Analisis` (`patrones`, `hallazgos`) llevan los nombres del design de
  `detect-spending-patterns`; C1 y C2 los consumen tal cual. Un cambio de nombre es `openspec-update-change`.
- Umbrales, relevancia y «ciudad» son los de las specs y los de `docs/DOMINIO.md` tras la PR #30 (decisiones D1 y
  D2 del pre-vuelo, confirmadas por el usuario el 2026-10-17). R16 no cambia (D3).
- El archivo de ECharts no se edita ni se reformatea; se revisa por su SHA-256.
- Los títulos de las cinco secciones, «Hallazgos principales», «No se detectó un viaje este mes» y «Sin datos
  suficientes para este patrón» son texto contrato; las frases de los hallazgos no lo son.

## 4. Lo que cada grupo debe saber (verificado en el código el 2026-10-17)

- **P1 — Categoría, zona y viaje (`nucleo`)**
  - `Analisis` vive en `src/reporte/nucleo/analisis.py:29`; su docstring (`:30`) ya prevé campos nuevos; `analizar`
    en `:38`. Exporta `src/reporte/nucleo/__init__.py`.
  - Empates: reutilizar el criterio de `_primer_dia_con_el_maximo` (`analisis.py:50`, `math.isclose` con
    `rel_tol=1e-9`, `:58`).
  - Trampa: `tests/presentacion/_pagina_de_prueba.py:25` y `:34` construyen `Analisis` a mano; con un campo
    obligatorio nuevo, `tests/presentacion/` entera queda en rojo. Asígnale ese archivo al implementador de
    `nucleo` solo para añadir `patrones` (todos `SIN_DATOS`).
  - Datos del generador que la spec reproduce: los destinos se llaman `Ciudad, Edo.` (`generador/configuracion.py:34-40`)
    y el vuelo `Vuelo a {ciudad}`, con la ciudad hasta la coma, en la zona de casa; el hotel va en la zona del
    destino el último día del viaje (`generador/generar_transacciones.py:344-374`).
  - Guarda: `tests/test_arquitectura.py` vigila que `nucleo` no importe I/O ni otras capas.
- **P2 — Quincena, fin de semana y hallazgos (`nucleo`)**
  - Tipos de día del generador idénticos a R9 (`generador/generar_transacciones.py:110-117`); el fin de semana del
    generador es de viernes a domingo, como R10.
  - Medido: quitar cargos fijos y `Viajes` del promedio diario no mueve ningún factor más de 0.02; se toma todo el
    gasto, como dice R9.
  - Misma trampa que P1: `tests/presentacion/_pagina_de_prueba.py` gana `hallazgos=()`.
- **C1 — ECharts, detector, tema y primera sección (`presentacion`)**
  - `renderizar` en `src/reporte/presentacion/pagina.py:46`; Jinja con `autoescape=True` (`:31`): la librería
    tiene que entrar marcada como segura o se escapará (el escenario «Contenido exacto» lo atrapa). La fuente se
    lee de `activos/` con `importlib.resources` (`:37`); la librería, igual.
  - Detector: quitador de cadenas y comentarios en `src/reporte/presentacion/red.py:29-33`; `import` estático en
    `:38`; `importScripts` en `:39`. Casos fallidos exactos en la issue #18.
  - `tema.py`: `Tema` (`src/reporte/presentacion/tema.py:7-19`) vuelca sus campos como variables CSS por
    `colores()`; un campo que no sea `str` lo rompe. Los pares de contraste están en `:51-58`.
  - Las secciones van entre `</section>` del resumen y `</main>` (`src/reporte/presentacion/plantillas/reporte.html.j2:167-168`);
    el cierre está en `:169-171` y debe seguir siendo el último texto visible.
  - `.claude/da/da citas` revisará `activos/echarts.min.js` (lo toma por ser `.js` bajo un área); comprobado en tu
    verificación (§6), no en el grupo.
- **C2 — Hallazgos y cuatro secciones (`presentacion`)**
  - Formateadores en `src/reporte/presentacion/formatos.py`; el factor se redondea como los montos (`_decimal`,
    mitad hacia arriba sobre la representación corta).
  - El helper de pruebas `tests/presentacion/_pagina_de_prueba.py` (lector de texto visible en `:75`) es la base
    de las pruebas de sección.
- **P3 — Perfil y sistema (`generador`)**
  - `main` en `generador/generar_transacciones.py:476`: siembra `random.Random` (`:479`) y Faker (`:481`) y llama a
    `crear_perfil` (`:485`) antes de nada; `generar_mes` debe conservar ese orden de consumo o cambian los SHA.
  - `-v` lo imprime `imprimir_resumen` (`:397`); no se usa como contrato.
  - `tests/sistema/test_reporte.py` ya genera septiembre con semilla 42 y 20,000 registros por subprocess; la
    prueba nueva genera las cuatro categorías en el proceso con `generar_mes` y las analiza con
    `leer_transacciones` + `analizar`.
  - Medido en el pre-vuelo con semilla 42: las cuatro categorías pasan la comparación; el fin de semana con
    `Transporte` da ×1.09 (no aparece), por eso la spec no lo afirma.

## 5. Mecánica de esta fase

- **Base de la ola:** `master`, con #29, el archivado de las olas 0 y 1 y #31. De ahí sale la rama de ola y a ahí
  apunta su PR.
- Quién propone (el Team Manager, vía el Planeador) y quién toma (tú); a quién se escala (al Team Manager). El
  handover, la rama del checkout principal y el comando pesado viven en `desarrollo-autonomo-pm` (§6, §1.7) y en
  `CLAUDE.md` (*Desarrollo agéntico* 8-9); worktrees con `.claude/da/da worktree montar`.
- **ECharts ya lo bajó el usuario** (2026-10-17), fuera del repositorio. Los copias tú o el implementador de C1
  a `src/reporte/presentacion/activos/` como `echarts.min.js`, `echarts-LICENSE.txt` y `echarts-NOTICE.txt`:
  - Origen local: `/home/JP/activos-reporte/echarts-6.0.0/package/`. SHA-256 comprobados por el Planeador sobre esos archivos [V]:
  - `dist/echarts.min.js` (1,117,939 bytes): `baa8dfe7e1d9336b98e8986ba7e20ea15e7cdbea1ef42a59d59478632fa45a1d`
  - `LICENSE` (Apache-2.0): `634293835b43a6dd2094fa39182a3d9a6b9ca43b7fdb9ac354e8037af2a3093a`
  - `NOTICE`: `dc0d9176413c3d96d0ac40b39b1dbb11e3043b7b010be560f5dfe66bd3774ae1`
  - SHA-1 del `.tgz`: `2935aa7751c282d1abbbf7d719d397199a15b9e7`; la igualdad con el `dist.shasum` del registro
    la confirma el usuario.
  - `</script` no aparece en `echarts.min.js`, tampoco sin distinguir mayúsculas [V] (paso 3 de la verificación).
- Comandos con los que se bajó (para 5.6.0, si la verificación falla, cambiando la versión):

  ```bash
  mkdir -p ~/activos-reporte/echarts-6.0.0
  curl -fL -o ~/activos-reporte/echarts-6.0.0.tgz https://registry.npmjs.org/echarts/-/echarts-6.0.0.tgz
  curl -fsS https://registry.npmjs.org/echarts/6.0.0 | python3 -c 'import json,sys; print(json.load(sys.stdin)["dist"]["shasum"])'
  sha1sum ~/activos-reporte/echarts-6.0.0.tgz
  tar -xzf ~/activos-reporte/echarts-6.0.0.tgz -C ~/activos-reporte/echarts-6.0.0 package/dist/echarts.min.js package/LICENSE package/NOTICE
  sha256sum ~/activos-reporte/echarts-6.0.0/package/dist/echarts.min.js ~/activos-reporte/echarts-6.0.0/package/LICENSE ~/activos-reporte/echarts-6.0.0/package/NOTICE
  ```

  Los tres SHA-256 van a tu registro y a `activos/LICENCIAS.md`, con versión 6.0.0, licencia Apache-2.0 y origen
  `https://registry.npmjs.org/echarts/-/echarts-6.0.0.tgz`, entrada `package/dist/echarts.min.js` (y `package/LICENSE`,
  `package/NOTICE` para los textos de licencia).
- Cierre: PR `ola/2-spending-patterns → master` con la plantilla B, abierta para el usuario, con `Closes #18`.
  Nada llega a `master` por ti.

## 6. Primer paso concreto

- `.claude/da/da preflight` limpio, `.claude/da/da verify` verde sobre la base, mecánica de OpenSpec de los dos
  changes.
- **Verificación de ECharts** con el archivo que bajó el usuario (los SHA-256 y la ausencia de `</script` ya los
  comprobó el Planeador; repítelos sobre la copia en el worktree), antes de encargar C1 (lista completa en el
  design de `chart-pattern-sections`, «Librería»): SHA, `referencias_de_red` sobre una página que lo incrusta
  (R16 contra el archivo real: `()`, o cada posición abierta y juzgada), sin `</script`, revisión en menos de 2 s,
  `.claude/da/da citas` limpio sobre el archivo, y una gráfica de barras dibujada en Chrome sin red. Si falla con
  carga real, `</script` o dibujo, 5.6.0; si falla `citas`, escala al Team Manager. El resultado va al registro.
- Lista de arranque (`desarrollo-autonomo-pm` §1.6) al Team Manager **solo si hay algo que pedir al usuario**
  (hoy nada: ECharts y las decisiones ya están); después la rama, el registro y el encargo de P1.
