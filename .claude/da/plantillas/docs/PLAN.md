# PLAN — {{proyecto.nombre}}

<!-- Semilla del kit: este documento es del proyecto. El Planeador lee la sección de la fase antes de cada ola; el PM solo recibe el extracto en su brief. -->

> Toda fase declara su objetivo, su **entregable verificable**, lo que queda **fuera de alcance** y las olas que la forman (cada una de hasta {{limites.prsInternasPorOla}} PRs internas). Las fases son secuenciales: no se empieza una sin que el entregable de la anterior esté demostrado y confirmado.

## Fase 0 — Andamiaje

- **Objetivo:** el proyecto arranca con la mecánica instalada y un gate verde.
- **Entregable:** `{{kit.da}} verify` en verde sobre `{{proyecto.ramaPrincipal}}` y `{{kit.da}} doctor` sin FALLA.
- **Fuera de alcance:** cualquier funcionalidad del producto.
- **Olas:** ninguna (la hace `/da-init`).

## Fase 1 — <nombre>

- **Objetivo:** <qué resuelve esta fase para {{usuarioFinal.el}}>.
- **Entregable:** <lo observable al cerrar: un comando, una pantalla, un archivo, un comportamiento que ya existe>.
- **Fuera de alcance:** <lo que no entra «de paso»>.
- **Decisiones cerradas:** <las que gobiernan la fase; un `[PENDIENTE]` bloquea la ola que lo toque>.
- **Olas:** 1a (<changes>), 1b (<changes>)…
