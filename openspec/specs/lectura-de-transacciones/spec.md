# lectura-de-transacciones Specification

## Purpose

Define qué CSV de transacciones acepta el reporte, qué rechaza y con qué mensaje en español, y qué avisos
acompañan a un archivo aceptado (reglas R1–R3 y casos borde de entrada de `docs/DOMINIO.md`).

## Requirements

### Requirement: El CSV trae exactamente las nueve columnas del contrato

El reporte SHALL aceptar solo un CSV cuyo encabezado contenga exactamente las columnas `id_transaccion`,
`fecha`, `monto`, `concepto`, `categoria`, `cuenta`, `zona`, `latitud` y `longitud`, en cualquier orden y
sin repetir ninguna. Si falta o sobra una columna, SHALL rechazar el archivo con un mensaje en español que
nombra cada columna faltante o sobrante (R1).

#### Scenario: Falta una columna

- **WHEN** se lee un CSV sin la columna `zona`
- **THEN** se rechaza el archivo y el mensaje nombra `zona`

#### Scenario: Sobra una columna

- **WHEN** se lee un CSV con las nueve columnas más `notas`
- **THEN** se rechaza el archivo y el mensaje nombra `notas`

#### Scenario: Las columnas vienen en otro orden

- **WHEN** se lee un CSV válido con las nueve columnas en otro orden
- **THEN** se acepta y la tabla resultante tiene las nueve columnas

### Requirement: El CSV se lee como UTF-8, con o sin BOM

El reporte SHALL leer el CSV como UTF-8, con o sin BOM, y conservar los acentos y la `ñ` de cada campo. Un
archivo que no es UTF-8 válido SHALL rechazarse con un mensaje en español que lo dice (R1, caso borde
«Acentos y BOM en el CSV»).

#### Scenario: CSV con BOM y acentos

- **WHEN** se lee un CSV válido que empieza con BOM y trae `Panadería Ñandú` en `concepto`
- **THEN** se acepta, la primera columna se llama `id_transaccion` y el concepto conserva sus acentos y su `ñ`

#### Scenario: CSV que no es UTF-8

- **WHEN** se lee un CSV codificado en Latin-1 con acentos
- **THEN** se rechaza el archivo con un mensaje que dice que no está en UTF-8

### Requirement: Un archivo sin transacciones se rechaza con su mensaje fijo

Un archivo vacío o con solo el encabezado SHALL rechazarse con el mensaje literal «El archivo no tiene
transacciones» (caso borde de `docs/DOMINIO.md`).

#### Scenario: Archivo vacío

- **WHEN** se lee un archivo de cero bytes
- **THEN** se rechaza con el mensaje «El archivo no tiene transacciones»

#### Scenario: Solo el encabezado

- **WHEN** se lee un CSV que solo trae la línea de encabezado
- **THEN** se rechaza con el mensaje «El archivo no tiene transacciones»

### Requirement: Cada fila cumple el formato de sus campos

Cada fila SHALL tener `fecha` con formato `AAAA-MM-DD HH:MM:SS` y una fecha real, `monto` numérico, finito y
mayor que cero, `latitud` y `longitud` numéricas y finitas, y ningún campo vacío o hecho solo de espacios. Si
una fila no cumple, el archivo SHALL rechazarse; nunca se descarta una fila en silencio (R2).

#### Scenario: Fecha con otro formato

- **WHEN** una fila trae `fecha` = `15/09/2026 10:00`
- **THEN** se rechaza el archivo nombrando esa fila y el campo `fecha`

#### Scenario: Monto cero, negativo o no numérico

- **WHEN** una fila trae `monto` = `0`, `-12.50`, `abc` o `inf`
- **THEN** se rechaza el archivo nombrando esa fila y el campo `monto`

#### Scenario: Coordenada no numérica

- **WHEN** una fila trae `latitud` = `norte`
- **THEN** se rechaza el archivo nombrando esa fila y el campo `latitud`

#### Scenario: Campo vacío o fila incompleta

- **WHEN** una fila trae `cuenta` vacía, o le faltan campos al final
- **THEN** se rechaza el archivo nombrando esa fila y el campo vacío

#### Scenario: Fila con campos de más

- **WHEN** una fila trae diez campos en un CSV de nueve columnas
- **THEN** se rechaza el archivo nombrando esa fila

### Requirement: El rechazo de una fila dice su número y su motivo

El mensaje de una fila inválida SHALL nombrar la primera fila inválida del archivo por su número de fila tal
como se ve en una hoja de cálculo (el encabezado es la fila 1 y la primera transacción la fila 2) y el motivo,
con el campo que falla (R2).

#### Scenario: La primera fila inválida es la que se nombra

- **WHEN** las transacciones 3 y 7 del archivo son inválidas
- **THEN** el mensaje nombra la fila 4 (la tercera transacción) y su motivo

### Requirement: El identificador de cada transacción es único

`id_transaccion` SHALL ser único en el archivo. Una repetición SHALL rechazar el archivo nombrando la fila
donde reaparece el identificador y el identificador repetido (R2).

#### Scenario: Identificador repetido

- **WHEN** las filas 2 y 5 traen `id_transaccion` = `TX000001`
- **THEN** se rechaza el archivo nombrando la fila 5 y `TX000001`

### Requirement: Todas las transacciones caen en un solo mes

Todas las fechas SHALL caer en el mismo mes calendario. Si no, el archivo SHALL rechazarse con un mensaje
que nombra cada mes encontrado como `AAAA-MM`, en orden cronológico (R3).

#### Scenario: Dos meses en el mismo archivo

- **WHEN** el archivo trae transacciones del 30 de septiembre y del 1 de octubre de 2026
- **THEN** se rechaza el archivo y el mensaje nombra `2026-09` y `2026-10`

#### Scenario: Febrero bisiesto completo

- **WHEN** el archivo trae transacciones del 1 al 29 de febrero de 2028
- **THEN** se acepta y su mes es febrero de 2028

### Requirement: Un archivo aceptado sale tipado y completo

Un archivo aceptado SHALL producir la tabla con las nueve columnas tipadas (`fecha` como fecha y hora;
`monto`, `latitud` y `longitud` como números; el resto como texto), todas sus filas en el orden del archivo,
el mes del reporte (su primer día) y los avisos. Los montos SHALL conservar todos sus decimales; se redondean
solo al mostrarlos (caso borde «Montos con más de 2 decimales»).

#### Scenario: Mes de 20,000 transacciones del generador

- **WHEN** se lee un CSV de septiembre de 2026 producido por el generador
- **THEN** se acepta con sus 20,000 filas, el mes es el 1 de septiembre de 2026 y no hay avisos

#### Scenario: Monto con más de dos decimales

- **WHEN** una fila trae `monto` = `10.005`
- **THEN** se acepta y su monto en la tabla es `10.005`

### Requirement: Las coordenadas fuera de México se aceptan con aviso

Una transacción con `latitud` fuera de 14 a 33 o `longitud` fuera de −119 a −86 (límites incluidos como
válidos) SHALL aceptarse, y el resultado SHALL traer un único aviso en español que dice cuántas
transacciones tienen coordenadas fuera de México (caso borde de `docs/DOMINIO.md`).

#### Scenario: Dos transacciones fuera de México

- **WHEN** dos filas traen `latitud` = `40.4168` y `longitud` = `-3.7038`
- **THEN** se acepta el archivo y trae un aviso que dice que 2 transacciones tienen coordenadas fuera de México

#### Scenario: Coordenadas en el límite

- **WHEN** una fila trae `latitud` = `14` y `longitud` = `-86`
- **THEN** se acepta sin avisos

### Requirement: Un archivo que no existe se rechaza con mensaje

Una ruta que no existe o que no es un archivo SHALL rechazarse con un mensaje en español que nombra la ruta.

#### Scenario: Ruta inexistente

- **WHEN** se pide leer `no-existe.csv`
- **THEN** se rechaza con un mensaje que nombra `no-existe.csv`
