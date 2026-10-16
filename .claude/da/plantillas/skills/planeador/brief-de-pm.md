# Plantilla del brief del PM

Se escribe solo cuando la ola está «lista para delegar». Es autocontenido: el PM arranca sin contexto y no puede preguntar. Todo lo que afirma sobre el código se verificó en el pre-vuelo y lleva `archivo:línea`.

```markdown
# Brief — Ola <ola> «<título>»

Eres el **project manager** de la Ola <ola> de {{proyecto.nombre}}. Tu procedimiento es el skill `desarrollo-autonomo-pm` (entra por §1) y tus reglas son `CLAUDE.md`. Este brief delimita la misión; lo que no esté aquí lo decide el skill, y lo que el skill no decida lo escalas al Team Manager.

## 1. La ola
- Rama `{{git.ola}}<ola>` desde `{{proyecto.ramaPrincipal}}` en `<sha>` o posterior; registro `{{rutas.olas}}/<ola>.md`.
- Changes: <lista>, ya propuestos y refinados; los tomas, no los reescribes. Si `desarrollo-autonomo-pm` §1.3 destapa algo inalcanzable, `openspec-update-change` y registro.
- Entregable: <lo observable al cerrar, en una o dos frases>. <Regla de la fase, p. ej. cero cambio de comportamiento.>
- PRs internas: <N>, en este orden: <grafo>, cada grupo de unas {{limites.lineasPorGrupo}} líneas de diff o menos. Qué va en serie y qué en paralelo, y por qué. Lo que NO se empieza (la ola siguiente).

## 2. Lecturas obligatorias antes del primer encargo
1. El skill `desarrollo-autonomo-pm` con sus archivos (`CLAUDE.md` ya está en tu contexto).
2. Nada de `{{rutas.plan}}` ni de `{{rutas.arquitectura}}` enteros: las secciones que gobiernan la ola van extractadas en §4, con `archivo:línea`.
3. Los artefactos de cada change por la mecánica de OpenSpec; `context`/`operationGuidance` literales.
4. Auditorías y registros de olas anteriores que esta ola absorbe (rutas concretas).
5. Los tests que son la guarda de la ola (rutas), y que no se ablandan.

## 3. Reglas de la fase que mandan en cada PR
- <lo específico de la fase: contratos intocables, ningún oráculo cambia, qué se escala>. La mecánica (comando pesado, verificación proporcional{{#si modulos.graft}}, graft{{/si}}) no se repite aquí: vive en el skill.

## 4. Lo que cada grupo debe saber (verificado en el código el <fecha>)
- Grupo N — <título>: <hechos con `archivo:línea`, trampas conocidas, qué hace de guarda, y qué skills de área necesita si no son los del perfil>.

## 5. Mecánica de esta fase
- **Base de la ola:** `{{proyecto.ramaPrincipal}}`, o `{{git.ola}}<ola anterior>` si se apila (avance continuo pedido por el usuario el <fecha>; su PR de ola es la #<n>). De ahí sale la rama de ola y a ahí apunta su PR.
- Quién propone (el Team Manager, vía el Planeador) y quién toma (el PM); a quién se escala (al Team Manager). Otra sesión puede compartir el repo hoy: <cuáles>. El handover, la regla de no cambiar la rama del checkout principal y el comando pesado uno a la vez viven en `desarrollo-autonomo-pm` (§6, §1.7) y en `CLAUDE.md` (*Desarrollo agéntico* 8-9); worktrees con `{{kit.da}} worktree montar`.
- Cierre: PR `{{git.ola}}<ola> → {{proyecto.ramaPrincipal}}` con la plantilla B, abierta para el usuario. Nada llega a `{{proyecto.ramaPrincipal}}` por el PM.

## 6. Primer paso concreto
- `{{kit.da}} preflight` limpio, `{{kit.da}} verify` verde sobre `{{proyecto.ramaPrincipal}}`, mecánica de OpenSpec; con eso, la lista de arranque (`desarrollo-autonomo-pm` §1.6) al Team Manager **solo si hay algo que pedir al usuario** —si no, aviso y arranque—, y después la rama, el registro y el primer encargo.
```

El brief se guarda como archivo y se entrega al Team Manager, que es quien lanza al PM (o al usuario, en sesión independiente).
