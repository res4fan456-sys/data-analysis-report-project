# Stack

## Restricciones

1. **Local:** todo corre en la máquina del usuario.
2. **100 % sin red:** la página no carga nada de internet (fuentes, librerías, teselas de mapa) y funciona en modo avión.
3. **Costo $0:** nada de pago ni de suscripción.
4. **Español de México:** textos, montos en MXN (`$1,234.56`) y fechas («15 de septiembre de 2026»).
5. **Un solo archivo:** la página generada es un único HTML autocontenido.
6. **Mensaje final literal:** «Aquí queda la línea del respeto».
7. **Aspecto muy profesional y estético.**
8. **Preferencia, no restricción:** Python, como el generador existente (Python 3.14 + Faker).

## Opciones evaluadas

| Opción | Pros | Contras | Madurez | Veredicto |
|---|---|---|---|---|
| **A. Python + pandas + Jinja2 + Apache ECharts embebido** | Gráficas interactivas pulidas; mapas geo nativos desde un GeoJSON embebido, sin teselas; ~1 MB minificado; licencia Apache-2.0 | Las opciones de las gráficas son dicts estilo JS (se prueban como datos); hay que conseguir y simplificar el GeoJSON | Alta (Apache, uso masivo) | **Recomendada** |
| B. Python + pandas + Plotly con `include_plotlyjs` inline | API Python muy madura | ~4.5 MB por página; `scattergeo` baja su topojson de un CDN por defecto y los mapas de teselas requieren red. Cumplir (2) exige configuración frágil | Alta | Viable, segunda opción |
| C. Python + matplotlib → SVG en línea | Sin JS, ligero, fácil de probar | Estático, sin interacción; cuesta más cumplir (7); el mapa requiere geodatos igual | Alta | Viable, peor en (7) |
| D. Streamlit / Dash / Power BI / Tableau | Dashboards rápidos | Necesitan un servidor o una app corriendo (viola 5). Power BI y Tableau cuestan o suben los datos (violan 2 y 3) | Alta | **Descartada** |
| E. Folium / Leaflet con teselas | Mapas bonitos | Las teselas vienen de internet (viola 2) | Alta | **Descartada** para el mapa |

## Decisión

| Aspecto | Elección |
|---|---|
| Lenguaje | Python 3.14 |
| Gestor de dependencias | venv + pip con `pyproject.toml` (layout `src/`; `pip install -e ".[dev]"`) |
| Datos | pandas 2.3.x |
| Plantilla HTML | Jinja2 3.1.x |
| Gráficas y mapa | Apache ECharts 6.0.0, vendorizado en `src/reporte/presentacion/activos/` e incrustado en el HTML. Se verifica en la Fase 0; si falla, 5.6.0 |
| Tipografía | Inter (OFL) en WOFF2, incrustada en base64 |
| Geometría | Natural Earth admin-1 de México (dominio público), simplificada. Sirve para la vista nacional y el contorno de CDMX; la vista de ciudad son puntos sobre ese contorno |
| Generador de prueba | Faker 40.43.0, solo como dependencia de desarrollo (`generador/` y suite de sistema) |
| Tests | pytest (marcador `sistema` para la suite de sistema) |
| Tipos | mypy `--strict` sobre `src/` (con pandas-stubs) |
| Lint | ruff check |
| Formato | ruff format |
| Empaquetado | Ninguno; se corre desde el venv con `python -m reporte output/transacciones_AAAA-MM.csv` |

**Comandos del gate**, en orden:

| Paso | Comando |
|---|---|
| Formato | `ruff format --check .` |
| Lint | `ruff check .` |
| Tipos | `mypy` |
| Tests | `pytest -q -m "not sistema"` |

**Suite de sistema:** `pytest -q -m sistema`. Genera CSV con semillas fijas, una por cada categoría dominante posible,
construye el reporte y comprueba tres cosas:
- lo detectado coincide con el perfil inyectado por el generador;
- el HTML no tiene referencias de red y termina con el mensaje literal;
- el archivo pesa menos de 10 MB.

## Reglas innegociables de arquitectura

1. `nucleo` no hace I/O y no importa `datos`, `presentacion` ni `app`.
2. `presentacion` no lee archivos del usuario ni calcula estadísticas; solo da formato a lo que trae `Analisis`.
3. El HTML generado no contiene ni una referencia de red (`http(s)://`, `//` en `src`/`href`/`url()`, `fetch`, `import`
   remoto). Un test lo vigila.
4. Todo texto visible está en español de México y pasa por los formateadores de `presentacion`.
5. `src/` nunca importa `generador/` ni Faker.
6. Cada activo vendorizado (librería, fuente, geometría) lleva su versión exacta y su licencia en
   `src/reporte/presentacion/activos/LICENCIAS.md`.
7. La página siempre termina con el texto literal «Aquí queda la línea del respeto».

## Descartado y por qué

- **Streamlit, Dash:** necesitan un servidor corriendo; el producto es un archivo que se abre (restricción 5).
- **Power BI, Tableau:** cuestan dinero o publican los datos en la nube (restricciones 2 y 3).
- **Folium, Leaflet o cualquier mapa de teselas:** las teselas se descargan de internet (restricción 2).
- **Plotly como opción principal:** pesa cuatro veces más y su mapa geo depende de un CDN por defecto. Queda como
  plan B si ECharts no basta.
- **matplotlib estático:** cumple las restricciones técnicas, pero es más débil en interacción y estética (restricción 7).
