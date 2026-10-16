# Arquitectura

El flujo va en una sola dirección:

```
CSV ─► datos (leer + validar) ─► nucleo (analizar) ─► presentacion (renderizar) ─► un archivo HTML
                                      ▲
                                 app (CLI) orquesta
```

## Capas

| Capa | Responsabilidad | Ruta | Puede importar de |
|---|---|---|---|
| `nucleo` | Análisis puro: una tabla validada produce un `Analisis` (dataclasses congeladas `Resumen`, `Patrones`, `Desglose`, `PuntosMapa` y una lista de `Hallazgo`). Sin I/O, sin fechas del sistema, sin aleatoriedad. | `src/reporte/nucleo/` | stdlib, pandas |
| `datos` | Leer el CSV, validar las reglas R1–R3 y tipar las columnas. Los errores son `ErrorDeEntrada` con mensaje en español. | `src/reporte/datos/` | stdlib, pandas, `nucleo` (solo tipos) |
| `presentacion` | Convertir un `Analisis` en un único HTML: opciones de gráficas ECharts (dicts), plantilla Jinja2, activos incrustados (ECharts, fuente, GeoJSON) y formateadores es-MX. | `src/reporte/presentacion/` (con `activos/` y `plantillas/`) | stdlib, Jinja2, `nucleo` |
| `app` | CLI `python -m reporte CSV [-o salida] [--abrir]`. Encadena datos → nucleo → presentacion, escribe el archivo y traduce `ErrorDeEntrada` a un mensaje y un código de salida. | `src/reporte/__main__.py`, `src/reporte/app.py` | todas las anteriores |
| `generador` | El generador de transacciones sintéticas existente, movido sin cambiar su comportamiento. Expone su perfil inyectado para la suite de sistema. | `generador/` | stdlib, Faker. Nada de `src/` lo importa |

Cada capa es un área de implementación con rutas disjuntas. Sus tests viven en la carpeta homónima bajo `tests/` (`tests/nucleo/`, `tests/datos/`…).

## Contratos

```python
# datos
class ErrorDeEntrada(Exception): ...          # mensaje en español, con fila/columna cuando aplica

@dataclass(frozen=True)
class Transacciones:
    tabla: pd.DataFrame                        # 9 columnas tipadas; fecha=datetime64, monto/lat/lon=float
    mes: date                                  # primer día del mes del reporte
    avisos: tuple[str, ...]                    # p. ej. coordenadas fuera de México

def leer_transacciones(ruta: Path) -> Transacciones: ...

# nucleo
def analizar(transacciones: Transacciones) -> Analisis: ...

@dataclass(frozen=True)
class Analisis:
    mes: date
    resumen: Resumen                           # total, n, ticket promedio, día de mayor gasto
    patrones: Patrones                         # dominante, zona favorita, quincena, fin de semana, viaje | None
    desglose: Desglose                         # cuentas, categorías, top comercios, cargos fijos, atípicos
    mapa: PuntosMapa                           # puntos agregados (lat, lon, monto, zona), centro principal
    hallazgos: tuple[Hallazgo, ...]            # conclusiones en lenguaje natural, derivadas de los datos
    avisos: tuple[str, ...]

# presentacion
def renderizar(analisis: Analisis) -> str: ...   # HTML completo y autocontenido

# app
def main(argv: list[str] | None = None) -> int: ...
```

`Transacciones` se define en `nucleo/tipos.py`. Así `datos` produce el tipo que `nucleo` consume sin que `nucleo`
dependa de `datos`. Los montos viajan como `float` dentro de `nucleo`; el redondeo a centavos se hace solo al
formatear en `presentacion`.

## Pruebas

| Capa | Qué se prueba | Cómo | Dónde |
|---|---|---|---|
| `nucleo` | Reglas R4–R14 de `DOMINIO.md`, una o más pruebas por regla, y los casos borde | Tablas pequeñas hechas a mano en el test, con el resultado esperado calculado a mano | `tests/nucleo/` |
| `datos` | R1–R3: columnas, filas inválidas (con número de fila), varios meses, BOM, acentos, archivo vacío | CSV de fixture en `tests/datos/fixtures/` | `tests/datos/` |
| `presentacion` | R15–R17: formato es-MX, ninguna referencia de red (definida en R16), mensaje final como último texto visible, presencia de cada sección, opciones de gráficas válidas | Un `Analisis` construido a mano y HTML parseado con `html.parser` de stdlib | `tests/presentacion/` |
| `app` | Códigos de salida, ruta de salida por defecto, mensaje de error legible | `main([...])` con `tmp_path` | `tests/app/` |
| Sistema | El producto real de punta a punta | Marcador `sistema`. Genera con semillas fijas para las 4 categorías dominantes y corre `main`. Comprueba que lo detectado coincide con el perfil inyectado, que no hay red, que está el mensaje final y que pesa < 10 MB | `tests/sistema/` |

La revisión visual de cada fase es manual: se abre el HTML en modo avión.
