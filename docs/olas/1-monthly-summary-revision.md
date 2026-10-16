# Revisión de pre-vuelo — Ola `1-monthly-summary` (Fase 1, leer, validar y resumir)

Verificado el 2026-10-16 por el Planeador contra la base de la ola, `ola/0-scaffolding` 54fd713 (pila por
avance continuo; `master` en 037e0ef). Lo verificado (abierto o ejecutado) se marca **[V]**; lo inferido,
**[I]**.

## 1. Veredicto

- `read-transactions-csv`: **lista para un PM.**
- `monthly-summary-page`: **lista para un PM si el usuario confirma D1 y D2** tal como se recomiendan; su
  grupo 3 necesita además el activo de D3.
- Ola `1-monthly-summary`: **no lista** hasta que el usuario cierre D1 (alcance), D2 (contrato de R16) y D3
  (entregar la fuente). Con las tres como se recomiendan no hay nada más que escribir: los changes y el brief
  ya están redactados así.
- Lo más importante: R16 leída al pie de la letra rechaza la fuente incrustada que la propia Fase 1 exige
  (B1), y R4/R14 piden hallazgos que solo existen con los patrones de la Fase 2 (B2).

## 2. La ola

- **Ola `1-monthly-summary` — `read-transactions-csv` + `monthly-summary-page`** (5 PRs internas)
  - **Entregable**
    - `python -m reporte output/transacciones_2026-09.csv` escribe `output/reporte_2026-09.html`.
    - La página, un único archivo sin red, muestra encabezado (mes y periodo), los KPIs del resumen (total,
      número, ticket promedio, día de mayor gasto, gasto variable), los avisos, el tema negro y dorado claro
      u oscuro con botón, la fuente Inter incrustada, y termina con «Aquí queda la línea del respeto».
    - Un CSV inválido termina con código 1 y un mensaje en español que nombra columna, fila y campo, o meses.
    - `tests/sistema/test_reporte.py` en verde con el generador real; `tests/test_arquitectura.py` vigila la
      matriz de imports.
  - **Componentes que se modifican**
    - `src/reporte/nucleo/` (se crea: `Transacciones`, `Analisis`, `Resumen`, `analizar`).
    - `src/reporte/datos/` (se crea: `leer_transacciones`, `ErrorDeEntrada`).
    - `src/reporte/presentacion/` (se crea: formateadores, detector de red, tema, `renderizar`,
      `plantillas/`, `activos/` con Inter y `LICENCIAS.md`).
    - `src/reporte/app.py`, `src/reporte/__main__.py` (se crean).
    - `tests/nucleo/`, `tests/datos/`, `tests/presentacion/`, `tests/app/`, `tests/sistema/test_reporte.py`,
      `tests/test_arquitectura.py` (se crean).
    - `README.md` (deja de decir que el reporte no existe; documenta su uso).
    - No se toca: `generador/`, `tests/sistema/test_generador.py`, `tests/test_pureza.py`, `pyproject.toml`,
      `requirements*.txt`, `docs/` (lo de `docs/` va en la PR #13, aparte).
  - **Reglas de `docs/DOMINIO.md` que cierra:** R1–R3, R4 sin sus hallazgos, R5, R15–R17 y los casos borde
    de entrada (archivo vacío, BOM y acentos, montos con más de 2 decimales, coordenadas fuera de México, una
    sola transacción, febrero bisiesto). R14 y los hallazgos de R4 pasan a la Fase 2 (D1).
  - **Correcciones propuestas**
    - PR #13 (para el usuario): R16 con la definición de «referencia de red»; tabla de fases del PLAN con R4
      sin hallazgos y R14 en la Fase 2; `docs/ARQUITECTURA.md:67` remite a R16.

## 3. Premisas verificadas

| Premisa | Estado |
|---|---|
| La base no tiene capas | [V] `src/reporte/` solo trae `__init__.py`; no hay `tests/<capa>/`. |
| El CSV del generador pasa R1–R3 | [V] `python -m generador --mes 2026-09 --semilla 42`: 20,000 filas, 9 columnas exactas, sin BOM, ids únicos, un solo mes, ningún campo vacío, ninguna coordenada fuera de México. `zona` lleva coma (`Roma Norte, CDMX`): el lector debe respetar las comillas. |
| El viaje del generador no cruza de mes | [V] la salida es un viernes con al menos 2 días después (`generador/generar_transacciones.py:133-137`); la compra del vuelo es `max(inicio, …)` (`generador/generar_transacciones.py:351`). |
| No hace falta dependencia de Python nueva | [V] pandas y Jinja2 en `pyproject.toml:6`; sus ruedas (pandas 2.3.3, Jinja2 3.1.6, MarkupSafe 3.0.4) están en `.cache/pip/`. |
| Inter 4.1 es la última versión y es OFL-1.1 | [V] `gh api repos/rsms/inter/releases/latest`: `v4.1` (2024-11-16), un único activo `Inter-4.1.zip` de 33,707,794 bytes; licencia del repositorio `OFL-1.1`. Que el zip traiga `web/InterVariable.woff2` y `LICENSE.txt` es [I]: no lo descargué; el comando de D3 lista el contenido antes de extraer. |
| El base64 de un WOFF2 contiene `//` | [V] por simulación: base64 de 350,000 bytes de alta entropía (WOFF2 va comprimido con Brotli) → 466,668 caracteres con 115 apariciones de `//`. |
| La pila no choca al llegar a `master` | [V] `git merge-tree origin/master origin/ola/0-scaffolding`: sin conflicto. |
| El PLAN no dice `main` | [V] `docs/PLAN.md` no nombra ninguna rama; la única «`main`» de `docs/` es la función de la CLI (`docs/ARQUITECTURA.md:69`). |
| `.claude/da/da citas` | [V] limpio en la rama de planeación (16 avisos de rutas futuras del perfil). |

## 4. Hallazgos

### BLOQUEA EL ARRANQUE

- **B1 — R16, al pie de la letra, rechaza la fuente incrustada de la propia Fase 1** (issue #5).
  - Qué pasa: R16 prohíbe `//` «en `src`, `href`, `url()`, `import` o `fetch`» (`docs/DOMINIO.md:93`). La
    Fase 1 incrusta Inter como `url(data:font/woff2;base64,…)` (`docs/STACK.md:33`, `docs/PLAN.md:61`), y ese
    base64 trae `//` unas cien veces [V, simulación]. En la Fase 2, el ECharts incrustado trae además URLs que
    no son red (aviso de licencia Apache, espacio de nombres de SVG) [I].
  - Por qué importa: el test de R16 se escribe en esta ola y es contrato; con la lectura literal, o falla la
    fuente o se ablanda el test a mitad de ola.
  - Recomendación: precisar R16 con una definición posicional (D2 = A, PR #13) y escribir el detector con
    ella. La spec `pagina-del-reporte` ya la trae.
- **B2 — El PLAN cierra en la Fase 1 reglas que hablan de patrones de la Fase 2.**
  - Qué pasa: `docs/PLAN.md:61` cierra R4 y R14 en la Fase 1. R4 pide «entre 3 y 5 hallazgos principales,
    ordenados por relevancia» (`docs/DOMINIO.md:41`) y R14 gobierna hallazgos y patrones
    (`docs/DOMINIO.md:85-87`); los patrones son de la Fase 2 (`docs/PLAN.md:62`). El entregable de la Fase 1
    dice «KPIs del resumen», sin hallazgos (`docs/PLAN.md:61`).
  - Por qué importa: con solo KPIs, los «hallazgos» serían las mismas cifras en prosa, con un orden de
    relevancia inventado que la Fase 2 tendría que rehacer.
  - Recomendación: D1 = A (PR #13).
- **B3 — La fuente no está en el repositorio y ningún agente la puede descargar.**
  - Qué pasa: `src/reporte/presentacion/activos/` no existe [V]; `CLAUDE.md` (Reglas de proceso 5) prohíbe
    a los agentes descargar.
  - Recomendación: D3. Bloquea solo el grupo 3 (PR 4); los PRs 1 a 3 pueden arrancar sin ella.

### CORREGIR ANTES DE ENCARGAR

Ninguno pendiente: lo corregí al proponer.
- El README dice que el reporte «todavía no existe» (`README.md:3-8`): tarea 4.3 de `monthly-summary-page`.
- `tests/sistema/**` es del área `generador` en el perfil y `tests/test_arquitectura.py` no tiene área: los
  dos están asignados explícitamente a su grupo en el Impact.

### DEUDA (no bloquea esta ola)

- **E1 — `--abrir` no tiene fase.** `docs/ARQUITECTURA.md:18` lo lista en la CLI y ningún entregable del
  PLAN lo pide. Fuera de esta ola. Issue #12.
- **E2 — La base no trae la PR #8.** `ola/0-scaffolding` sigue diciendo que ECharts «se verifica en la
  Fase 0» (`docs/STACK.md:32` en la base), porque #8 entró en `master` después. No afecta a la Fase 1 (no hay
  gráficas) y la pila llega a `master` sin conflicto. Se corrige solo al mergear la pila.
- **E3 — Issue #7** (`requirements.txt` sin uso): sigue abierta, carril de arreglo; esta ola no la toca.

## 5. Tope de PRs y partición

- 5 PRs internas en una sola ola: `read-transactions-csv` grupo 1 (PR 1) y `monthly-summary-page` grupos 1–4
  (PRs 2–5). Cabe en el tope; está dicho en los dos `tasks.md`.
- Grafo: **PR 1 ∥ PR 2** → **PR 3** (tras PR 1) → **PR 4** (tras PR 2 y PR 3, y con la fuente) → **PR 5**.
- Tamaño estimado: PR 1 ~600 (el más justo: validación ~170, tests ~280, fixtures ~40, tipos ~25, test de
  arquitectura ~80); PR 2 ~400; PR 3 ~250; PR 4 ~500 sin el binario; PR 5 ~300. El detector de red va en el
  PR 2 y no en el 4 para que el 4 no pase de ~700.

## 6. Lo que la ola absorbe

- **#5** (R16 y la librería de gráficas): por D2; el detector en el PR 2 y su uso en los PRs 4 y 5.
- **#6** (test de dirección de imports): en el PR 1, tarea 1.1, antes de crear las capas.
- No absorbe **#7** (arreglo) ni **#12** (sin fase). No hay deuda heredada: la ola `0-scaffolding` cerró
  sin *Deuda* ni *Se coló* (`docs/olas/0-scaffolding.md:35-41`).

## 7. Lo que está bien

- `docs/ARQUITECTURA.md` (Contratos) ya fija los nombres que los dos changes comparten (`Transacciones`,
  `leer_transacciones`, `ErrorDeEntrada`, `analizar`, `renderizar`, `main`).
- El perfil tiene un implementador por capa y los skills de área (`python-design-patterns`,
  `python-testing-patterns`) instalados: no hay hueco de habilidad (no hay JS que probar; ver D4).
- La guarda del generador (`tests/sistema/test_generador.py`) fija sus salidas por SHA-256: el oráculo del
  sistema de la Fase 1 es estable.

## 8. Decisiones

1. **D1 — Los hallazgos de R4 y la regla R14.** *De alcance: del usuario.*
   - A) Pasan a la Fase 2, con los patrones de los que salen; la Fase 1 entrega los KPIs. PR #13 corrige la
     tabla de fases del PLAN.
   - B) Se quedan en la Fase 1: 3 a 5 hallazgos hechos de las cifras del resumen (día de mayor gasto, peso de
     los cargos fijos…) con un orden propio, y la Fase 2 los reordena al llegar los patrones. Suma una tarea
     al PR 3 y otra al PR 4.
   - Recomendación: **A**. El entregable de la Fase 1 ya dice «KPIs del resumen»; B escribe dos veces el
     orden de relevancia.
2. **D2 — Qué cuenta como «referencia de red» en R16 (issue #5).** *Contrato: del usuario.*
   - A) Definición posicional (PR #13): una URL de red en una posición que el navegador carga (atributos de
     carga, `url()`/`@import`, APIs de carga de JS); las URL `data:` y las cadenas fuera de esas posiciones no
     cuentan.
   - B) Literal: ningún `http://`, `https://` ni `//` en ningún sitio. La fuente incrustada no cabe (B1), así
     que habría que retirar «fuente embebida» de la Fase 1.
   - C) A, más la prohibición de cualquier `http(s)://` en el marcado y el CSS propios (fuera de las
     librerías incrustadas).
   - Recomendación: **A**. C añade una regla que la Fase 1 no necesita.
3. **D3 — La fuente Inter.** *Activo: solo el usuario lo puede descargar.*
   - A) `InterVariable.woff2` de Inter 4.1 (OFL-1.1): todos los pesos en un archivo, ~350 KB, ~460 KB en el
     HTML.
   - B) Tres pesos estáticos de Inter 4.1 (`Inter-Regular`, `Inter-SemiBold`, `Inter-Bold` `.woff2`), un
     tamaño parecido, tres `@font-face`. Los changes dicen `InterVariable.woff2`: B exige corregirlos.
   - C) No incrustar fuente (pila del sistema): contradice `docs/PLAN.md:61` y `docs/STACK.md:33`.
   - Recomendación: **A**. Comandos para el usuario, en una carpeta propia fuera del repositorio
     (`curl` y `python3` están en la máquina; `unzip` no):

     ```bash
     mkdir -p ~/activos-reporte/inter-4.1 && cd ~/activos-reporte/inter-4.1
     curl -L -o Inter-4.1.zip https://github.com/rsms/inter/releases/download/v4.1/Inter-4.1.zip
     python3 -I -c "import zipfile; print('\n'.join(n for n in zipfile.ZipFile('Inter-4.1.zip').namelist() if n.endswith(('.woff2', '.txt'))))"
     python3 -I -c "import zipfile; z = zipfile.ZipFile('Inter-4.1.zip'); [open(n.rsplit('/', 1)[-1], 'wb').write(z.read(n)) for n in ('web/InterVariable.woff2', 'LICENSE.txt')]"
     sha256sum InterVariable.woff2 LICENSE.txt
     ```

     Si la lista no trae `web/InterVariable.woff2` o `LICENSE.txt` con esos nombres, se usa la ruta que
     muestre. El PM copia los dos archivos de `~/activos-reporte/inter-4.1/` al worktree del PR 4.
4. **D4 — El JavaScript del tema no tiene test automático.** *Técnica: del Team Manager.*
   - A) Script mínimo y revisión visual de sus tres escenarios en la PR de ola (sección «Revisión visual de
     la fase» de `monthly-summary-page/tasks.md`).
   - B) Añadir un motor de JS al gate (`node` existe en la máquina, pero no está en `docs/STACK.md`): cambio
     de stack, subiría al usuario.
   - Recomendación: **A**. Son unas líneas; B mete una cadena de herramientas por ellas.
5. **D5 — Decisiones técnicas escritas en los artefactos.** *Del Team Manager: confirma o revierte.*
   - Absorber #5 y #6 en esta ola (sección 6).
   - Columnas en cualquier orden; se nombra la primera fila inválida, numerada como en una hoja de cálculo
     (encabezado = 1); los meses de R3 como `AAAA-MM`; un solo aviso agregado de coordenadas.
   - El `Analisis` de la Fase 1 solo con `mes`, `ultimo_dia`, `resumen` y `avisos` (las fases siguientes
     añaden sus campos); empate del día de mayor gasto → el más temprano; `proporcion_variable` la calcula
     el núcleo.
   - Redondeo de la mitad hacia arriba sobre `repr` (`$2.68` para 2.675); espacio normal en `42.3 %`.
   - El detector de red vive en `src/reporte/presentacion/`; la paleta es dato de Python con test de
     contraste WCAG.
   - La ruta por defecto sale del mes de los datos, no del nombre del CSV; `--abrir` fuera (#12); las
     palabras fijas de `argparse` quedan en inglés.
   - Recomendación: confirmarlas todas.

Brief: `docs/olas/1-monthly-summary-brief.md` (redactado con D1–D3 en su opción A).
