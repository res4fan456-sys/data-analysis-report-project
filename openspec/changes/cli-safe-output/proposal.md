## Why

Un `-o` igual al CSV pisa los datos del mes (#24), y una escritura cortada a la mitad deja la página truncada y sin la anterior (#23); `requirements.txt` quedó sin uso (#7).

## What Changes

- La CLI rechaza con código 1 y un mensaje en español que nombra la ruta una salida que resuelva al mismo archivo que el CSV, sin tocarlo.
- La página se escribe en un temporal de la misma carpeta y reemplaza al destino de un solo paso: queda la anterior intacta o la nueva completa.
- Se retira `requirements.txt`; las dependencias viven en `pyproject.toml` y `requirements-dev.txt`.

## Capabilities

### New Capabilities

### Modified Capabilities
- `linea-de-comandos`: dos requisitos nuevos (la salida no pisa el CSV; la escritura no deja la página a medias).

## Impact

`src/reporte/app.py`, `tests/app/test_app_cli.py`, `requirements.txt`.
