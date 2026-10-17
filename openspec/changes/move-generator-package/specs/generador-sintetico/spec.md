# Spec Delta

## Purpose

El generador sintético produce el CSV de un mes de gasto con patrones inyectados para alimentar y probar el
reporte; esta capacidad fija cómo se invoca, que es reproducible por semilla y que el reporte no depende de él.

## ADDED Requirements

### Requirement: El generador se invoca como paquete desde la raíz

El generador MUST invocarse con `python -m generador` desde la raíz del repositorio, con las opciones
`-n/--registros`, `--mes`, `--semilla`, `--categoria-dominante`, `-o/--salida` y `-v/--verbose`, con los mismos
valores por defecto que antes del movimiento, y MUST escribir un CSV con las 9 columnas
`id_transaccion, fecha, monto, concepto, categoria, cuenta, zona, latitud, longitud`.

#### Scenario: Generar un mes con semilla fija

- **WHEN** se ejecuta `python -m generador -n 2000 --mes 2026-09 --semilla 42 --categoria-dominante Comida -o <ruta>`
- **THEN** el proceso termina con código 0 y `<ruta>` contiene un encabezado con las 9 columnas y 2000 filas de datos

#### Scenario: Sin `-v` no se revelan los patrones

- **WHEN** se ejecuta `python -m generador -n 1500 --mes 2028-02 --semilla 2026 -o <ruta>`, sin `-v`
- **THEN** la salida estándar queda vacía

### Requirement: La misma semilla reproduce exactamente el mismo mes

Con la misma semilla y las mismas opciones, el generador MUST producir un CSV idéntico byte a byte y, con `-v`,
el mismo resumen de patrones inyectados (salvo la primera línea, que nombra la ruta de salida). El resultado
MUST coincidir con el del generador anterior al movimiento.

#### Scenario: Septiembre de 2026 con categoría dominante fija

- **WHEN** se ejecuta con `-n 2000 --mes 2026-09 --semilla 42 --categoria-dominante Comida -v`
- **THEN** el SHA-256 del CSV es `f8dc956e3793c30b93e29331f13f2fd8e68337ecb4e499d36a1cc594d0938390`
- **AND** el SHA-256 de la salida estándar sin su primera línea es `ba0b1f02b07bd20069357506f8240e9e790eb96557f343c5c85b070e6e8d1a21`

#### Scenario: Febrero bisiesto con categoría dominante aleatoria

- **WHEN** se ejecuta con `-n 1500 --mes 2028-02 --semilla 2026`, sin `-v`
- **THEN** el SHA-256 del CSV es `82db2f1552bd7f497f27f494ecc7faa50c34e269b972906ccfc3efc61d546cea`
- **AND** su última fila de datos tiene fecha del 29 de febrero de 2028

### Requirement: El reporte no depende del generador

Ningún módulo bajo `src/reporte` MUST importar `generador` ni `faker`, y una prueba automática MUST fallar si
alguno lo hace.

#### Scenario: Un módulo del reporte importa Faker

- **WHEN** un archivo bajo `src/reporte` contiene `import faker` o `from generador import ...`
- **THEN** la prueba de arquitectura falla nombrando el archivo y el módulo importado
