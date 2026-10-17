# Reporte de gasto mensual

El reporte toma el CSV de transacciones de un mes y genera una única página HTML local, sin red y
en español de México, con el análisis de gasto. El repositorio incluye además un generador sintético,
que usa [Faker](https://faker.readthedocs.io/) para producir el CSV de prueba: los gastos de **una
persona durante un mes** (20,000 transacciones por defecto). Cada ejecución produce datos nuevos,
pero siempre con patrones de gasto detectables, para alimentar el reporte.

## Instalación

Requiere Python 3.14 o superior.

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

## Uso del reporte

Desde la raíz del repositorio, con el entorno activado. Para tener un CSV con el que probar, genera
uno de septiembre de 2026 (ver [Uso del generador](#uso-del-generador)) y pásalo al reporte:

```bash
python -m generador --mes 2026-09 --semilla 42
python -m reporte output/transacciones_2026-09.csv
```

Escribe `reporte_AAAA-MM.html` junto al CSV (aquí, `output/reporte_2026-09.html`), con el mes
tomado de las transacciones y no del nombre del archivo, e imprime la ruta escrita; una página
anterior del mismo mes se reemplaza. Con `-o` (o `--salida`) eliges dónde queda, y las carpetas
que falten se crean:

```bash
python -m reporte output/transacciones_2026-09.csv -o informes/septiembre.html
```

Códigos de salida:

| Código | Cuándo |
|---|---|
| `0` | La página se escribió |
| `1` | El CSV se rechazó (el mensaje en español dice qué corregir) o la página no se pudo escribir; en ambos casos el mensaje sale por la salida de error, sin traza de Python, y un CSV rechazado no deja página |
| `2` | Uso incorrecto: falta el CSV o se pasó una opción desconocida |

## Uso del generador

Desde la raíz del repositorio, con el entorno activado:

```bash
python -m generador
```

Genera `output/transacciones_AAAA-MM.csv` sin imprimir nada, para no revelar los patrones.
Con `-v` imprime el resumen con los patrones inyectados (la "respuesta").

| Opción | Default | Descripción |
|---|---|---|
| `-n`, `--registros` | `20000` | Número de transacciones |
| `--mes` | mes anterior | Mes a simular (`AAAA-MM`) |
| `--semilla` | aleatoria | Reproduce exactamente un set anterior |
| `--categoria-dominante` | aleatoria | `Comida`, `Transporte`, `Entretenimiento` o `Compras` |
| `-o`, `--salida` | `output/transacciones_AAAA-MM.csv` | Ruta del CSV |
| `-v`, `--verbose` | apagado | Imprime el resumen con los patrones inyectados |

Ejemplo: `python -m generador --mes 2026-09 --categoria-dominante Comida --semilla 42`

Para revisar la respuesta después: genera con `--semilla N` y luego corre el mismo comando
con `-v` agregado; la misma semilla produce exactamente el mismo CSV.

## Columnas del CSV

| Columna | Ejemplo | Notas |
|---|---|---|
| `id_transaccion` | `TX000123` | Consecutivo, ordenado por fecha |
| `fecha` | `2026-09-15 14:32:07` | `AAAA-MM-DD HH:MM:SS` |
| `monto` | `342.50` | MXN, siempre positivo (son gastos) |
| `concepto` | `Taquería Cervantes` | Comercio o cargo |
| `categoria` | `Comida` | Comida, Transporte, Supermercado, Entretenimiento, Compras, Salud, Servicios, Suscripciones, Vivienda, Viajes |
| `cuenta` | `Tarjeta de Crédito ****8072` | Máximo 3 cuentas |
| `zona` | `Roma Norte, CDMX` | 6 zonas de CDMX + 1 destino de viaje |
| `latitud`, `longitud` | `19.419400`, `-99.161700` | Dentro de México |

## Patrones que el reporte debería encontrar

Se eligen al azar en cada ejecución y solo se imprimen con `-v`:

1. **Categoría dominante**: una categoría concentra entre ~40 % y ~65 % del gasto.
2. **Zona favorita**: una zona de CDMX concentra la mayor parte del gasto en comida y entretenimiento.
3. **Quincena**: picos de gasto los días 15 y último del mes (y el día siguiente); bajón los 3 días previos.
4. **Fin de semana**: más gasto viernes a domingo, sobre todo entretenimiento nocturno.
5. **Viaje**: un fin de semana en otra ciudad (Guadalajara, Cancún, Oaxaca, etc.) con gasto elevado.

Además: horarios realistas por categoría (comida al mediodía, transporte en hora pico), comercios
favoritos que se repiten, cargos fijos (renta, luz, suscripciones) y ~0.3 % de compras atípicas.

## Personalizar

Zonas, comercios, rangos de montos, horarios y la intensidad de cada patrón están en
[`generador/configuracion.py`](generador/configuracion.py). La lógica está en
[`generador/generar_transacciones.py`](generador/generar_transacciones.py).
