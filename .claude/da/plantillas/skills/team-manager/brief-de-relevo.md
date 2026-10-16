# Plantilla — brief de relevo de un PM

La escribe el Team Manager al lanzar un PM de relevo. Es corta: el estado real vive en el registro de la ola (`{{rutas.olas}}/<ola>.md`, sección *Handover*), que el PM entrante verifica contra el repo por `desarrollo-autonomo-pm` §1b. Esta plantilla solo delimita la misión de esta instancia.

```markdown
# Relevo — Ola <ola>, PM <n>

- **Quién eres:** PM de relevo de la Ola <ola>. Entras por `desarrollo-autonomo-pm` §1b.
- **Qué retomas:** el registro `{{rutas.olas}}/<ola>.md` @ <sha>, pusheado, con su *Handover* al día. La rama viva es `{{git.ola}}<ola>`.
- **Tu misión, acotada:** <los grupos o PRs que te tocan; lo que NO empiezas>.
- **Decisiones ya resueltas** (no las reabras): <lista corta o "ver registro, Decisiones">.
- **Tope de esta instancia:** <N PRs> o el umbral de contexto; al llegar, handover en el registro y para.
- **Entorno vivo hoy:** <lo que el registro marque en *Entorno vivo*; qué sesiones comparten el repo>.
```

Lo variable lo pone el Team Manager; lo fijo (handover al umbral, no cambiar la rama del checkout principal, un comando pesado a la vez) ya vive en `desarrollo-autonomo-pm` y en `CLAUDE.md`.
