## El proyecto

**{{proyecto.nombre}}** — {{proyecto.descripcion?}}. Toda la verdad vive en `docs/`; este archivo dice cuándo leerla.

| Documento | Léelo antes de |
|---|---|
{{#cada rutas.documentos como d}}
| `{{d.ruta}}` | {{d.antesDe}} |
{{/cada}}
| `docs/DESARROLLO-AUTONOMO.md` · `{{rutas.olas}}/<ola>.md` | Trabajar en una **ola**: el porqué · su registro |

## Reglas innegociables de arquitectura

Un cambio que rompa cualquiera de estas se rechaza, sin discusión. El crítico las trata como BLOQUEA; una regla que se pueda volver automática (lint, test de arquitectura) **debe** volverse automática.

{{#si proyecto.invariantes}}
{{#cada proyecto.invariantes como regla}}
{{@numero}}. {{regla}}
{{/cada}}
{{#sino}}
1. _(Escribe aquí las invariantes del proyecto: quién es la autoridad, qué módulo es puro, qué no sale del servidor, qué es dato y no código…)_
{{/si}}

## Convenciones

- **Dominio en español; infraestructura en inglés.** _(Ajusta: nombres del dominio, de la infraestructura, de los textos visibles y dónde viven.)_

### Idioma

| Dónde | Idioma |
|---|---|
| Nombres del dominio | Español |
| Nombres de infraestructura (servidor, rutas, configuración) | Inglés |
| Comentarios en el código | Español |
| Fuentes que cita un comentario | Solo documentos del repositorio |
| Documentación en `docs/` | Español |
| **Mensajes de commit y nombres de rama** | **{{idiomas.commitsTitulo}}** |
| Textos visibles al usuario | {{#si proyecto.textosVisibles}}{{proyecto.textosVisibles}}{{#sino}}_(idioma y dónde viven: catálogo, archivo de mensajes…)_{{/si}} |

## Comandos del proyecto

| Comando | Qué hace |
|---|---|
{{#cada comandos.verify como paso}}
| `{{paso.cmd}}` | Paso `{{paso.paso}}` del gate |
{{/cada}}
| `{{comandos.ligeros.test}}` | Tests por ruta (check ligero del implementador) |
{{#si comandos.entorno.levantar}}
| `{{comandos.entorno.levantar}}` | Levantar el entorno local |
{{/si}}
{{#si modulos.suite}}
| `{{modulos.suite.cmd}}` | La suite de sistema `{{modulos.suite.nombre}}`{{#si modulos.suite.preparar}} (antes: `{{modulos.suite.preparar}}`){{/si}} |
{{/si}}
{{#si comandos.entorno.puertos}}

**Puertos:** {{lista comandos.entorno.puertos}}
{{/si}}
