# Dominio

La fuente de verdad del comportamiento del reporte. Cada regla tiene al menos un test.

## Entidades

| Entidad | Qué es |
|---|---|
| `transacción` | Un gasto. Tiene `id_transaccion`, `fecha` (fecha y hora), `monto` (MXN, > 0), `concepto`, `categoria`, `cuenta`, `zona`, `latitud` y `longitud`. |
| `mes` | El periodo del reporte: un mes calendario completo. |
| `categoría` | Clasificación del gasto: Comida, Transporte, Supermercado, Entretenimiento, Compras, Salud, Servicios, Suscripciones, Vivienda, Viajes (y cualquier otra que traiga el CSV). |
| `cuenta` | Medio de pago, p. ej. `Tarjeta de Crédito ****8072`. |
| `zona` | Lugar con nombre, p. ej. `Roma Norte, CDMX`. Su centroide es el promedio de las coordenadas de sus transacciones. |
| `comercio` | El `concepto` de la transacción. |
| `cargo fijo` | Transacción de categoría `Vivienda`, `Servicios` o `Suscripciones`. |
| `día de pago` | El día 15 y el último día del mes. |
| `viaje` | Bloque de días consecutivos con gasto en una zona lejana. |
| `atípico` | Transacción con un monto muy por encima de lo normal para su comercio o su categoría. |
| `hallazgo` | Conclusión en lenguaje natural derivada de los datos, con su cifra de respaldo. |
| `reporte` | La página HTML resultante. |

## Reglas

**Entrada**

- **R1 — Columnas.**
  - El CSV trae exactamente las columnas `id_transaccion, fecha, monto, concepto, categoria, cuenta, zona, latitud, longitud`, en UTF-8 (con o sin BOM).
  - Si falta una columna o sobra una, se rechaza el archivo con un mensaje en español que la nombra.
- **R2 — Filas válidas.**
  - `fecha` tiene el formato `AAAA-MM-DD HH:MM:SS`, `monto` es un número > 0 y `latitud`/`longitud` son numéricas.
  - `id_transaccion` es único y ningún campo viene vacío.
  - Si alguna fila es inválida, se rechaza el archivo con el número de fila y el motivo. Nunca se descartan filas en silencio.
- **R3 — Un solo mes.**
  - Todas las fechas caen en el mismo mes calendario; si no, se rechaza el archivo indicando los meses encontrados.
  - El último día del mes sale del calendario (28, 29, 30 o 31).

**Resumen**

- **R4 — Resumen ejecutivo.**
  - Gasto total, número de transacciones, ticket promedio (total / número) y el día de mayor gasto con su monto.
  - Entre 3 y 5 hallazgos principales, ordenados por relevancia.
- **R5 — Gasto variable.** Es el gasto total menos los cargos fijos (`Vivienda`, `Servicios`, `Suscripciones`) y la categoría `Viajes`.

**Patrones**

- **R6 — Categoría dominante.** Es la categoría con mayor participación en el gasto variable. Se reporta su % del gasto variable y su % del total.
- **R7 — Zona favorita.** Es la zona no lejana con mayor gasto en `Comida` + `Entretenimiento`. Se reporta su % de ese gasto.
- **R8 — Zona lejana y viaje.**
  - **Centro principal:** la mediana de latitud y la mediana de longitud de todas las transacciones.
  - **Zona lejana:** una zona cuyo centroide está a más de 50 km del centro principal (distancia haversine).
  - **Viaje:** cada bloque de días consecutivos con al menos una transacción en una misma zona lejana.
  - **Gasto del viaje:** el de esos días en esa zona, más las transacciones de categoría `Viajes` del mes que mencionan la ciudad o ocurren en ella.
  - Se reportan el destino, las fechas de inicio y fin y el gasto del viaje.
  - Si no hay zonas lejanas, la sección dice «No se detectó un viaje este mes».
- **R9 — Quincena.**
  - Cada día del mes se clasifica en uno de cuatro tipos:
    - **día de pago:** el 15 y el último día;
    - **post-pago:** el 16 y el 1;
    - **la cuesta:** del 12 al 14 y los 3 días previos al último;
    - **normal:** el resto.
  - Para cada tipo se reporta el gasto promedio por día y su factor contra los días normales (p. ej. «×2.3»).
- **R10 — Fin de semana.**
  - Se compara el gasto promedio por día de viernes a domingo contra el de lunes a jueves.
  - Se reporta aparte el entretenimiento nocturno: categoría `Entretenimiento` con hora ≥ 20 o < 4.

**Desglose**

- **R11 — Atípicos.**
  - Los cargos fijos y la categoría `Viajes` nunca cuentan como atípicos.
  - En un comercio con ≥ 5 transacciones, es atípica la transacción que supera 3 veces la mediana del comercio.
  - En comercios con menos transacciones, es atípica la que supera Q3 + 3·IQR de su categoría.
  - Se listan ordenados por monto, de mayor a menor.
- **R12 — Desglose.**
  - Gasto, % y número de transacciones por cuenta y por categoría.
  - Los 10 comercios principales por número de transacciones y los 10 por monto.
  - La lista de cargos fijos con fecha, concepto y monto.

**Mapa y presentación**

- **R13 — Mapa.**
  - Las transacciones se agregan por coordenada redondeada a 3 decimales (unos 100 m), con el monto sumado y el número de transacciones.
  - La vista de ciudad se centra en el centro principal; la vista nacional muestra además las zonas lejanas.
- **R14 — Honestidad.**
  - Cada hallazgo sale de los datos y lleva su cifra.
  - Si un patrón no aparece (p. ej. ninguna categoría supera el 30 % del gasto variable, o el factor de quincena es < 1.1), se dice así y no se presenta como patrón.
- **R15 — Formato es-MX.**
  - Montos como `$1,234.56`. Porcentajes con un decimal (`42.3 %`).
  - Fechas como «15 de septiembre de 2026» y días de la semana en español.
  - Todo texto visible está en español.
- **R16 — Un archivo, cero red.**
  - El HTML es un solo archivo y no contiene `http://`, `https://` ni `//` en `src`, `href`, `url()`, `import` o `fetch`.
  - La librería de gráficas, la fuente y las geometrías van incrustadas.
- **R17 — Cierre.** El último texto visible de la página es, literalmente, «Aquí queda la línea del respeto».

## Casos borde

| Caso | Comportamiento |
|---|---|
| Archivo vacío o con solo el encabezado | Se rechaza: «El archivo no tiene transacciones». |
| Una sola transacción | Se genera el reporte; los patrones que no pueden calcularse se declaran «sin datos suficientes» (R14). |
| Febrero de 28 o 29 días | El día de pago es el 28 o el 29, y la cuesta son los 3 días previos (R9). |
| El 15 o el último día cae en fin de semana | Se reportan ambos efectos y el hallazgo advierte que se solapan. |
| Mes sin viaje | Se muestra «No se detectó un viaje este mes»; el mapa nacional se omite. |
| Dos o más zonas lejanas | Se reporta cada viaje por separado, ordenados por gasto. |
| Categoría que no está en la lista conocida | Es válida; se muestra con su nombre tal cual y cuenta como gasto variable. |
| Una sola cuenta | El desglose por cuenta muestra una fila; sin gráfica de reparto. |
| Montos con más de 2 decimales | Se aceptan; se redondean solo al mostrarlos. |
| Coordenadas fuera de México (lat 14–33, lon −119 a −86) | Se aceptan con un aviso visible en el reporte. |
| Acentos y BOM en el CSV | Se leen correctamente (UTF-8 / UTF-8-SIG). |

## Glosario

- **Quincena:** pago de nómina del día 15 y del último día del mes; también el periodo entre pagos.
- **La cuesta:** los días previos al pago, cuando el gasto baja.
- **Gasto variable:** gasto total sin cargos fijos ni la categoría `Viajes` (R5).
- **Cargo fijo:** renta, servicios y suscripciones; ocurren una vez al mes.
- **Centro principal:** el punto mediano de todas las transacciones; aproxima la ciudad donde vive la persona.
- **Zona lejana:** zona a más de 50 km del centro principal.
- **Hallazgo:** conclusión en lenguaje natural con su cifra de respaldo.
- **Atípico:** compra muy por encima de lo normal para su comercio o su categoría (R11).
- **Perfil inyectado:** los patrones que el generador eligió para un CSV; se ven con `-v` y la suite de sistema los usa como respuesta esperada.
