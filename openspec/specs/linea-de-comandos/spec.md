# linea-de-comandos Specification

## Purpose

Define cómo el autor invoca el reporte desde la terminal, dónde queda la página y qué responde la
herramienta cuando el CSV se rechaza o la página no se puede escribir.

## Requirements

### Requirement: La salida no pisa el CSV de entrada

Si la ruta de salida resuelve al mismo archivo que el CSV, el comando SHALL imprimir en la salida de error un
mensaje en español que nombra la ruta, sin traza de Python, terminar con código 1 y dejar el CSV sin tocar.

#### Scenario: `-o` igual al CSV

- **WHEN** se corre `python -m reporte datos.csv -o datos.csv` con un CSV válido
- **THEN** la salida de error nombra `datos.csv`, el código es 1 y el contenido de `datos.csv` no cambia

#### Scenario: La misma ruta escrita de otra forma

- **WHEN** se corre `python -m reporte datos/septiembre.csv -o datos/../datos/septiembre.csv`
- **THEN** el código es 1 y el CSV no cambia

### Requirement: Una escritura fallida no deja la página a medias

Al escribir la página, el destino SHALL quedar con la página nueva completa o, si la escritura falla, con el
contenido que tenía antes; un fallo SHALL dar el mensaje en español y el código 1 de una página que no se
puede escribir, sin dejar archivos temporales junto al destino.

#### Scenario: La escritura falla a mitad

- **WHEN** ya existe `output/reporte_2026-09.html` y la escritura de la página nueva falla antes de terminar
- **THEN** `output/reporte_2026-09.html` conserva la página anterior, el código es 1 y no queda ningún temporal en `output/`
