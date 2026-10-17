# Spec Delta

## Purpose

Define cómo el autor invoca el reporte desde la terminal, dónde queda la página y qué responde la
herramienta cuando el CSV se rechaza o la página no se puede escribir.

## ADDED Requirements

### Requirement: El reporte se genera con un comando sobre el CSV

`python -m reporte CSV` desde la raíz del repositorio SHALL leer el CSV, generar la página y escribirla
como `reporte_AAAA-MM.html` en la carpeta del CSV, donde `AAAA-MM` es el mes de sus transacciones; SHALL
terminar con código 0 e imprimir en español la ruta escrita.

#### Scenario: Septiembre de 2026

- **WHEN** se corre `python -m reporte output/transacciones_2026-09.csv` con un CSV válido de septiembre
- **THEN** existe `output/reporte_2026-09.html`, el código de salida es 0 y la salida nombra esa ruta

#### Scenario: El nombre sale del mes de los datos

- **WHEN** se corre sobre `datos/septiembre.csv` con transacciones de septiembre de 2026
- **THEN** la página queda en `datos/reporte_2026-09.html`

#### Scenario: Una página anterior se reemplaza

- **WHEN** ya existe `output/reporte_2026-09.html` y se vuelve a correr el comando
- **THEN** el archivo se reemplaza por la página nueva

### Requirement: La salida se puede elegir

Con `-o SALIDA` (o `--salida SALIDA`) la página SHALL escribirse en `SALIDA`, creando las carpetas que falten.

#### Scenario: Ruta elegida

- **WHEN** se corre `python -m reporte transacciones.csv -o informes/sept.html` y `informes/` no existe
- **THEN** la página queda en `informes/sept.html`

### Requirement: Un CSV rechazado da un mensaje en español y código 1

Si el CSV se rechaza, el comando SHALL imprimir en la salida de error el mensaje del rechazo, en español y
sin traza de Python, terminar con código 1 y no escribir ninguna página.

#### Scenario: Columna de más

- **WHEN** se corre sobre un CSV con una columna `notas` de más
- **THEN** la salida de error nombra `notas`, no muestra `Traceback`, el código es 1 y no se escribe página

#### Scenario: Archivo inexistente

- **WHEN** se corre sobre `no-existe.csv`
- **THEN** la salida de error nombra `no-existe.csv` y el código es 1

### Requirement: Una página que no se puede escribir da un mensaje en español y código 1

Si la página no se puede escribir (la salida es una carpeta o no hay permiso), el comando SHALL imprimir en
la salida de error un mensaje en español que nombra la ruta, sin traza de Python, y terminar con código 1.

#### Scenario: La salida es una carpeta

- **WHEN** se corre con `-o` apuntando a una carpeta existente
- **THEN** la salida de error nombra esa ruta y el código es 1

### Requirement: Un uso incorrecto muestra la ayuda

Sin el argumento CSV, o con una opción desconocida, el comando SHALL mostrar el uso y terminar con código 2.

#### Scenario: Sin argumentos

- **WHEN** se corre `python -m reporte` sin argumentos
- **THEN** la salida de error muestra el uso y el código es 2
