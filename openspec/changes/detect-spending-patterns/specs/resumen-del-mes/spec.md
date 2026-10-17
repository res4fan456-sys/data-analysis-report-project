# Spec Delta

## ADDED Requirements

### Requirement: El análisis trae entre 3 y 5 hallazgos principales

El análisis SHALL traer entre 3 y 5 hallazgos, cada uno con su tipo y la cifra que lo respalda (R4, R14). Son
candidatos los patrones que aparecen, uno por patrón y uno por cada viaje. Si hay menos de 3, se completan, en
este orden, con el día de mayor gasto, la proporción del gasto variable y el ticket promedio. Un patrón que no
aparece o no tiene datos nunca SHALL ser hallazgo.

#### Scenario: Una sola transacción

- **WHEN** se analiza un mes con una sola transacción de `Comida`, un martes normal
- **THEN** hay 3 hallazgos: la categoría dominante, la zona favorita y el día de mayor gasto, en ese orden

#### Scenario: Ningún patrón aparece

- **WHEN** el mes solo tiene cargos de `Vivienda` y `Servicios`, de lunes a jueves y en días normales, en una
  sola zona
- **THEN** hay 3 hallazgos: el día de mayor gasto, la proporción del gasto variable y el ticket promedio, en
  ese orden

#### Scenario: Seis candidatos

- **WHEN** aparecen los cinco patrones y hay dos viajes
- **THEN** hay 5 hallazgos, los cinco de mayor relevancia

#### Scenario: La quincena no aparece

- **WHEN** el factor del día de pago es 1.05
- **THEN** ningún hallazgo es de quincena

### Requirement: Los hallazgos se ordenan por el dinero que explican

La relevancia de un hallazgo de patrón SHALL ser la proporción del gasto total que explica: la categoría
dominante, su gasto; la zona favorita, su gasto en `Comida` + `Entretenimiento`; un viaje, su gasto; la quincena,
lo que sus días de pago gastan por encima de días normales; el fin de semana, lo que sus días gastan por encima
de lunes a jueves. Los hallazgos de patrón SHALL ir de mayor a menor relevancia, antes que los de relleno.

#### Scenario: El viaje pesa más que la quincena

- **WHEN** en un mes de 10,000 la categoría dominante gasta 4,000, el viaje 1,500 y los días de pago gastan
  600 por encima de lo normal
- **THEN** los hallazgos van en el orden categoría dominante (0.40), viaje (0.15) y quincena (0.06)

#### Scenario: Empate de relevancia

- **WHEN** dos hallazgos de patrón tienen la misma relevancia
- **THEN** van en el orden categoría dominante, zona favorita, quincena, fin de semana y viaje
