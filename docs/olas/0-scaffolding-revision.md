# Revisión de pre-vuelo — Ola `0-scaffolding` (Fase 0, andamiaje y mecánica)

Verificado el 2026-10-15 contra `master` 9fd8ab8 por el Planeador. Lo verificado (abierto o ejecutado) se
marca **[V]**; lo inferido, **[I]**.

## 1. Veredicto

- `move-generator-package`: **lista para un PM.**
- Ola `0-scaffolding`: **lista para delegar**, sin nada pendiente del usuario. El prerrequisito de entorno
  (hallazgo B1) quedó resuelto con la PR #4, mergeada en `master` 0e3c470; la rama de planeación está
  rebasada encima.
- Lo más importante: de la Fase 0 solo falta mover el generador a `generador/` y actualizar el README; el
  resto del entregable ya está en `master`, y el gate pasa en verde.

## 2. La ola

- **Ola `0-scaffolding` — `move-generator-package`** (2 PRs internas, en serie)
  - **Entregable**
    - `python -m generador …` desde la raíz produce el mismo CSV, byte a byte, que hoy produce
      `python generar_transacciones.py …`.
    - `generar_transacciones.py` y `configuracion.py` ya no están en la raíz; viven en `generador/`.
    - `tests/sistema/test_generador.py` (marcador `sistema`) en verde: es la guarda del movimiento y la
      prueba de sistema del flujo de la fase.
    - Un test de `tests/test_pureza.py` falla si `src/reporte` importa `generador` o `faker`.
    - `README.md` describe este proyecto, la instalación de `docs/STACK.md` y la invocación nueva.
  - **Componentes que se modifican**
    - `generador/` (se crea: los dos módulos movidos, más `__init__.py` y `__main__.py`).
    - `tests/sistema/test_generador.py` (se crea en el grupo 1; en el grupo 2 solo cambia el comando).
    - `tests/test_pureza.py` (gana un test).
    - `README.md` (se reescriben las secciones de instalación, uso y personalización).
    - No se toca: `src/`, `pyproject.toml`, `requirements.txt`, `requirements-dev.txt`, `docs/`, `output/`.
  - **Reglas de `docs/DOMINIO.md` que cierra:** ninguna. La Fase 0 no tiene reglas R (`docs/PLAN.md:60`);
    cierra la regla innegociable 5 como test y el punto 4 de TDD (prueba de sistema del flujo de la fase).

## 3. Estado real de la Fase 0 (premisas)

| Pieza del entregable (`docs/PLAN.md:60`) | Estado en 9fd8ab8 |
|---|---|
| Esqueleto `src/reporte` | Hecho: `src/reporte/__init__.py` [V]. Las subcapas (`nucleo/`, `datos/`…) llegan con la Fase 1, que es la primera que tiene código para ellas. |
| `pyproject.toml` | Hecho [V]: layout `src/`, pytest con marcador `sistema` y `--strict-markers`, mypy `--strict` sobre `src`, ruff. |
| Generador movido a `generador/`, README actualizado | **Falta** [V]: los dos archivos en la raíz; `README.md:14,29,63` los cita por su ruta de raíz y `README.md:6` habla de «otro proyecto». |
| Gate verde | Hecho [V]: `ruff format --check .` (4 archivos), `ruff check .`, `mypy` y `pytest -q -m "not sistema" tests/test_pureza.py` (1 passed; es la suite entera) pasan con checks ligeros. `verify` con candado no lo corrí: es del PM. |
| `/da-init` corrido | Hecho [V]: commit 8e2d6d4; `.claude/da/da doctor`: 41 OK, 0 FALLA, 1 aviso opcional (MCP de avisos). |

Otras premisas que sostienen las tareas:

- La generación es determinista [V]: misma semilla, mismo SHA-256 en dos corridas; el CSV es idéntico con y
  sin `-v`, porque el resumen se imprime después de escribir (`generar_transacciones.py:500-502`).
- El movimiento es alcanzable sin tocar lógica [V]: lo simulé en un directorio temporal fuera del repo (los
  dos archivos copiados a `generador/`, el import de la línea 22 cambiado a
  `from generador import configuracion as cfg`, `__main__.py` que llama a `main()`), y `python -m generador`
  dio los tres SHA-256 de la spec y la salida vacía sin `-v`. `--help` pasa a decir `usage: python -m generador`.
- Nadie más importa ni cita los archivos movidos [V]: `grep` en `*.py`, `*.md`, `*.toml`, `*.json`, `*.yml`
  fuera de `.venv/` y `graft/` solo encuentra `README.md`.
- `.claude/da/da citas` está limpio hoy [V] (16 avisos de rutas futuras del perfil, ninguno del generador).
- Cada corrida del generador cuesta ~23 s, casi todo de arranque [V]: la guarda vive en `sistema`, no en el gate.

## 4. Hallazgos

### BLOQUEA EL ARRANQUE

- **B1 — El gancho `preparar` del perfil no puede preparar ningún worktree.**
  - Qué pasa: `"preparar"` usa `--find-links .cache/pip` relativo
    (`.claude/desarrollo-autonomo.json:60`) y la mecánica lo corre con `cwd` en el worktree. En el worktree,
    `.cache/pip` solo trae `LEEME.md`, porque las ruedas están en `.gitignore` (`.gitignore:15-16`). Al
    montar mi worktree de planeación, pip falló con `No matching distribution found for setuptools>=68` [V].
  - Por qué importa: el PM no puede montar el worktree del primer implementador, ni el de ningún otro.
  - Recomendación: cambiar en ese gancho `--find-links .cache/pip` por `--find-links {wt}/../../../.cache/pip`
    (los worktrees viven en `.claude/worktrees/<nombre>`; comprobé que esa ruta resuelve a las 24 ruedas [V]).
    Es configuración de la mecánica: la aplica o la autoriza el usuario, fuera de la PR de planeación
    (decisión D1).
  - Estado: **resuelto.** El usuario eligió D1 = A y mergeó la PR #4 (`master` 0e3c470). Comprobé el gancho
    corregido montando un worktree de prueba: `preparar: OK`.

### CORREGIR ANTES DE ENCARGAR

Ninguno pendiente. Lo que corregí al proponer: las líneas citadas del README, y la verificación de la tarea
2.4, que pedía correr el comando de instalación (un implementador no instala).

### DEUDA (no bloquea esta ola)

- **E1 — La mecánica cree que la rama principal es `main`; en este repo es `master`.**
  - El perfil no declara `proyecto.ramaPrincipal` y el valor por defecto es `'main'`
    (`.claude/da/lib/perfil.mjs:161`) [V]. Consecuencias: `.github/workflows/citas.yml:18,26` filtran
    `branches: [main]` y no corren nunca en las PRs a `master`; `da worktree montar` sin `--desde` busca
    `origin/main`, que no existe (`.claude/da/lib/worktree.mjs:17`); `da medir` cuenta los merges a `main`.
  - En esta ola no bloquea: la base se pasa siempre explícita, y `da citas` corre dentro de `verify`.
  - Recomendación: añadir `"ramaPrincipal": "master"` en `proyecto` del perfil y regenerar con
    `.claude/da/da render` (la plantilla de `citas.yml` toma la rama de ahí), o renombrar `master` a `main` en
    GitHub. Decisión D1, junto con B1.
  - Estado: **resuelto** en la misma PR #4: `citas.yml` filtra `branches: [master]` y `da doctor` sigue en 41 OK.
- **E2 — Las issues están deshabilitadas en el repositorio.** `gh issue list` responde «the repository has
  disabled issues» [V]. Los hallazgos de pre-vuelo no se pueden registrar como manda `CLAUDE.md`; quedan en
  este reporte (E3, E4). Decisión D3.
  - Estado: el usuario las habilitó (D3 = A); E3, E4 y E5 están registradas como #5, #6 y #7.
- **E3 — R16 y ECharts pueden chocar** (para la Fase 1/2, no para esta ola). R16 dice que el HTML «no contiene
  `http://`, `https://` ni `//` en `src`, `href`, `url()`, `import` o `fetch`» (`docs/DOMINIO.md:93`) y la
  regla innegociable 3 lo repite. La librería minificada de ECharts trae, que yo sepa, cadenas como el espacio
  de nombres de SVG (`http://www.w3.org/2000/svg`), que no son red [I: no puedo descargar ECharts para
  comprobarlo]. Si el test de R16 de la Fase 1 busca `http://` en todo el HTML, la Fase 2 no podrá incrustar
  ECharts. Hay que precisar R16 antes de planear la Fase 1. Issue #5.
- **E4 — Las reglas innegociables 1 y 2 (dirección de imports entre capas) no tienen test de
  arquitectura.** `tests/test_pureza.py` solo busca librerías de red, subprocesos y bases de datos. Lo natural
  es que entre en la ola de la Fase 1, que crea las capas. Issue #6.
- **E5 — `requirements.txt` queda sin uso** tras actualizar el README (solo lo cita `README.md:13`). No se
  toca en esta ola. Issue #7.
- **E6 — `.claude/da/da sistema` probablemente falla hoy en `master`** porque no hay ningún test `sistema` y
  pytest sale con código 5 si no selecciona ninguno [I: no corrí el comando pesado]. El grupo 1 lo resuelve.

## 5. Tope de PRs y partición

- `move-generator-package`: 2 grupos → 2 PRs internas, en serie (1 → 2). Cabe en una ola.
- Tamaño estimado: grupo 1 ~70 líneas (un test nuevo); grupo 2 ~120 líneas (dos renombrados casi puros, dos
  archivos de una o tres líneas, un test, el README). Muy por debajo de 600.
- Un solo change: la Fase 0 no da para un segundo sin añadir alcance.

## 6. Lo que la ola absorbe

- No hay olas anteriores ni auditorías en `docs/olas/`. Absorbe E6, que no tiene issue porque esta misma ola
  lo resuelve. No absorbe #5, #6 ni #7: son de la Fase 1 o posteriores.

## 7. Lo que está bien

- PLAN, ARQUITECTURA y STACK coinciden en el destino (`generador/`, «movido sin cambiar su comportamiento»,
  Faker solo de desarrollo).
- Faker está fijado (`Faker==40.43.0` en `requirements.txt`, `requirements-dev.txt` y `pyproject.toml`), así
  que los oráculos son estables.
- El perfil ya tiene el área `generador` y su implementador (`.claude/agents/implementador-generador.md`), y
  los skills de área (`python-design-patterns`, `python-testing-patterns`) están instalados: no hay hueco de
  habilidad.
- `.claude/da/da doctor` y `.claude/da/da citas` en verde.

## 8. Decisiones

1. **D1 — Arreglar la configuración de la mecánica (B1 y E1).** *Del usuario: es configuración.*
   - A) Una PR de configuración aparte, para el usuario: `--find-links {wt}/../../../.cache/pip` en
     `worktree.preparar`, `"ramaPrincipal": "master"` en `proyecto` y `.claude/da/da render`.
   - B) Solo B1 ahora; E1 después.
   - C) Renombrar `master` a `main` en GitHub en vez de declarar `master`, y además arreglar B1.
   - Recomendación: **A**. Sin B1 la ola no arranca; E1 cuesta una línea más en el mismo archivo.
   - **Cerrada (2026-10-15): A, decisión del usuario.** PR #4.
2. **D2 — La verificación de ECharts que `docs/STACK.md` pone en la Fase 0.** *De alcance: sube al usuario.*
   `docs/STACK.md:32` («Se verifica en la Fase 0; si falla, 5.6.0») contradice al entregable de la Fase 0 en
   `docs/PLAN.md:60`, que no la nombra.
   - A) Fuera de esta ola: se verifica al empezar la Fase 2, la primera que dibuja gráficas, y se corrige la
     frase de `docs/STACK.md` en una PR de documentación para el usuario.
   - B) Dentro de esta ola, como grupo 3: el usuario descarga ECharts 6.0.0 a
     `src/reporte/presentacion/activos/` y el grupo añade `LICENCIAS.md` y un test de que el activo cumple R16.
     Exige resolver antes E3.
   - Recomendación: **A**. La ola está escrita así; con B el grupo 3 se añade al final y los grupos 1 y 2 no
     cambian.
   - **Cerrada (2026-10-15): A, decisión del usuario.** La corrección de `docs/STACK.md:32` es la PR #8 de
     documentación aparte, para el usuario.
3. **D3 — Habilitar las issues del repositorio (E2).** *Del usuario: es configuración del repositorio.*
   - A) Habilitarlas (`gh repo edit res4fan456-sys/data-analysis-report-project --enable-issues`, lo corre el
     usuario) y que el Planeador registre E3, E4 y E5 con `origen:pre-vuelo`.
   - B) Dejarlas deshabilitadas y llevar los hallazgos en los reportes de `docs/olas/`.
   - Recomendación: **A**. La mecánica entera (hallazgos del PM, `Closes #N`, el Archivador) da por hecho que
     hay issues.
   - **Cerrada (2026-10-15): A, decisión del usuario.** Issues #5, #6 y #7.
4. **D4 — No exponer todavía una API del perfil inyectado.** *Técnica: la decide el Team Manager.*
   `docs/ARQUITECTURA.md:19` dice que el generador «expone su perfil inyectado para la suite de sistema».
   - A) Dejarlo para la Fase 2, la primera que compara lo detectado con lo inyectado (así está escrito el
     change).
   - B) Añadirlo ahora al grupo 2.
   - Recomendación: **A**. Esta fase solo mueve; diseñar la API sin quien la consume obliga a adivinar.
   - **Cerrada (2026-10-15): A, decisión del Team Manager.**

Brief: `docs/olas/0-scaffolding-brief.md`.
