---
name: Hallazgo
about: Un hallazgo o deuda que no entra en la ola en curso. Lo crean el Planeador (origen:pre-vuelo) y el project manager (origen:ola); lo cierra el Archivador.
title: ""
labels: []
---

<!--
Título: una frase llana, sin nombres de archivo.
Etiquetas (se ponen al crear, no aquí):
- tipo: tipo:fallo-latente | tipo:oportunidad | tipo:deuda-tecnica
- area: area:nucleo | area:datos | area:presentacion | area:app | area:generador | area:ui-ux | area:rendimiento | area:seguridad | area:infra | area:pruebas | area:mecanica
- impacto:visible  (filtro de prioridad: lo percibe el autor; NO se pone en casos no soportados)
- origen: origen:pre-vuelo | origen:ola | origen:auditoria
- carril:arreglo  (la pone el Team Manager si el cambio cabe en ~30 líneas de producto,
  sin una regla de dominio en el núcleo, un cambio de contrato entre módulos, una migración y un flujo nuevo en la suite de sistema; si no, es ola)
Antes de crearla: `gh issue list --search "<palabras>"` para no duplicar.
Ejemplo de referencia: .claude/skills/desarrollo-autonomo-planeador/ejemplo-de-issue.md
-->

## En una frase

<Qué pasa, en una frase llana, sin jerga sin explicar.>

## La historia

<Qué pasa hoy y por qué; de dónde viene.>

## Ejemplo

<Pasos numerados que lo reproducen, o el antes y el después (hoy frente a con el cambio).>

## Por qué importa

<Quién lo ve y qué pasa si no se atiende.>

## Dónde está

- <archivo:línea>
- <comportamiento anterior, si aplica: `<sha>:archivo:línea`>
Verificado en <rama> @ <sha de `master`>.

## Propuesta

<Qué hacer.>
Tamaño: tarea suelta | grupo | change propio · Carril: arreglo | ola · Ola candidata: <cuál o ninguna> · Riesgo: <bajo | medio | alto>

## Origen

<Ola / PR / fecha; y si vino de un hallazgo del crítico aceptado como deuda, dilo.>
