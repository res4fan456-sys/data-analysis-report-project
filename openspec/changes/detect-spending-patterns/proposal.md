# Proposal

## Why

La Fase 2 de `docs/PLAN.md` entrega los 5 patrones del gasto y los 3 a 5 hallazgos principales del resumen, y su
suite de sistema debe confirmar, con semillas fijas, que lo detectado coincide con lo que el generador inyectó.
Hoy el núcleo solo calcula el resumen (`Analisis` trae `mes`, `ultimo_dia`, `resumen` y `avisos`) y el generador
solo deja ver su perfil impreso con `-v`. Este change da al núcleo los patrones R6–R10 con la honestidad de R14
y los hallazgos de R4, y al generador una forma de entregar su perfil como dato.

## What Changes

- El núcleo calcula, para cada mes, los cinco patrones de `docs/DOMINIO.md`: categoría dominante (R6), zona
  favorita (R7), viaje (R8), quincena (R9) y fin de semana con su entretenimiento nocturno (R10).
- Cada patrón dice si aparece, si no aparece (con su cifra) o si no hay datos suficientes para calcularlo
  (R14 y el caso borde «Una sola transacción»), con umbrales fijos y escritos en la spec.
- Cada patrón trae también los datos que su gráfica necesita, ya calculados (la presentación no calcula).
- El análisis trae entre 3 y 5 hallazgos ordenados por relevancia (R4), cada uno con su cifra.
- El generador expone su perfil inyectado como dato, sin cambiar un byte del CSV ni de la salida de `-v`.
- La suite de sistema genera un mes por cada categoría dominante posible con semillas fijas y comprueba que lo
  detectado coincide con el perfil inyectado.
- Absorbe el pendiente de la Fase 0 «API del perfil inyectado» (`docs/ARQUITECTURA.md`, capa `generador`).
- No entra: el desglose (R11–R12) y el mapa (R13), que son de las fases 3 y 4; ni la página (el change
  `chart-pattern-sections` de esta misma ola la dibuja).

## Capabilities

### New Capabilities

- `patrones-de-gasto`: los cinco patrones del mes (R6–R10), su estado según R14 y los datos de su gráfica.

### Modified Capabilities

- `resumen-del-mes`: se añaden los hallazgos principales del mes (R4, segunda viñeta) y su orden de relevancia.
- `generador-sintetico`: se añade la entrega del perfil inyectado como dato.

## Impact

- `src/reporte/nucleo/` (área `nucleo`): módulos nuevos de patrones y hallazgos; `Analisis` gana los campos
  `patrones` y `hallazgos`, que `docs/ARQUITECTURA.md` (Contratos) ya declara. Cambio aditivo: ningún campo
  existente cambia.
- `tests/nucleo/` (área `nucleo`): una prueba o más por regla y por caso borde, con tablas hechas a mano.
- `tests/presentacion/_pagina_de_prueba.py` (área `presentacion`, fuera de la del grupo): construye `Analisis` a
  mano en dos sitios y deja de compilar con los campos nuevos; los grupos 1 y 2 le añaden `patrones` y
  `hallazgos` sin cambiar nada más.
- `generador/generar_transacciones.py` (área `generador`): una función pública que devuelve filas y perfil; `main`
  pasa a usarla. Guarda independiente: `tests/sistema/test_generador.py` fija el SHA-256 del CSV y de la salida
  de `-v` y no se toca.
- `tests/sistema/` (área `generador`): prueba nueva de patrones detectados contra el perfil inyectado.
- Consumidor: el change `chart-pattern-sections` lee `Analisis.patrones` y `Analisis.hallazgos` con los nombres
  que fija el design de este change.
- Sin dependencias nuevas.
