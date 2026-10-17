# pagina-del-reporte Specification

## Purpose

Define la página HTML única del reporte: qué muestra en la Fase 1, cómo da formato es-MX a cada cifra, cómo
se garantiza que no use la red, su tema claro y oscuro, su fuente incrustada y su cierre (reglas R15–R17 de
`docs/DOMINIO.md`).

## Requirements

### Requirement: Los montos se muestran en formato es-MX

Todo monto visible SHALL mostrarse como `$` seguido de la cifra con coma de miles y punto decimal y
exactamente dos decimales, redondeando a centavos la mitad hacia arriba sobre la representación decimal del
número (R15).

#### Scenario: Monto con miles

- **WHEN** se da formato a 1234.56
- **THEN** se muestra `$1,234.56`

#### Scenario: Millones y ceros

- **WHEN** se da formato a 9879934.3 y a 0
- **THEN** se muestran `$9,879,934.30` y `$0.00`

#### Scenario: Redondeo de la mitad

- **WHEN** se da formato a 2.675 y a 10.005
- **THEN** se muestran `$2.68` y `$10.01`

### Requirement: Los porcentajes se muestran con un decimal

Una proporción entre 0 y 1 SHALL mostrarse como porcentaje con un decimal, un espacio y el signo `%`,
redondeando la mitad hacia arriba (R15).

#### Scenario: Proporción habitual

- **WHEN** se da formato a la proporción 0.4234
- **THEN** se muestra `42.3 %`

#### Scenario: Extremos

- **WHEN** se da formato a 1.0 y a 0.0
- **THEN** se muestran `100.0 %` y `0.0 %`

### Requirement: Los conteos se muestran con coma de miles

Un número entero de cosas (transacciones) SHALL mostrarse con coma como separador de miles y sin decimales.

#### Scenario: Veinte mil transacciones

- **WHEN** se da formato a 20000
- **THEN** se muestra `20,000`

### Requirement: Las fechas y los días se muestran en español

Una fecha SHALL mostrarse como «15 de septiembre de 2026» (día sin cero a la izquierda, mes en minúsculas),
un mes como «septiembre de 2026» y un día de la semana con su nombre en español en minúsculas, con acentos
(«miércoles», «sábado») (R15).

#### Scenario: Fecha de un dígito

- **WHEN** se da formato al 1 de marzo de 2026
- **THEN** se muestra «1 de marzo de 2026»

#### Scenario: Día de la semana con acento

- **WHEN** se pide el día de la semana del 16 de septiembre de 2026 y del 19 de septiembre de 2026
- **THEN** se muestran «miércoles» y «sábado»

#### Scenario: Mes del reporte

- **WHEN** se da formato al mes de septiembre de 2026
- **THEN** se muestra «septiembre de 2026»

### Requirement: La página muestra el encabezado y el resumen del mes

La página SHALL mostrar un encabezado con el mes del reporte y su periodo (del día 1 al último día del mes),
y el resumen: gasto total, número de transacciones, ticket promedio, día de mayor gasto (fecha, día de la
semana y monto) y gasto variable con su porcentaje del total, cada cifra con los formatos es-MX de esta spec
y cada etiqueta en español.

#### Scenario: Resumen de septiembre

- **WHEN** se genera la página de un análisis de septiembre de 2026 con total 400, 3 transacciones, día de
  mayor gasto el 16 de septiembre con 250.5 y gasto variable 300 (proporción 0.75)
- **THEN** la página muestra «septiembre de 2026», «30 de septiembre de 2026», `$400.00`, `3`, `$133.33`,
  «16 de septiembre de 2026», «miércoles», `$250.50`, `$300.00` y `75.0 %`

#### Scenario: Periodo de febrero bisiesto

- **WHEN** se genera la página de un análisis de febrero de 2028
- **THEN** el periodo del encabezado termina el «29 de febrero de 2028»

### Requirement: La página muestra los avisos del análisis

Si el análisis trae avisos, la página SHALL mostrarlos todos, visibles, antes del resumen; si no trae, no
SHALL mostrar ninguna sección de avisos.

#### Scenario: Con aviso

- **WHEN** el análisis trae el aviso «2 transacciones tienen coordenadas fuera de México»
- **THEN** ese texto es visible en la página

#### Scenario: Sin avisos

- **WHEN** el análisis no trae avisos
- **THEN** la página no tiene sección de avisos

### Requirement: El texto que viene de los datos se muestra literal

Todo texto que la página recibe del análisis SHALL mostrarse tal cual, escapado; nunca se interpreta como
marcado HTML.

#### Scenario: Aviso con marcado

- **WHEN** el análisis trae el aviso `<b>hola</b> & adiós`
- **THEN** la página muestra ese texto literal y no contiene un elemento `b` nuevo

### Requirement: La página es un solo archivo sin referencias de red

La página SHALL ser un único archivo sin referencias de red. Una referencia de red es una URL `http:`,
`https:`, `ws:`, `wss:` o `ftp:`, o una que empieza con `//`, en una posición que el navegador carga: un
atributo `src`, `href`, `srcset`, `action`, `formaction`, `poster`, `data` o `xlink:href`; un `url()` o
`@import` de CSS; o un `import`, `import()`, `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`,
`sendBeacon` o `importScripts` de JavaScript (R16, issue #5).

#### Scenario: La página generada no tiene referencias

- **WHEN** se genera la página de cualquier análisis de la Fase 1
- **THEN** no tiene ninguna referencia de red ni ningún `script` con `src` ni `link` con `href` a otro archivo

#### Scenario: Cada posición prohibida se detecta

- **WHEN** se revisa un HTML con `<img src="https://x.mx/a.png">`, `<link href="//x.mx/a.css">`,
  `url(http://x.mx/f.woff2)`, `@import "https://x.mx/b.css"`, `fetch("https://x.mx")` o
  `import("https://x.mx/m.js")`
- **THEN** cada una se reporta como referencia de red

### Requirement: Lo local y lo que no se carga no cuenta como red

Una URL `data:` SHALL contar como local aunque su contenido contenga `//`, y una cadena con `http://` u otro
esquema fuera de las posiciones de carga (un espacio de nombres XML, un aviso de licencia en un comentario,
un texto visible) no SHALL contar como referencia de red (R16, issue #5).

#### Scenario: Fuente incrustada con barras en su base64

- **WHEN** se revisa un HTML cuyo CSS trae `url(data:font/woff2;base64,AB//CD)`
- **THEN** no se reporta ninguna referencia de red

#### Scenario: Espacio de nombres y licencia

- **WHEN** se revisa un HTML cuyo script contiene `createElementNS("http://www.w3.org/2000/svg", "svg")` y
  un comentario con `http://www.apache.org/licenses/LICENSE-2.0`
- **THEN** no se reporta ninguna referencia de red

### Requirement: La fuente Inter va incrustada

La página SHALL incrustar la fuente Inter como WOFF2 en una URL `data:` y usarla para todo su texto, sin
depender de ninguna fuente instalada salvo como respaldo.

#### Scenario: Fuente presente

- **WHEN** se genera la página
- **THEN** su CSS declara la familia Inter con un `@font-face` cuyo origen es una URL `data:font/woff2` con
  el contenido exacto de `InterVariable.woff2`

### Requirement: Cada activo incrustado declara versión y licencia

Cada archivo de `src/reporte/presentacion/activos/` que la página incrusta SHALL figurar en
`src/reporte/presentacion/activos/LICENCIAS.md` con su versión exacta, su licencia y su origen (regla
innegociable 6).

#### Scenario: Activo sin declarar

- **WHEN** hay en `activos/` un archivo incrustable que `LICENCIAS.md` no nombra
- **THEN** la comprobación de licencias falla nombrando el archivo

### Requirement: La paleta negro y dorado es legible en los dos temas

La página SHALL tener un tema claro y uno oscuro con base negro y dorado. En cada tema, cada color de texto
sobre cada color de fondo en que se usa SHALL tener un contraste WCAG de al menos 4.5:1, y el color de acento
de las cifras grandes de al menos 3:1.

#### Scenario: Contraste en el tema oscuro

- **WHEN** se mide el contraste del texto principal sobre el fondo del tema oscuro
- **THEN** es de al menos 4.5:1

#### Scenario: Contraste del acento en el tema claro

- **WHEN** se mide el contraste del acento dorado sobre el fondo del tema claro
- **THEN** es de al menos 3:1

### Requirement: El tema sigue al sistema y un botón lo cambia

La página SHALL abrir con el tema que prefiere el sistema (claro u oscuro) y traer un botón, con nombre
accesible en español, que cambia al otro tema y recuerda la elección en las siguientes aperturas. Si el
navegador no permite guardar, el botón SHALL seguir cambiando el tema sin errores. Se valida en la revisión
visual de la fase.

#### Scenario: Preferencia del sistema

- **WHEN** se abre la página en un sistema con modo oscuro y sin elección guardada
- **THEN** se ve el tema oscuro

#### Scenario: Elección recordada

- **WHEN** se pulsa el botón y se vuelve a abrir la página
- **THEN** se ve el tema elegido, no el del sistema

#### Scenario: Sin almacenamiento

- **WHEN** el navegador bloquea el almacenamiento local y se pulsa el botón
- **THEN** el tema cambia y la consola no muestra errores

### Requirement: El último texto visible es el mensaje de cierre

El último texto visible de la página SHALL ser, literalmente, «Aquí queda la línea del respeto» (R17).

#### Scenario: Cierre con y sin avisos

- **WHEN** se genera la página de un análisis con avisos y la de uno sin avisos
- **THEN** en las dos, el último texto visible es «Aquí queda la línea del respeto»
