# Spec Delta

## Purpose

Define los cinco patrones de gasto de un mes (reglas R6–R10 de `docs/DOMINIO.md`), cuándo cada uno aparece, no
aparece o no tiene datos suficientes (R14), y los datos ya calculados que su gráfica necesita.

## ADDED Requirements

### Requirement: Cada patrón declara si aparece

Cada uno de los cinco patrones SHALL traer uno de tres estados: `aparece`, `no aparece` (con la cifra que lo
decidió) o `sin datos suficientes` (cuando la cifra no se puede calcular). Un patrón que no aparece SHALL
conservar su cifra para que se diga así, y nunca SHALL presentarse como patrón (R14).

#### Scenario: Una sola transacción

- **WHEN** se analiza un mes con una sola transacción de 87.25 en `Comida`, un martes 8 de septiembre de 2026
- **THEN** la quincena no aparece con factor de día de pago 0.0, el fin de semana no aparece con factor 0.0 y
  no hay viaje
- **AND** el análisis se produce sin error

#### Scenario: Sin gasto variable

- **WHEN** todas las transacciones del mes son de `Vivienda`, `Servicios`, `Suscripciones` o `Viajes`
- **THEN** la categoría dominante está `sin datos suficientes`

### Requirement: La categoría dominante es la de mayor participación en el gasto variable

La categoría dominante SHALL ser la categoría con mayor gasto dentro del gasto variable (R5), con su proporción
del gasto variable y su proporción del total (R6). Aparece solo si su proporción del gasto variable supera 0.30
(R14). Si dos categorías empatan, SHALL ganar la primera en orden alfabético.

#### Scenario: Comida domina

- **WHEN** el mes tiene `Comida` 600, `Transporte` 300, `Compras` 100 y `Vivienda` 1000
- **THEN** la categoría dominante es `Comida`, con 0.60 del gasto variable y 0.30 del total, y aparece

#### Scenario: Ninguna supera el 30 %

- **WHEN** el gasto variable se reparte en cuatro categorías de 250 cada una
- **THEN** la categoría dominante no aparece y conserva su proporción 0.25

#### Scenario: Categoría desconocida

- **WHEN** la categoría `Mascotas`, que no está en la lista conocida, tiene el 70 % del gasto variable
- **THEN** la categoría dominante es `Mascotas`

### Requirement: La categoría dominante trae el reparto del gasto variable

La categoría dominante SHALL traer el gasto de cada categoría del gasto variable con su proporción, ordenado de
mayor a menor gasto, para su gráfica.

#### Scenario: Reparto ordenado

- **WHEN** el mes tiene `Comida` 600, `Transporte` 300 y `Compras` 100 de gasto variable
- **THEN** el reparto es `Comida` 600 (0.60), `Transporte` 300 (0.30) y `Compras` 100 (0.10), en ese orden

### Requirement: La zona favorita es la zona cercana con más gasto en Comida y Entretenimiento

La zona favorita SHALL ser la zona no lejana (R8) con mayor gasto en `Comida` + `Entretenimiento`, con su
proporción de ese gasto en las zonas no lejanas (R7). Aparece solo si esa proporción es de al menos 0.30. Si dos
zonas empatan, SHALL ganar la primera en orden alfabético. Sin gasto de esas categorías en zonas no lejanas, está
`sin datos suficientes`. SHALL traer el gasto de cada zona no lejana, de mayor a menor, para su gráfica.

#### Scenario: Roma Norte es la favorita

- **WHEN** en zonas no lejanas el gasto en `Comida` + `Entretenimiento` es Roma Norte 500, Condesa 300 y
  Polanco 200, y Roma Norte tiene además 900 de `Supermercado`
- **THEN** la zona favorita es Roma Norte con 0.50 y aparece
- **AND** el reparto es Roma Norte 500, Condesa 300 y Polanco 200

#### Scenario: El gasto del viaje no cuenta

- **WHEN** una zona lejana tiene 2000 de `Comida` y Condesa, la zona cercana con más, tiene 400 de 800
- **THEN** la zona favorita es Condesa con 0.50

### Requirement: Un viaje es un bloque de días consecutivos en una zona lejana

El centro principal SHALL ser la mediana de latitud y la mediana de longitud de todas las transacciones; una zona
SHALL ser lejana si el centroide de sus transacciones está a más de 50 km del centro principal (haversine). Cada
bloque de días consecutivos con al menos una transacción en una misma zona lejana SHALL ser un viaje, con su
destino (la zona), su primer y su último día (R8).

#### Scenario: Fin de semana en Oaxaca

- **WHEN** un mes en Ciudad de México tiene transacciones en `Oaxaca, Oax.` el 11, 12 y 13 de septiembre
- **THEN** hay un viaje a `Oaxaca, Oax.` del 11 al 13 de septiembre de 2026

#### Scenario: Zona a menos de 50 km

- **WHEN** la única zona fuera de la ciudad tiene su centroide a 40 km del centro principal
- **THEN** no hay viaje

#### Scenario: Dos bloques en la misma zona

- **WHEN** hay transacciones en `Cancún, Q. Roo` el 4 y 5 y el 20 y 21 de septiembre, y ninguna entre ellos
- **THEN** hay dos viajes a `Cancún, Q. Roo`: del 4 al 5 y del 20 al 21

### Requirement: El gasto del viaje suma sus días y sus cargos de Viajes

El gasto de un viaje SHALL ser el de sus días en su zona, más las transacciones `Viajes` del mes que ocurren en
esa zona o cuyo `concepto` menciona la ciudad (el nombre de la zona hasta su primera coma, sin distinguir
mayúsculas). Cada transacción SHALL contar una sola vez. Una transacción `Viajes` que menciona la ciudad fuera de
los días de un viaje SHALL sumarse al primer viaje a esa zona que empieza después de ella, o al último si ninguno.

#### Scenario: Vuelo comprado antes y hotel al salir

- **WHEN** el viaje a `Guadalajara, Jal.` del 11 al 13 tiene 1500 de gasto en esos días, incluido un `Hotel
  Pérez` de `Viajes` por 900 en esa zona el 13, y el 2 hay un `Vuelo a Guadalajara` de `Viajes` por 4000 en casa
- **THEN** el gasto del viaje es 5500

#### Scenario: Viajes que no mencionan la ciudad

- **WHEN** hay un `Vuelo a Monterrey` de `Viajes` y el único viaje es a `Oaxaca, Oax.`
- **THEN** ese vuelo no suma al gasto del viaje

### Requirement: Los viajes se reportan ordenados por gasto

El patrón de viaje SHALL traer cada viaje por separado, ordenados de mayor a menor gasto; aparece si hay al menos
uno. Si no hay zonas lejanas, no aparece y no trae viajes. SHALL traer además el gasto de cada día del mes, con
los días de cada viaje identificados, para su gráfica.

#### Scenario: Dos zonas lejanas

- **WHEN** hay un viaje a `Oaxaca, Oax.` con gasto 3000 y otro a `Monterrey, N.L.` con gasto 8000
- **THEN** el patrón trae primero el de Monterrey y luego el de Oaxaca

#### Scenario: Mes sin viaje

- **WHEN** todas las zonas del mes están a menos de 50 km del centro principal
- **THEN** el patrón de viaje no aparece y no trae viajes

### Requirement: La quincena compara cada tipo de día contra los días normales

Cada día del calendario del mes SHALL clasificarse como día de pago (15 y último), post-pago (16 y 1), la cuesta
(12 a 14 y los 3 días previos al último) o normal. Por tipo SHALL calcularse el gasto promedio por día (su gasto
entre sus días del calendario, con gasto o sin él) y su factor contra los normales (R9). Aparece si el factor del
día de pago es de al menos 1.1 (R14).

#### Scenario: Septiembre

- **WHEN** se analiza septiembre de 2026 con 1000 de gasto el 15, 1000 el 30 y 100 en cada uno de los 20 días
  normales
- **THEN** el promedio del día de pago es 1000, el de los normales es 100, su factor es 10.0 y la quincena aparece

#### Scenario: Febrero de 28 días

- **WHEN** se analiza febrero de 2027
- **THEN** los días de pago son el 15 y el 28, y la cuesta son el 12, 13, 14, 25, 26 y 27

#### Scenario: Febrero bisiesto

- **WHEN** se analiza febrero de 2028
- **THEN** los días de pago son el 15 y el 29, y la cuesta son el 12, 13, 14, 26, 27 y 28

#### Scenario: Factor por debajo del umbral

- **WHEN** el factor del día de pago es 1.05
- **THEN** la quincena no aparece y conserva su factor 1.05

#### Scenario: Sin gasto en días normales

- **WHEN** ningún día normal del mes tiene gasto
- **THEN** la quincena está `sin datos suficientes`

### Requirement: La quincena avisa cuando un día de pago cae en fin de semana

El patrón de quincena SHALL traer los días de pago que caen de viernes a domingo, para que su hallazgo advierta
que su efecto se solapa con el de fin de semana; ambos patrones SHALL calcularse igual.

#### Scenario: El 15 cae en sábado

- **WHEN** se analiza agosto de 2026, cuyo 15 es sábado
- **THEN** el patrón de quincena trae el 15 de agosto de 2026 como día de pago en fin de semana

### Requirement: El fin de semana compara de viernes a domingo contra de lunes a jueves

El patrón de fin de semana SHALL traer el gasto promedio por día de viernes a domingo y de lunes a jueves (entre
sus días del calendario) y su factor (R10). Aparece si el factor es de al menos 1.1. Sin gasto de lunes a jueves,
está `sin datos suficientes`.

#### Scenario: Fines de semana más caros

- **WHEN** septiembre de 2026 tiene 300 cada día de viernes a domingo y 100 cada día de lunes a jueves
- **THEN** los promedios son 300 y 100, el factor es 3.0 y el fin de semana aparece

### Requirement: El fin de semana reporta aparte el entretenimiento nocturno

El patrón de fin de semana SHALL traer el gasto de `Entretenimiento` con hora de las 20:00 en adelante o antes
de las 4:00, de todos los días, y su proporción del gasto de `Entretenimiento` (R10).

#### Scenario: Cine a las 22 y a las 3

- **WHEN** hay `Entretenimiento` de 200 a las 22:00, 100 a las 03:59, 100 a las 04:00 y 100 a las 19:59
- **THEN** el entretenimiento nocturno es 300, con 0.60 del gasto de `Entretenimiento`
