# Design

## Context

- `renderizar` (`src/reporte/presentacion/pagina.py`) arma un contexto de cadenas ya formateadas y lo pasa a
  `plantillas/reporte.html.j2` con `autoescape=True` y `StrictUndefined`; la fuente Inter se incrusta en base64
  desde `activos/` con `importlib.resources`. La página no tiene hoy ninguna gráfica ni librería.
- `referencias_de_red` (`src/reporte/presentacion/red.py`) quita cadenas y comentarios de JavaScript con una
  expresión regular (líneas 29-33) que un literal de expresión regular con comilla desalinea, y sus patrones de
  `import` (línea 38) piden espacios que el código minificado no trae (issue #18).
- `tests/presentacion/test_presentacion_licencias.py` exige que todo archivo de `activos/` figure en
  `activos/LICENCIAS.md` con versión, licencia, origen y SHA-256, salvo los de la tabla «Textos de licencia».
- `.claude/da/da citas` (en `verify`) revisa los comentarios de todo `.js` bajo un área del perfil: también
  revisará el archivo de la librería incrustada.
- Los nombres de `Analisis.patrones` y `Analisis.hallazgos` los fija el design de `detect-spending-patterns`.

## Goals / Non-Goals

**Goals:**

- Que cada gráfica sea un dict de Python probado como dato, y que el JavaScript propio de la página se limite a
  arrancar la librería con esos datos y a redibujar al cambiar de tema.
- Que ningún texto de los datos pueda salir del `script` que lo lleva.
- Revisar la página real (con la librería) en cada corrida de la suite, en tiempo lineal.

**Non-Goals:**

- Interacción más allá de lo que la librería da por defecto: sin barra de herramientas, zoom ni descarga.
- Ampliar la definición de R16 (queda en el issue #18).
- Probar con tests automáticos el dibujo en el navegador: va a la revisión visual, como el tema en la Fase 1.

## Decisions

### Librería: Apache ECharts 6.0.0

`docs/STACK.md` la fija, con 5.6.0 como alternativa si falla la verificación. Se toma el archivo
`package/dist/echarts.min.js` del paquete publicado en el registro de npm
(`https://registry.npmjs.org/echarts/-/echarts-6.0.0.tgz`), con `package/LICENSE` (Apache-2.0) y
`package/NOTICE`, que Apache-2.0 §4(d) pide acompañar. En `activos/`: `echarts.min.js` en la tabla de activos y
`echarts-LICENSE.txt` y `echarts-NOTICE.txt` en «Textos de licencia». El usuario baja el paquete fuera del
repositorio; el equipo copia los tres archivos y comprueba sus SHA-256 contra los que el usuario reporta.

Verificación al empezar la ola (la hace el PM con el archivo real, antes de encargar el grupo 1):

1. SHA-1 del `.tgz` igual al `dist.shasum` del registro, y SHA-256 de los tres archivos igual a los reportados.
2. `referencias_de_red` sobre una página que incrusta el archivo devuelve `()`; si reporta algo, se abre cada
   posición: una carga real descarta la versión, un falso positivo es defecto del detector (grupo 1).
3. El archivo no contiene `</script` (sin distinguir mayúsculas), que cerraría el `script` que lo incrusta.
4. La revisión de esa página tarda menos de 2 segundos.
5. `.claude/da/da citas` sobre `src/reporte/presentacion/activos/echarts.min.js` queda limpio.
6. Una página de prueba con una gráfica de barras se dibuja en Chrome sin red.

Si 2 (con carga real), 3 o 6 fallan, se repite con 5.6.0. Si falla 5, se escala al Team Manager: la exclusión
de un activo vendorizado es configuración del kit, fuera de las áreas de la ola.

### Cómo llegan las gráficas a la página

- La librería va en un único `<script>` sin `src`, marcada como segura para Jinja (con `autoescape` se escaparía
  y dejaría de funcionar), antes del script de arranque.
- Las opciones de cada gráfica van en un `<script type="application/json">` propio, serializadas con
  `json.dumps` y con `<`, `>` y `&` escritos como `<`, `>` y `&`: es JSON válido y ningún nombre de
  los datos puede cerrar el `script`. El arranque las lee con `JSON.parse`. Alternativa descartada: interpolar las
  opciones dentro del código JavaScript, que obliga a escapar para dos lenguajes a la vez.
- Renderizador SVG: el texto se imprime nítido desde el navegador (`docs/PLAN.md`, Fuera de alcance:
  imprimir) y no depende del tamaño de pantalla. Alternativa: canvas, más rápido con miles de puntos, que aquí no hay.
- Cifras: ejes de valor sin etiquetas; cada barra lleva su etiqueta ya formateada desde Python; sin descripción
  emergente, que la librería formatearía a su manera. El nombre accesible del contenedor (`role="img"` con
  `aria-label`) lo arma Python.

### Tema de las gráficas

Se registran dos temas de la librería, `claro` y `oscuro`, generados desde `tema.py` (que gana los colores de
serie, con su contraste medido como los demás pares). Al cambiar de tema, el arranque destruye cada gráfica y la
vuelve a crear con el otro tema. Alternativa: cambiar colores con `setOption`, que deja estados mezclados.

### Textos de los hallazgos

Un módulo de presentación arma la frase de cada `TipoDeHallazgo` con los formateadores es-MX y la cifra del
hallazgo o del patrón. Las frases no son contrato (`CLAUDE.md`, Convenciones); sí lo son «No se detectó un viaje
este mes» y «Sin datos suficientes para este patrón», que vienen de `docs/DOMINIO.md`, y los títulos de las
secciones, que son nombres accesibles que recorre la suite de sistema.

### Detector de red

Un recorrido lineal del JavaScript que distingue cadenas, plantillas, comentarios y literales de expresión regular
(un `/` tras un operador, una puntuación de apertura o una palabra como `return` abre una expresión regular), y
patrones de `import` sin espacios obligatorios. El mecanismo lo elige el implementador; la spec fija los casos y
el tiempo.

## Risks / Trade-offs

- [El archivo de la librería no pasa la verificación] → la verificación va antes del primer encargo; 5.6.0 es la
  alternativa ya decidida en `docs/STACK.md` (tarea 1.1).
- [`.claude/da/da citas` marca el archivo minificado] → se comprueba en la verificación; si falla, se escala
  (tarea 1.1).
- [El archivo de la librería infla el diff de la PR del grupo 1] → no cuenta en el tamaño del grupo; se revisa
  por su SHA-256, no por su contenido.
- [Un factor entre 1.05 y 1.1 se muestra `×1.1` en un patrón que no aparece] → el texto de «no aparece» nombra el
  umbral; se acepta el redondeo del formato de R9.
- [El arranque de las gráficas y el cambio de tema no tienen test automático] → revisión visual en los dos temas
  sin red, con captura en la PR (tarea 2.5).
