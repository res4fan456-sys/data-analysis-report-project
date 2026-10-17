# Tasks

Este change y `chart-pattern-sections` forman **una sola ola** (`2-spending-patterns`) de 5 PRs internas. Grafo
de la ola (P = grupo de este change; C = grupo de `chart-pattern-sections`):

- P1 primero: crea `Analisis.patrones`, que todo lo demás lee.
- P2 y C1 en paralelo tras P1 (áreas disjuntas: `nucleo` y `presentacion`; C1 solo lee la categoría dominante).
- C2 tras P2 y C1 (lee `Analisis.hallazgos` y los demás patrones, y usa la mecánica de gráficas de C1).
- P3 al final, tras C2 (su prueba de sistema recorre la página con las cinco secciones).

Orden: P1 → (P2 ∥ C1) → C2 → P3.

Regla de la fase: el resumen de la Fase 1 no cambia; los campos nuevos de `Analisis` son aditivos y llevan los
nombres del design. Cada prueba va por la interfaz pública (`analizar`, `generar_mes`), con tablas hechas a mano.

## 1. Patrones de categoría, zona y viaje (`nucleo`)

- [ ] 1.1 `Patrones` y `EstadoDePatron` en `Analisis.patrones` con los nombres del design, y R6: la categoría
  dominante con sus proporciones, su reparto ordenado y su estado (umbral 0.30). Flujo que protege: «qué categoría
  domina el gasto variable»; verificación: los escenarios de la spec `patrones-de-gasto` (Comida domina, ninguna
  supera el 30 %, categoría desconocida, sin gasto variable, reparto ordenado) pasan por `analizar`, y
  `tests/presentacion/_pagina_de_prueba.py` construye su `Analisis` con `patrones` (todos `SIN_DATOS`) sin que
  cambie ninguna otra prueba de `tests/presentacion/`.
- [ ] 1.2 Empate de la categoría dominante: desempate alfabético y sumas que solo difieren por el error binario
  cuentan como empate. Flujo: «la dominante no depende del orden del CSV»; verificación: una prueba con el CSV en
  dos órdenes da la misma categoría.
- [ ] 1.3 R8: centro principal, zonas lejanas, viajes por bloque, gasto del viaje con sus cargos `Viajes` (sin
  contar dos veces), orden por gasto y gasto diario del mes con los días de viaje. Flujo: «el reporte encuentra el
  viaje y lo que costó»; verificación: los escenarios de la spec (Oaxaca, zona a 40 km, dos bloques, vuelo y
  hotel, vuelo a otra ciudad, dos zonas lejanas, mes sin viaje) pasan por `analizar`.
- [ ] 1.4 R7: la zona favorita entre las zonas no lejanas, con su proporción, su reparto, su estado (umbral 0.30)
  y su desempate. Flujo: «dónde sale a comer y divertirse»; verificación: los escenarios de la spec (Roma Norte,
  el gasto del viaje no cuenta) y un caso sin `Comida` ni `Entretenimiento` pasan por `analizar`.

## 2. Quincena, fin de semana y hallazgos (`nucleo`)

- [ ] 2.1 R9: tipo de cada día del calendario, promedio por tipo, factor contra los normales, estado (umbral 1.1)
  y días de pago de viernes a domingo. Flujo: «cuánto más gasta en quincena»; verificación: los escenarios de la
  spec (septiembre, febrero de 28 días, febrero bisiesto, factor 1.05, sin gasto en días normales, el 15 en
  sábado) pasan por `analizar`.
- [ ] 2.2 R10: promedios de viernes a domingo y de lunes a jueves, factor, estado (umbral 1.1) y entretenimiento
  nocturno con sus bordes de hora (20:00 sí, 4:00 no). Flujo: «cuánto más gasta en fin de semana y de noche»;
  verificación: los escenarios de la spec (fines de semana más caros, cine a las 22 y a las 3) pasan.
- [ ] 2.3 R4 y R14: entre 3 y 5 hallazgos con tipo, cifra y relevancia; relleno en su orden; nunca un patrón que
  no aparece. Flujo: «los hallazgos principales del resumen»; verificación: los escenarios de la spec
  `resumen-del-mes` (una sola transacción, ningún patrón aparece, seis candidatos, la quincena no aparece, el
  viaje pesa más que la quincena, empate de relevancia) pasan por `analizar`, y el caso borde «Una sola
  transacción» de `docs/DOMINIO.md` produce el análisis sin error; `tests/presentacion/_pagina_de_prueba.py` gana
  `hallazgos=()` sin otro cambio.

## 3. Perfil inyectado y suite de sistema (`generador`)

Arranca tras el grupo 2 de `chart-pattern-sections`.

- [ ] 3.1 `generar_mes` en `generador/generar_transacciones.py`, y `main` reescrito sobre ella. Flujo: «el perfil
  se obtiene sin leer la salida»; verificación: una prueba nueva compara el perfil devuelto con lo que imprime
  `-v` para el escenario de la spec, y `tests/sistema/test_generador.py`, sin modificar, sigue en verde (corrido
  por ruta con el marcador `sistema`).
- [ ] 3.2 Prueba de sistema «lo detectado coincide con lo inyectado»: septiembre de 2026, 20,000 registros,
  semilla 42, para `Comida`, `Transporte`, `Entretenimiento` y `Compras`; compara categoría dominante, zona
  favorita y viaje (destino, primer y último día) contra el perfil, y que la quincena aparece. Flujo: «con datos
  del generador, el reporte encuentra lo que se inyectó»; verificación: la suite de sistema pasa entera y falla
  si se cambia el umbral de 50 km por 5,000 km (el viaje deja de detectarse).
- [ ] 3.3 En la misma prueba, la página generada por `python -m reporte` para la semilla 42 tiene una sección por
  patrón con su nombre accesible (los de la spec de `chart-pattern-sections`), sin referencias de red y con el
  mensaje final. Flujo: «la página del mes trae los cinco patrones»; verificación: pasa en la suite de sistema.
