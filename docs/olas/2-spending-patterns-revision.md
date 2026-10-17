# Pre-vuelo — Ola 2-spending-patterns «Los 5 patrones»

Fecha: 2026-10-17. Código leído en `ola/1-monthly-summary` @ 09f4fe7 (el mismo que llegará a `master` con la
integración de la pila); definiciones de `docs/` tomadas de `master` @ 01a8e9b (R16 por posición, R4 y R14 en
la Fase 2, ECharts al empezar la Fase 2). [V] = verificado en el código o con datos; [I] = inferido.

## 1. Veredicto

- `detect-spending-patterns`: lista para un PM.
- `chart-pattern-sections`: lista para un PM.
- **Ola: lista para delegar**, con dos condiciones de arranque que no son decisiones: el usuario baja ECharts y
  reporta sus SHA-256 (§8), y la PR de planeación se rebasa sobre `master` cuando la integración y el archivado
  terminen (las deltas `MODIFIED` necesitan las specs principales).
- Lo más importante: medí con el generador real que los patrones inyectados se detectan con las reglas tal como
  están escritas (11 corridas); el fin de semana no es parte del perfil y la suite de sistema no lo afirma.

## 2. La ola

- **Ola 2-spending-patterns — `detect-spending-patterns` + `chart-pattern-sections`** (5 PRs internas)
  - **Entregable**
    - `python -m reporte output/transacciones_2026-09.csv` produce una página con los hallazgos principales en el
      resumen y cinco secciones («Categoría dominante», «Zona favorita», «Quincena», «Fin de semana», «Viaje»),
      cada una con su gráfica ECharts incrustada y su hallazgo, sin red.
    - Una prueba de sistema que, con semilla 42 y las cuatro categorías dominantes, compara lo detectado con el
      perfil inyectado.
  - **Componentes que se modifican**
    - `src/reporte/nucleo/` (gana patrones y hallazgos; `Analisis` gana `patrones` y `hallazgos`, aditivo)
    - `src/reporte/presentacion/` (secciones, gráficas, factor, tema de serie, detector de red, `activos/` con ECharts)
    - `generador/generar_transacciones.py` (función pública `generar_mes`; `main` la usa, CSV idéntico)
    - `tests/nucleo/`, `tests/presentacion/`, `tests/sistema/`
    - No se toca: `src/reporte/datos/`, `src/reporte/app.py`, el resumen de la Fase 1, `tests/sistema/test_generador.py`
      (es la guarda del refactor del generador).
  - **Grafo:** P1 → (P2 ∥ C1) → C2 → P3 (P = `detect-spending-patterns`, C = `chart-pattern-sections`).

## 3. Hallazgos

### BLOQUEA EL ARRANQUE

- Ninguno abierto. Los dos que había se resolvieron en los artefactos:
  - **B1 — Faltaban los changes.** `openspec/changes/` no tenía nada de la Fase 2. Propuestos los dos por
    `openspec-propose`; validan con `--strict` [V].
  - **B2 — Umbrales y relevancia sin definir.** R14 solo fija umbral para la dominante (> 30 %) y la quincena
    (< 1.1 no es patrón) (`docs/DOMINIO.md:87`); R4 pide orden «por relevancia» sin definirla
    (`docs/DOMINIO.md:41`); R8 dice «mencionan la ciudad» sin definir la ciudad (`docs/DOMINIO.md:52`). Sin eso,
    ninguna tarea tiene un resultado esperado calculable a mano. Escribí en las specs la opción recomendada de
    cada una (D1, D2) para que la ola no quede con decisiones abiertas; el usuario las confirma o revierte.

### CORREGIR ANTES DE ENCARGAR (ya corregido)

- **C1 — El fin de semana no es parte del perfil inyectado.** [V] `Perfil` (`generador/generar_transacciones.py:52-64`)
  no lo trae; el generador lo aplica siempre, pero baja `Transporte` ×0.7 en fin de semana
  (`generador/configuracion.py:197`). Medido: con `Transporte` dominante y semilla 42, el factor es ×1.09, bajo
  1.1. La spec de sistema afirma dominante, zona favorita, viaje y quincena, no el fin de semana ni la cuesta
  (×1.13 con `Comida` y semilla 42).
- **C2 — La presentación no puede calcular los datos de las gráficas** (regla innegociable 2). La spec de
  `patrones-de-gasto` obliga a cada patrón a traer su reparto o su serie diaria.
- **C3 — El texto de los hallazgos no puede vivir en el núcleo.** `docs/ARQUITECTURA.md:47` dice
  «conclusiones en lenguaje natural» en `Analisis.hallazgos`, pero la regla innegociable 4 manda todo texto
  visible por los formateadores de `presentacion`. Design: el núcleo da tipo, cifra y relevancia; la
  presentación arma la frase. La línea de `ARQUITECTURA.md` sigue siendo cierta leída así; no propongo cambiarla.
- **C4 — Grupo de presentación demasiado grande.** Con las cinco secciones en un grupo, C2 rondaba 900 líneas.
  La primera sección (categoría dominante) pasa a C1 como prueba de punta a punta de la mecánica de gráficas;
  C1 arranca tras P1 y corre en paralelo con P2.
- **C5 — Factor `×1.1` junto a «no aparece».** Con un decimal (R9), 1.05 se muestra `×1.1`. El escenario usa 1.04
  y el riesgo queda en el design de `chart-pattern-sections`.

- **C6 — Los campos nuevos de `Analisis` rompen las pruebas de presentación.** [V]
  `tests/presentacion/_pagina_de_prueba.py:25` y `:34` construyen `Analisis` con solo `mes`, `ultimo_dia`,
  `resumen` y `avisos`; con `patrones` y `hallazgos` obligatorios, P1 y P2 dejarían en rojo `tests/presentacion/`.
  Declarado en el Impact y en las tareas 1.1 y 2.3 de `detect-spending-patterns`: ese archivo se le asigna al
  implementador de `nucleo`, solo para añadir los dos campos.

### DEUDA

- **E1 — `.claude/da/da citas` revisará `echarts.min.js`.** [V] `.claude/da/lib/comandos/citas.mjs:58` toma todo
  archivo con léxico bajo un área, y `.js` tiene léxico (`.claude/da/lib/citas/detector.mjs:14`); el lexer toma
  `//` dentro de cadenas como comentario. [I] Puede dar falsos hallazgos sobre el minificado. Va como paso 5 de la
  verificación de ECharts; si falla, se escala al Team Manager (configuración del kit).
- **E2 — #18 tiene dos mitades.** La ola absorbe los puntos ciegos de JavaScript minificado y el tiempo cuadrático;
  las cinco posiciones fuera de R16 van a la issue nueva #28 (D3).
- **E3 — `docs/DOMINIO.md` no dice lo que las specs fijan** (umbrales extendidos, ciudad, relevancia, promedio
  sobre días del calendario). D4.

## 4. Tope de PRs y partición

- `detect-spending-patterns`: 3 grupos (P1 ≈ 550 líneas, P2 ≈ 550, P3 ≈ 250) [I, estimado por regla y escenario].
- `chart-pattern-sections`: 2 grupos (C1 ≈ 560 sin contar `echarts.min.js`, C2 ≈ 650).
- Total 5: cabe en una ola. Lo dicen los dos `tasks.md`. `docs/PLAN.md` ya llama «Fase 2» a una sola ola; no hay
  que cambiarlo.

## 5. Lo que la ola absorbe

- #18, mitad dentro de R16 → C1 (tarea 1.3). Línea `Closes #18` en la PR de cierre.
- La API del perfil inyectado, pospuesta en la Fase 0 (`docs/olas/0-scaffolding-revision.md`, D4) → P3 (tarea 3.1).
- La verificación de ECharts (`docs/STACK.md`, Decisión) → antes de C1, en el arranque del PM.
- No absorbe: #19, #23, #24, #25, #12, #7 (ninguno toca el entregable de la Fase 2).

## 6. Lo que está bien

- `Analisis` ya prevé crecer (`src/reporte/nucleo/analisis.py:30`) y `docs/ARQUITECTURA.md` ya declara
  `patrones` y `hallazgos`.
- La guarda de capas (`tests/test_arquitectura.py`) y la de licencias (`tests/presentacion/test_presentacion_licencias.py`)
  ya cubren lo que esta ola añade, sin tocarlas.
- La spec `pagina-del-reporte` ya trae la definición posicional de R16 de `master` (#13).
- Patrones medidos (septiembre de 2026, 20,000 registros, semillas 7, 42 y 2026 por categoría; 11 corridas):
  dominante detectada = inyectada siempre (42.8 %–62.3 %); zona favorita = inyectada siempre (41.4 %–91.2 %);
  viaje con destino y fechas del perfil siempre; factor de pago ×2.03–×2.78 [V].

## 7. Decisiones

1. **D1 — Umbrales de R14 para zona favorita y fin de semana.** *Del usuario.*
   - A) Por analogía: zona favorita si concentra al menos 30 % del gasto en Comida + Entretenimiento de las zonas
     cercanas; fin de semana si su factor es al menos ×1.1. Ya escrito en la spec.
   - B) Sin umbral: siempre «aparecen».
   - C) Otros valores.
   - Recomiendo **A**: es la misma vara que R14 ya usa, y lo medido separa bien (la favorita inyectada nunca baja
     de 41 %).
2. **D2 — Qué es «relevancia» en los hallazgos (R4).** *Del usuario.*
   - A) La parte del gasto del mes que explica el hallazgo (la dominante, su gasto; un viaje, su gasto; la
     quincena, lo que sus días de pago gastan de más). Si hay menos de 3, se completa con día de mayor gasto,
     gasto variable y ticket promedio. Ya escrito en la spec.
   - B) Un orden fijo por tipo.
   - Recomiendo **A**: es «por relevancia» de verdad y todo se mide en pesos del mismo mes.
3. **D3 — Las cinco posiciones de carga que R16 no nombra (#28).** *Del usuario.*
   - A) No ampliar R16 en esta ola; #28 queda para la Fase 4 (el mapa).
   - B) Ampliar R16 ahora: PR aparte de `docs/DOMINIO.md` para el usuario y una tarea más en C1.
   - Recomiendo **A**: la página no produce ninguna de esas posiciones y ampliar la regla no protege el entregable
     de esta fase.
4. **D4 — Llevar a `docs/DOMINIO.md` lo que las specs fijan.** *Del usuario.*
   - A) PR aparte de documentación a `master`, tras la integración, con D1–D2 ya confirmadas; la mergea el usuario.
   - B) Dejarlo solo en las specs hasta el cierre de la ola.
   - Recomiendo **A**: `docs/DOMINIO.md` es la fuente de verdad que lee cada rol; puedo prepararla en cuanto me lo
     digas.
5. **D5 — Técnicas, ya tomadas en los designs; las confirma el Team Manager.**
   - El texto de los hallazgos lo arma la presentación (C3).
   - La suite de sistema no afirma el fin de semana ni la cuesta (C1).
   - Gráficas en SVG, sin descripción emergente, con etiquetas ya formateadas; opciones en un `script` JSON
     escapado.
   - El grafo P1 → (P2 ∥ C1) → C2 → P3 (C4).

## 8. Lo que solo el usuario puede dar

- El paquete de ECharts 6.0.0 bajado fuera del repositorio y los SHA-256 de sus tres archivos (comandos en el brief,
  §5). Si la verificación falla, el de 5.6.0.

## Issues creadas

- #28 «R16 no nombra cinco posiciones que también cargan red» (`origen:pre-vuelo`, `tipo:fallo-latente`, `area:presentacion`).

Brief: `docs/olas/2-spending-patterns-brief.md`.
