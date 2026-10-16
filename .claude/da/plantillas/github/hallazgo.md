---
name: Hallazgo
about: Un hallazgo o deuda que no entra en la ola en curso. Lo crean el Planeador ({{etiquetas.origen.planeacion}}) y el project manager ({{etiquetas.origen.ola}}); lo cierra el Archivador.
title: ""
labels: []
---

<!--
Título: una frase llana, sin nombres de archivo.
Etiquetas (se ponen al crear, no aquí):
- tipo: {{#cada etiquetas.tipo como t}}{{t}}{{#si no @ultimo}} | {{/si}}{{/cada}}
- area: {{#cada etiquetas.areas como a}}{{a}} | {{/cada}}{{#cada etiquetas.transversales como a}}{{a}}{{#si no @ultimo}} | {{/si}}{{/cada}}
- {{etiquetas.impactoVisible}}  (filtro de prioridad: lo percibe {{usuarioFinal.el}}; NO se pone en casos no soportados)
- origen: {{etiquetas.origen.planeacion}} | {{etiquetas.origen.ola}} | {{etiquetas.origen.auditoria}}
- {{etiquetas.carrilArreglo}}  (la pone el Team Manager si el cambio cabe en ~{{limites.arreglo.lineasDeProducto}} líneas de producto,
  sin {{frase limites.arreglo.excluye}}; si no, es ola)
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
Verificado en <rama> @ <sha de `{{proyecto.ramaPrincipal}}`>.

## Propuesta

<Qué hacer.>
Tamaño: tarea suelta | grupo | change propio · Carril: arreglo | ola · Ola candidata: <cuál o ninguna> · Riesgo: <bajo | medio | alto>

## Origen

<Ola / PR / fecha; y si vino de un hallazgo del crítico aceptado como deuda, dilo.>
