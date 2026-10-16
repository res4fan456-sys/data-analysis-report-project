# Design

## Context

- Al empezar este change, `read-transactions-csv` (PR 1 de la ola) ya creó `reporte.nucleo.tipos.Transacciones`
  y `reporte.datos` (`leer_transacciones`, `ErrorDeEntrada`), y `tests/test_arquitectura.py`, que vigila la
  matriz de imports de `docs/ARQUITECTURA.md` en cada capa nueva de este change.
- `docs/ARQUITECTURA.md` (Contratos) describe el `Analisis` final, con `patrones`, `desglose`, `mapa` y
  `hallazgos`; las fases 2 a 4 los añaden. Esta fase solo crea lo que la página de la Fase 1 muestra.
- La suite `sistema` ya corre el generador como subproceso (`tests/sistema/test_generador.py`, ~23 s por mes
  de 20,000 filas). Jinja2 3.1 y pandas 2.3 están en `pyproject.toml:6` y en la caché de ruedas; no hay motor
  de JavaScript en el stack.
- La fuente es Inter 4.1, `InterVariable.woff2` (todos los pesos en un archivo, OFL-1.1); la entrega el
  usuario antes del grupo 3 (decisión D3 del pre-vuelo).

## Goals / Non-Goals

**Goals:**
- La página de la Fase 1 completa, generada desde un `Analisis` hecho a mano en los tests (sin CSV).
- R16 vigilado por un detector propio, probado contra referencias sembradas, que reutilizarán las fases
  siguientes al incrustar ECharts y las geometrías.
- Paleta y tema como datos de Python, para probar su contraste y reutilizarlos en el tema de ECharts de la
  Fase 2 (`docs/STACK.md`, Estilo).

**Non-Goals:**
- Hallazgos en lenguaje natural (R4, segunda viñeta) y el resto de R14: Fase 2 (decisión D1 del pre-vuelo).
- `--abrir` de la CLI (`docs/ARQUITECTURA.md`, capa `app`): sin fase asignada, queda en una issue.
- Probar el JavaScript del tema con un motor de JS: no hay ninguno en el stack (decisión D4 del pre-vuelo).

## Decisions

- **`Analisis` de la Fase 1**: `mes: date`, `ultimo_dia: date`, `resumen: Resumen` y `avisos: tuple[str, ...]`.
  `Resumen`: `total`, `numero`, `ticket_promedio`, `dia_mayor_gasto: date`, `monto_dia_mayor_gasto`,
  `gasto_variable` y `proporcion_variable`, todos `float` salvo `numero` y la fecha. Dataclasses congeladas en
  `nucleo`. Los campos de las fases siguientes se añaden en ellas (cambio aditivo del contrato); no se crean
  vacíos ahora. `ultimo_dia` vive en el `Analisis` porque la presentación no calcula (regla innegociable 2) y
  la Fase 2 lo necesita para R9.
- **`proporcion_variable` la calcula `nucleo`**, no `presentacion`: dividir es calcular. Si el total fuera 0
  no puede pasar (R2 exige montos > 0).
- **Formateadores puros** en `presentacion`: monto, porcentaje (recibe una proporción de 0 a 1), entero,
  fecha, mes y día de la semana. El redondeo usa `Decimal(repr(x))` con `ROUND_HALF_UP`: así 2.675 da `$2.68`
  como lo leería una persona, no `$2.67` como da el redondeo binario de `round` o de `format`. Nombres de
  meses y días en tablas propias, sin `locale` (depende de la máquina).
- **Espacio normal en `42.3 %`**, tal como lo escribe `docs/DOMINIO.md` (R15), que es contrato de texto. Si
  el corte de línea molesta en la revisión visual, se evita con CSS (`white-space: nowrap`), sin cambiar el
  texto.
- **Detector de red en `presentacion`**: una función pura `referencias_de_red(html) -> tuple[str, ...]`
  que aplica la definición del requisito «La página es un solo archivo sin referencias de red»: recorre
  atributos con `html.parser` de stdlib, revisa `url()` y `@import` en `<style>` y en atributos `style`, y
  busca en `<script>` las llamadas de carga con un literal de URL de red como argumento (y `import … from`).
  Las URL `data:` y los fragmentos `#…` son locales. Vive en `src/` (no en `tests/`) porque lo usan los tests
  de `presentacion`, la suite `sistema` y las fases que incrustan librerías, y así pasa por `mypy --strict`.
  Alternativa descartada: buscar `http://` en todo el HTML; rechaza la fuente (el base64 de un WOFF2 contiene
  `//` cada ~4,000 caracteres, comprobado en el pre-vuelo) y el ECharts de la Fase 2 (avisos de licencia,
  espacios de nombres de SVG).
- **Tema como datos**: un módulo de `presentacion` define los tokens de color de los temas claro y oscuro
  (fondo, superficie, texto, texto secundario, dorado de acento, borde) y los pares texto/fondo en que se usa
  cada uno; la plantilla los vuelca en custom properties de CSS. Un test calcula el contraste WCAG 2.1 de cada
  par. Los valores exactos de la paleta los elige el implementador dentro de «negro y dorado con acentos
  brillantes» y los valida el usuario en la revisión visual (`docs/PLAN.md`, Pendientes).
- **Tema claro/oscuro**: CSS con el tema por defecto, `@media (prefers-color-scheme: dark)` cuando no hay
  elección, y `:root[data-tema="claro"|"oscuro"]` para la elección explícita. Un script en línea, de pocas
  líneas, lee y guarda la elección en `localStorage` dentro de `try/catch` y pone `data-tema`; el botón vive en
  el encabezado (antes del cierre en el orden del documento, por R17) y su nombre accesible dice a qué tema
  cambia. Se aplica antes del primer pintado para que no parpadee.
- **Fuente**: `@font-face` con `font-family: Inter`, `font-weight: 100 900` y `src: url(data:font/woff2;base64,…)`;
  el archivo se lee con `importlib.resources` desde el paquete `reporte.presentacion` (es un activo del
  paquete, no un archivo del usuario: regla innegociable 2). El proyecto no se empaqueta (`docs/STACK.md`), así
  que no hace falta `package-data` en `pyproject.toml`.
- **Plantilla Jinja2** en `presentacion/plantillas/`, con `autoescape` activado, `StrictUndefined` y todo el
  texto visible en español; las cifras llegan ya formateadas desde Python, la plantilla no formatea.
- **Comprobación de licencias**: un test lista los archivos de `activos/` (salvo `LICENCIAS.md` y los textos
  de licencia) y exige que cada uno aparezca en `LICENCIAS.md` con versión y licencia.
- **CLI**: `argparse` con textos de ayuda en español; `main(argv)` devuelve el código (0, 1 por
  `ErrorDeEntrada` o por `OSError` al escribir, 2 por uso incorrecto, que es el de `argparse`). La ruta por
  defecto sale de `Analisis.mes`, no del nombre del CSV, para que un CSV con otro nombre dé igual
  `reporte_AAAA-MM.html`. Escribe UTF-8. `__main__.py` solo hace `raise SystemExit(main())`.
- **Suite `sistema` de la fase** en `tests/sistema/test_reporte.py`: genera con el generador real (20,000
  filas, `--mes 2026-09`, semilla fija) en `tmp_path`, corre `python -m reporte` como subproceso, y comprueba
  código 0, la ruta por defecto, ninguna referencia de red con el detector, el mensaje final como último texto
  visible, el tamaño < 10 MB y que el total, el número de transacciones y el ticket promedio visibles son los
  que da sumar el CSV con el módulo `csv` de stdlib (un oráculo independiente del núcleo). Un segundo caso
  corre la CLI sobre un CSV con una columna de más y comprueba código 1 y el nombre de la columna.

## Risks / Trade-offs

- [El JavaScript del tema no tiene test automático] → script mínimo y sin lógica más allá de leer, guardar y
  alternar; la revisión visual de la fase (sección «Revisión visual de la fase» de `tasks.md`) recorre los tres escenarios del requisito del tema, y lo
  que no se pueda revisar se dice en la PR de ola.
- [El detector de red es heurístico en JavaScript: no ejecuta el código] → cubre las llamadas de carga con un
  literal de URL; una URL armada en tiempo de ejecución no la ve. Se acepta: la página no tiene JavaScript
  propio que arme URLs, y las librerías vendorizadas se revisan al incrustarlas. Los escenarios sembrados son
  la red de seguridad del propio detector.
- [La fuente aún no está en el repositorio] → el grupo 3 no arranca sin `InterVariable.woff2` y su licencia en
  la ruta que fije el brief; los grupos 1 y 2 no la necesitan.
- [El último texto visible depende de qué cuenta como visible] → el test toma el texto fuera de `head`,
  `script`, `style`, `template` y de elementos con `hidden`, y el botón del tema va en el encabezado.
- [Las palabras fijas de `argparse` («usage:», «error:») salen en inglés] → se aceptan: la ayuda y los
  mensajes propios van en español, y `docs/` no exige más para la CLI.
- [El `Analisis` de esta fase es más pequeño que el de `docs/ARQUITECTURA.md`] → es el mismo contrato en
  construcción; cada fase añade sus campos de forma aditiva y lo declara.
