# Spec Delta

## ADDED Requirements

### Requirement: Los factores se muestran con un decimal

Un factor (cuántas veces un promedio es otro) SHALL mostrarse con el signo `×` pegado y un decimal, redondeando
la mitad hacia arriba como los montos (R9: «×2.3»).

#### Scenario: Factor de quincena

- **WHEN** se formatea el factor 2.35
- **THEN** se muestra `×2.4`

### Requirement: La página muestra los hallazgos principales

La sección del resumen SHALL mostrar, bajo el título «Hallazgos principales», los hallazgos del análisis en el
orden en que llegan, cada uno como una frase en español con su cifra formateada en es-MX (monto, porcentaje o
factor como `×2.3`).

#### Scenario: Tres hallazgos en orden

- **WHEN** el análisis trae, en este orden, la categoría dominante `Comida` con 0.534 del gasto variable, el
  viaje a `Oaxaca, Oax.` con gasto 10594.8 y la quincena con factor 2.37
- **THEN** la lista «Hallazgos principales» tiene tres elementos, en ese orden, que muestran `53.4 %`,
  `$10,594.80` y `×2.4`

### Requirement: La página tiene una sección por patrón

Tras el resumen y antes del cierre, la página SHALL tener cinco secciones, en este orden y con estos títulos, que
son su nombre accesible: «Categoría dominante», «Zona favorita», «Quincena», «Fin de semana» y «Viaje». Cada
una SHALL mostrar el hallazgo de su patrón con su cifra en es-MX.

#### Scenario: Cinco secciones en orden

- **WHEN** se genera la página de cualquier análisis
- **THEN** tiene las cinco secciones con esos títulos, en ese orden, y el último texto visible sigue siendo el
  cierre

### Requirement: Un patrón que no aparece se dice así

Si un patrón no aparece, su sección SHALL mostrar su cifra y decir que el patrón no aparece este mes, sin
presentarlo como patrón ni dibujar su gráfica como si lo fuera. Si no tiene datos suficientes, SHALL mostrar
«Sin datos suficientes para este patrón». Si no hay viaje, la sección «Viaje» SHALL mostrar «No se detectó un
viaje este mes» y ninguna gráfica (R14, `docs/DOMINIO.md`).

#### Scenario: Mes sin viaje

- **WHEN** el patrón de viaje no aparece
- **THEN** la sección «Viaje» muestra «No se detectó un viaje este mes» y no tiene gráfica

#### Scenario: Quincena por debajo del umbral

- **WHEN** la quincena no aparece con factor 1.04
- **THEN** la sección «Quincena» muestra `×1.0` y dice que el patrón no aparece

#### Scenario: Sin datos suficientes

- **WHEN** la categoría dominante está sin datos suficientes
- **THEN** la sección «Categoría dominante» muestra «Sin datos suficientes para este patrón» y no tiene gráfica

### Requirement: Cada sección muestra las cifras de su regla

Cada sección SHALL mostrar las cifras que su regla pide reportar: la dominante, su porcentaje del gasto variable
y del total (R6); la zona favorita y su porcentaje (R7); cada viaje con destino, fechas y gasto, ordenados por
gasto (R8); el promedio por día y el factor de cada tipo de día (R9); los dos promedios, su factor y el
entretenimiento nocturno (R10).

#### Scenario: Dos viajes

- **WHEN** el patrón de viaje trae un viaje a `Monterrey, N.L.` del 4 al 6 de septiembre con 8000 y otro a
  `Oaxaca, Oax.` del 18 al 20 con 3000
- **THEN** la sección «Viaje» muestra primero Monterrey con «4 de septiembre de 2026», «6 de septiembre de 2026» y
  `$8,000.00`, y después Oaxaca con `$3,000.00`

#### Scenario: Día de pago en fin de semana

- **WHEN** la quincena trae el 15 de agosto de 2026 como día de pago en fin de semana
- **THEN** la sección «Quincena» advierte que ese día suma también el efecto del fin de semana y lo nombra como
  «15 de agosto de 2026»

### Requirement: Cada patrón que aparece tiene su gráfica

Cada sección cuyo patrón aparece SHALL tener una gráfica dibujada en la página con la librería incrustada, a partir
de opciones que son solo datos (sin funciones de JavaScript), con un nombre accesible en español que resume lo que
muestra.

#### Scenario: Gráfica de la categoría dominante

- **WHEN** la categoría dominante aparece con un reparto de tres categorías
- **THEN** la sección tiene una gráfica cuyas opciones traen las tres categorías en el orden del reparto

### Requirement: Las cifras de las gráficas van en formato es-MX

Toda cifra que una gráfica muestra como texto (etiquetas, ejes, descripciones emergentes) SHALL llegar en sus
opciones ya formateada por los formateadores es-MX de la página; la gráfica no SHALL mostrar números con el
formato propio de la librería ni textos de la librería en otro idioma.

#### Scenario: Etiquetas del reparto

- **WHEN** la gráfica de la zona favorita muestra Roma Norte con 500 y 0.5
- **THEN** sus opciones traen los textos `$500.00` y `50.0 %` y ningún texto de la gráfica es un número sin formato

### Requirement: El texto de los datos no rompe las gráficas

Un nombre que viene de los datos (categoría, zona, destino) SHALL llegar a la gráfica y a la página como texto
literal, aunque contenga marcado o la secuencia que cierra un `script`.

#### Scenario: Categoría con marcado

- **WHEN** el reparto trae la categoría `</script><b>x</b>`
- **THEN** la página tiene el mismo número de elementos `script` y ningún elemento `b` nuevo, y las opciones de
  la gráfica, leídas de la página, traen el nombre literal

### Requirement: La librería de gráficas va incrustada sin cambios

La página SHALL incrustar el archivo de la librería de gráficas de `src/reporte/presentacion/activos/` byte a
byte dentro de un `script` sin `src`, una sola vez, aunque haya varias gráficas.

#### Scenario: Contenido exacto

- **WHEN** se genera la página
- **THEN** uno de sus `script` contiene exactamente el contenido del archivo de la librería

### Requirement: Las gráficas usan la paleta de la página

Las gráficas SHALL usar los colores de la paleta del tema vigente y cambiar con el botón de tema. Cada color de
serie SHALL tener un contraste de al menos 3:1 sobre el fondo y sobre la superficie de cada tema. El cambio con
el botón se valida en la revisión visual.

#### Scenario: Contraste de las series

- **WHEN** se mide cada color de serie sobre el fondo y la superficie de los temas claro y oscuro
- **THEN** cada contraste es de al menos 3:1

### Requirement: La revisión de red escala con la página

La revisión de referencias de red SHALL tardar un tiempo proporcional al tamaño del HTML, también ante entradas
patológicas, para poder revisar la página con la librería incrustada en cada corrida.

#### Scenario: Muchos `url(` sin cerrar

- **WHEN** se revisa un HTML con 20,000 `url(` sin cerrar dentro de un `style`
- **THEN** la revisión termina en menos de 1 segundo

## MODIFIED Requirements

### Requirement: La página es un solo archivo sin referencias de red

La página SHALL ser un único archivo sin referencias de red. Una referencia de red es una URL `http:`,
`https:`, `ws:`, `wss:` o `ftp:`, o una que empieza con `//`, en una posición que el navegador carga: un
atributo `src`, `href`, `srcset`, `action`, `formaction`, `poster`, `data` o `xlink:href`; un `url()` o
`@import` de CSS; o un `import`, `import()`, `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`,
`sendBeacon` o `importScripts` de JavaScript (R16, issue #5).

#### Scenario: La página generada no tiene referencias

- **WHEN** se genera la página de cualquier análisis, con la librería de gráficas incrustada
- **THEN** no tiene ninguna referencia de red ni ningún `script` con `src` ni `link` con `href` a otro archivo

#### Scenario: Cada posición prohibida se detecta

- **WHEN** se revisa un HTML con `<img src="https://x.mx/a.png">`, `<link href="//x.mx/a.css">`,
  `url(http://x.mx/f.woff2)`, `@import "https://x.mx/b.css"`, `fetch("https://x.mx")` o
  `import("https://x.mx/m.js")`
- **THEN** cada una se reporta como referencia de red

#### Scenario: JavaScript minificado

- **WHEN** se revisa un `script` con `var re=/"/;fetch("https://x.mx/a")`, `import{a}from"https://x.mx/m.js"`,
  `import x from"https://x.mx/m.js"` o `importScripts(f(),"https://x.mx/w.js")`
- **THEN** cada una se reporta como referencia de red (issue #18)
