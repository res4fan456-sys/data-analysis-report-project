# resumen-del-mes Specification

## Purpose

Define las cifras del resumen ejecutivo de un mes de transacciones validadas y cómo se calculan (reglas R3,
R4 y R5 de `docs/DOMINIO.md`), sin redondear: el redondeo es solo de la presentación.

## Requirements

### Requirement: El resumen trae total, número de transacciones y ticket promedio

El resumen SHALL traer el gasto total (la suma de `monto`), el número de transacciones y el ticket promedio
(total entre número), sin redondear (R4).

#### Scenario: Tres transacciones

- **WHEN** se analiza un mes con montos 100.00, 250.50 y 49.50
- **THEN** el total es 400.00, el número es 3 y el ticket promedio es 133.333…

#### Scenario: Una sola transacción

- **WHEN** se analiza un mes con una sola transacción de 87.25
- **THEN** se produce el resumen con total 87.25, número 1 y ticket promedio 87.25

### Requirement: El resumen trae el día de mayor gasto y su monto

El resumen SHALL traer el día calendario cuya suma de montos es la mayor del mes y esa suma. Si dos o más
días empatan, SHALL elegir el más temprano (R4).

#### Scenario: Día con más gasto aunque no tenga la compra más cara

- **WHEN** el 3 de septiembre tiene compras de 300 y 300, y el 10 una sola de 500
- **THEN** el día de mayor gasto es el 3 de septiembre de 2026 con 600

#### Scenario: Empate entre dos días

- **WHEN** el 5 y el 12 de septiembre suman 400 cada uno y ningún otro día los supera
- **THEN** el día de mayor gasto es el 5 de septiembre de 2026

### Requirement: El resumen trae el gasto variable y su proporción del total

El gasto variable SHALL ser el total menos las transacciones de categoría `Vivienda`, `Servicios`,
`Suscripciones` y `Viajes`, comparando la categoría tal como viene en el CSV; el resumen SHALL traer también
su proporción del total, entre 0 y 1 (R5).

#### Scenario: Cargos fijos y viajes fuera del variable

- **WHEN** el mes trae Comida 600, Vivienda 300, Suscripciones 50 y Viajes 50
- **THEN** el gasto variable es 600 y su proporción es 0.6

#### Scenario: Categoría desconocida cuenta como variable

- **WHEN** el mes trae Comida 100 y `Mascotas` 100
- **THEN** el gasto variable es 200 y su proporción es 1.0

### Requirement: El análisis trae el mes y su último día de calendario

El análisis SHALL traer el mes del reporte (su primer día) y su último día, tomado del calendario: 28, 29, 30
o 31 (R3).

#### Scenario: Febrero bisiesto

- **WHEN** se analiza un mes de febrero de 2028
- **THEN** el último día es el 29 de febrero de 2028

#### Scenario: Febrero no bisiesto y meses de 30 y 31

- **WHEN** se analizan febrero de 2026, septiembre de 2026 y diciembre de 2026
- **THEN** sus últimos días son el 28, el 30 y el 31

### Requirement: El análisis conserva los avisos de la lectura

El análisis SHALL traer, sin cambiarlos y en el mismo orden, los avisos con que llegaron las transacciones.

#### Scenario: Aviso de coordenadas

- **WHEN** las transacciones llegan con un aviso de coordenadas fuera de México
- **THEN** el análisis trae ese mismo aviso
