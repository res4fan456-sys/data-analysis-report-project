# Tasks

Ola `0-scaffolding`, única ola de la Fase 0: este change es toda la ola, en **2 PRs internas en serie**
(grupo 1 → grupo 2). El grupo 2 no empieza hasta que el grupo 1 esté mergeado en la rama de ola: la guarda
tiene que existir, en verde, antes del movimiento, y la escribe otro implementador.

Regla de la fase: **cero cambio en lo que produce el generador.** Los parámetros y los cuatro valores
esperados de la guarda (spec `generador-sintetico`, requisito «La misma semilla reproduce exactamente el mismo
mes») no se editan en ningún grupo; si la guarda falla tras el movimiento, se arregla el movimiento.

## 1. Guarda de reproducibilidad del generador (PR 1, área `generador`, ~70 líneas)

- [x] 1.1 Crear `tests/sistema/test_generador.py` con marcador `sistema` que ejecuta el generador actual de la
  raíz (`[sys.executable, "generar_transacciones.py", ...]`, `cwd` en la raíz del repositorio, salida en
  `tmp_path`) en los dos escenarios de la spec: septiembre de 2026 con `-v` (SHA-256 del CSV y de la salida
  estándar sin su primera línea, calculado sobre bytes) y febrero de 2028 sin `-v` (SHA-256 del CSV, salida
  estándar vacía, última fila del 29 de febrero), más el escenario «Generar un mes con semilla fija» (código
  0, encabezado de 9 columnas, 2000 filas de datos). **Flujo que protege:** generar un mes con semilla fija da
  siempre el mismo CSV y el mismo perfil inyectado, que es lo que la suite de sistema de las fases 1 a 4 usará
  como respuesta esperada. Se verifica con la suite `sistema` en verde y con la mutación de cambiar un
  parámetro de una corrida (falla el SHA).

## 2. Mover el generador al paquete `generador/` (PR 2, área `generador` más dos archivos sin área, ~120 líneas)

- [x] 2.1 Mover `generar_transacciones.py` y `configuracion.py` a `generador/` conservando sus nombres, crear
  `generador/__init__.py` y `generador/__main__.py` (llama a `main()`), y cambiar el import a
  `from generador import configuracion as cfg`; ningún otro cambio de lógica. Se verifica con la guarda del
  grupo 1 en verde tras 2.2.
- [x] 2.2 En `tests/sistema/test_generador.py` cambiar **solo** el comando que invoca al generador a
  `[sys.executable, "-m", "generador", ...]`; parámetros y valores esperados intactos. **Flujo que protege:**
  el mismo de 1.1, ahora por la invocación de la spec «El generador se invoca como paquete desde la raíz». Se
  verifica con la suite `sistema` en verde.
- [x] 2.3 Añadir a `tests/test_pureza.py` un test que falla si algún módulo bajo `src/reporte` importa
  `generador` o `faker`, nombrando archivo y módulo (regla innegociable 5). **Flujo que protege:** que el
  reporte siga corriendo sin el generador ni Faker instalados. Se verifica con el test en verde y con la
  mutación de añadir `import faker` a `src/reporte/__init__.py` (falla).
- [x] 2.4 Actualizar `README.md`: describe este proyecto (no «otro proyecto»), instala con
  `pip install -e ".[dev]"` (`docs/STACK.md`), invoca el generador con `python -m generador` en el uso y en el
  ejemplo, y enlaza `generador/configuracion.py` y `generador/generar_transacciones.py`. No documenta
  `python -m reporte`, que llega con la Fase 1. Se verifica con `.claude/da/da citas` limpio y con cada comando
  del generador que muestra el README corriendo tal como está escrito (el de instalación no se ejecuta: lo
  corre el usuario).
