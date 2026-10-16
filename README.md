# Reporte de gasto mensual

Toma el CSV de transacciones de un mes y genera una única página HTML local, sin red y en
español de México, con el análisis de gasto. Este repositorio incluye también un generador
sintético que usa [Faker](https://faker.readthedocs.io/) para producir el CSV de prueba: los
gastos de **una persona durante un mes** (20,000 transacciones por defecto). Cada ejecución
produce datos nuevos, pero siempre con patrones de gasto detectables, para alimentar el reporte.

## Instalación

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
```

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
