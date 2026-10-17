# Tasks

Ola `1-monthly-summary` (Fase 1 de `docs/PLAN.md`). Este change son los **PRs 2 a 5 de 5** de la ola; el PR 1
es el grupo 1 del change `read-transactions-csv`. El grafo:

- **PR 2 (grupo 1)** arranca desde el principio, **en paralelo con el PR 1**: no consume nada del otro change
  y sus archivos son disjuntos.
- **PR 3 (grupo 2)** arranca cuando el PR 1 está mergeado en la rama de ola: consume
  `reporte.nucleo.tipos.Transacciones`.
- **PR 4 (grupo 3)** arranca cuando el PR 2 y el PR 3 están mergeados (consume los formateadores, el
  detector y el `Analisis`) **y** el usuario entregó `InterVariable.woff2` y su licencia.
- **PR 5 (grupo 4)** arranca cuando el PR 4 está mergeado: encadena `datos`, `nucleo` y `presentacion`.

Reglas de la fase para todos los grupos:
- Los únicos textos que son contrato son los de R15 (formatos), R17 (el cierre), los mensajes fijos de
  `docs/DOMINIO.md` y la ausencia de red de R16; lo demás se afirma por comportamiento, no por redacción.
- Los hallazgos de R4 y lo que R14 dice de ellos **no** se implementan en esta fase (decisión D1 del
  pre-vuelo); si un grupo los necesita, se escala.

## 1. Formateadores es-MX y detector de red (PR 2, área `presentacion`, ~400 líneas)

- [ ] 1.1 Crear `src/reporte/presentacion/` con los formateadores de monto, porcentaje, entero, fecha, mes y
  día de la semana (requisitos de formato de la spec `pagina-del-reporte`; design, «Formateadores puros»).
  **Flujo que protege:** que cada cifra y cada fecha que el autor lee en la página tenga el formato es-MX de
  R15, incluidos el redondeo de la mitad y los montos con más de dos decimales. Se verifica con un test por
  escenario en `tests/presentacion/` y la mutación de cada uno (p. ej. usar `round` en vez de `ROUND_HALF_UP`
  pone en rojo «Redondeo de la mitad»; un `%02d` en el día pone en rojo «Fecha de un dígito»).
- [ ] 1.2 En la misma capa, el detector `referencias_de_red(html)` (requisitos «La página es un solo archivo
  sin referencias de red» y «Lo local y lo que no se carga no cuenta como red»; design, «Detector de red»).
  **Flujo que protege:** que ninguna página pueda cargar nada de internet sin que un test lo vea (R16,
  issue #5), sin rechazar la fuente incrustada ni las librerías de fases siguientes. Se verifica con un test
  por posición sembrada y uno por caso permitido, y la mutación de cada uno (p. ej. quitar `srcset` de la
  lista o dejar de excluir `data:`).

## 2. Resumen del mes en el núcleo (PR 3, área `nucleo`, ~250 líneas)

- [ ] 2.1 Crear en `src/reporte/nucleo/` el `Analisis`, el `Resumen` y `analizar(transacciones)`, exportado
  desde `reporte.nucleo` (design, «`Analisis` de la Fase 1»), con todos los requisitos de la spec
  `resumen-del-mes`. **Flujo que protege:** que las cifras del resumen que el autor ve sean las del mes:
  total, número, ticket promedio, día de mayor gasto con su desempate, gasto variable y su proporción, último
  día del mes y avisos (R3, R4 sin hallazgos, R5, caso borde «Una sola transacción»). Se verifica con un test
  por escenario sobre tablas hechas a mano en `tests/nucleo/` (resultado calculado a mano, por `analizar`) y
  la mutación de cada uno (p. ej. sacar `Viajes` de las categorías excluidas pone en rojo «Cargos fijos y
  viajes fuera del variable»; elegir el día por la compra más cara pone en rojo «Día con más gasto»).

## 3. La página del reporte (PR 4, área `presentacion`, ~500 líneas sin contar el binario de la fuente)

- [ ] 3.1 Copiar `InterVariable.woff2` y su texto de licencia (los entrega el usuario; ruta en el brief) a
  `src/reporte/presentacion/activos/` y crear `activos/LICENCIAS.md` con versión (Inter 4.1), licencia
  (OFL-1.1), origen y SHA-256 del archivo, más el test de licencias (requisito «Cada activo incrustado declara
  versión y licencia»). **Flujo que protege:** que ningún activo entre a la página sin versión y licencia
  (regla innegociable 6). Se verifica con el test en verde y la mutación de borrar la fila de Inter.
- [ ] 3.2 El tema como datos y el test de contraste (requisito «La paleta negro y dorado es legible en los
  dos temas»; design, «Tema como datos»). **Flujo que protege:** que el texto se lea en los dos temas.
  Se verifica con el test de cada par y la mutación de oscurecer el texto del tema oscuro.
- [ ] 3.3 `renderizar(analisis) -> str`, exportado desde `reporte.presentacion`, con la plantilla Jinja2: la
  fuente incrustada, el tema con su botón y su script, los avisos, el encabezado con mes y periodo, el resumen
  formateado y el cierre (requisitos «La página muestra el encabezado y el resumen del mes», «…los avisos…»,
  «El texto que viene de los datos se muestra literal», «La fuente Inter va incrustada», «La página es un
  solo archivo…» y «El último texto visible es el mensaje de cierre»). **Flujo que protege:** que el
  `Analisis` de un mes se convierta en una página única, sin red, en español, que termina con «Aquí queda la
  línea del respeto» (R15–R17). Se verifica con tests sobre un `Analisis` construido a mano y el HTML
  parseado con `html.parser` (cifras visibles, avisos, escape, cero referencias con el detector del grupo 1,
  fuente igual al archivo, último texto visible), y la mutación de cada uno (p. ej. poner el botón del tema
  después del cierre pone en rojo el test de R17; quitar `autoescape` pone en rojo el de escape).

## 4. La CLI y la suite de sistema de la fase (PR 5, áreas `app` y `generador` más `README.md`, ~300 líneas)

- [ ] 4.1 Crear `src/reporte/app.py` con `main(argv: list[str] | None = None) -> int` y
  `src/reporte/__main__.py`, con todos los requisitos de la spec `linea-de-comandos` (design, «CLI»).
  **Flujo que protege:** que el autor genere la página con un comando y que, ante un CSV rechazado o una
  salida imposible, lea por qué en español sin una traza de Python. Se verifica con un test por escenario en
  `tests/app/` (`main([...])` con `tmp_path`, CSV escritos en el test) y la mutación de cada uno (p. ej.
  tomar el mes del nombre del archivo pone en rojo «El nombre sale del mes de los datos»).
- [ ] 4.2 Crear `tests/sistema/test_reporte.py` con marcador `sistema` (design, «Suite `sistema` de la
  fase»). **Flujo que protege:** el entregable de la Fase 1 de punta a punta, con el generador real y el
  comando que corre el autor: la página existe, no usa la red, cierra con el mensaje literal, pesa < 10 MB y
  sus KPIs coinciden con el CSV; y un CSV inválido da código 1 con su motivo. Se verifica con la suite
  `sistema` en verde y la mutación de cambiar el total esperado (falla el caso de KPIs).
- [ ] 4.3 Actualizar `README.md`: el reporte ya existe (fuera el «todavía no existe» de `README.md:3-8`) y
  una sección de uso con `python -m reporte output/transacciones_AAAA-MM.csv`, `-o` y el código de salida de
  un CSV rechazado. Se verifica con `.claude/da/da citas` limpio y cada comando del README corriendo tal como
  está escrito (salvo el de instalación, que corre el usuario).

## Revisión visual de la fase

No es una tarea de implementador (no abre un navegador). Tras el PR 5, el PM genera
`output/reporte_2026-09.html` con el generador y la CLI, y la PR de ola pide al usuario la revisión visual de
`docs/PLAN.md` (Fase 1): abrir en modo avión; tema del sistema en claro y en oscuro; el botón cambia el tema y
la elección sobrevive a una recarga; con el almacenamiento bloqueado (ventana privada estricta) el botón
cambia el tema sin errores en la consola; la fuente es Inter; la paleta negro y dorado se ve bien; el último
texto es el cierre.
