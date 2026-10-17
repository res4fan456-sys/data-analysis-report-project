# Tasks

Este change y `detect-spending-patterns` forman **una sola ola** (`2-spending-patterns`) de 5 PRs internas; el
grafo completo está en el `tasks.md` de `detect-spending-patterns`. Aquí:

- El grupo 1 arranca tras el grupo 1 de `detect-spending-patterns` (usa `Analisis.patrones.dominante`) y corre en
  paralelo con su grupo 2 (áreas disjuntas).
- El grupo 2 arranca tras el grupo 1 de este change y el grupo 2 de `detect-spending-patterns` (usa
  `Analisis.hallazgos` y los patrones de quincena y fin de semana).

Regla de la fase: lo que la página de la Fase 1 ya muestra no cambia; el archivo de la librería no se modifica.
Cada prueba construye un `Analisis` a mano y lee el HTML con `html.parser`, como las de la Fase 1.

## 1. Librería, detector, tema y primera gráfica (`presentacion`)

- [ ] 1.1 Incrustar ECharts 6.0.0 (o 5.6.0 si la verificación del design falla) en `activos/` con
  `echarts-LICENSE.txt` y `echarts-NOTICE.txt`, y sus filas en `LICENCIAS.md`. Flujo que protege: «cada activo
  declara versión y licencia»; verificación: `tests/presentacion/test_presentacion_licencias.py` pasa con los
  activos reales y los SHA-256 son los que reportó el usuario.
- [ ] 1.2 La página incrusta la librería una vez, byte a byte, en un `script` sin `src`. Flujo: «la página dibuja
  sin red»; verificación: el escenario «Contenido exacto» pasa y falla si la plantilla escapa el contenido.
- [ ] 1.3 Detector: los cuatro casos del escenario «JavaScript minificado» y el tiempo lineal de «Muchos `url(`
  sin cerrar»; la página real con la librería no tiene referencias de red. Flujo: «la vigilancia de cero red ve
  lo que carga el código minificado»; verificación: esos escenarios y los que ya existen en
  `tests/presentacion/test_presentacion_red.py` pasan.
- [ ] 1.4 Colores de serie en `tema.py` con su contraste de al menos 3:1 sobre fondo y superficie de los dos
  temas, y los temas `claro` y `oscuro` de la librería generados desde ahí. Flujo: «las gráficas se leen en los dos
  temas»; verificación: el escenario «Contraste de las series» pasa y falla con un color de serie igual al fondo.
- [ ] 1.5 La sección «Categoría dominante» con su hallazgo, sus cifras, su gráfica (opciones solo de datos,
  etiquetas es-MX, nombre accesible, opciones en un `script` JSON escapado) y sus estados de R14; el arranque de
  las gráficas y el redibujo al cambiar de tema. Flujo: «la primera gráfica de la página, de punta a punta»;
  verificación: los escenarios «Gráfica de la categoría dominante», «Categoría con marcado» y «Sin datos
  suficientes» pasan, y la sección va tras el resumen y antes del cierre.

## 2. Hallazgos y las otras cuatro secciones (`presentacion`)

- [ ] 2.1 Formateador de factores. Flujo: «los factores de quincena y fin de semana se leen como R9»;
  verificación: el escenario «Factor de quincena» pasa, y 2.25 da `×2.3` (mitad hacia arriba).
- [ ] 2.2 Lista «Hallazgos principales» en el resumen, con la frase de cada tipo. Flujo: «lo primero que lee el
  autor»; verificación: el escenario «Tres hallazgos en orden» pasa, y un hallazgo de relleno muestra su cifra.
- [ ] 2.3 Secciones «Zona favorita», «Quincena», «Fin de semana» y «Viaje» con sus cifras, sus estados y sus
  mensajes fijos. Flujo: «cada patrón se explica con sus números»; verificación: los escenarios «Cinco secciones
  en orden», «Mes sin viaje», «Quincena por debajo del umbral», «Dos viajes» y «Día de pago en fin de semana» pasan.
- [ ] 2.4 Gráficas de esas cuatro secciones, con las mismas reglas que la del grupo 1. Flujo: «cada patrón que
  aparece se ve»; verificación: el escenario «Etiquetas del reparto» pasa y cada sección que aparece tiene sus
  opciones en la página.
- [ ] 2.5 Revisión visual: la página de septiembre de 2026 (20,000 registros, semilla 42) abierta sin red en los
  dos temas, con el cambio de tema redibujando las gráficas. Flujo: «la página se ve bien y con sentido»
  (`docs/PLAN.md`, Fases); verificación: capturas de los dos temas en la PR.
