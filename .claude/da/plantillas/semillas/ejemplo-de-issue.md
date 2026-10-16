# Ejemplo de issue de hallazgo

<!-- Semilla del kit: este archivo es del proyecto. Sustituye el ejemplo por una deuda real del proyecto cuando la tengas; conserva la forma. -->

Referencia para el Planeador (`{{etiquetas.origen.planeacion}}`) y el PM (`{{etiquetas.origen.ola}}`) al crear una issue con `.github/ISSUE_TEMPLATE/hallazgo.md`. El ejemplo es una deuda típica: un caso que el producto no promete y que un refactor dejó peor. `{{etiquetas.impactoVisible}}` **no** se pone aquí a propósito: el caso no está soportado, y esa etiqueta es el filtro de prioridad.

```
Título: La segunda sesión de una misma cuenta deja de recibir actualizaciones
Etiquetas: {{#cada etiquetas.tipo como t}}{{#si @primero}}{{t}}{{/si}}{{/cada}} · area:<área> · {{etiquetas.origen.ola}}

## En una frase
Si alguien abre la misma cuenta en dos sesiones, la segunda se queda
congelada: ya no recibe los cambios.

## La historia
Hasta la ola anterior el servidor enviaba el estado a todas las
conexiones vivas de una cuenta. Al extraer la lógica pura, los envíos
pasaron a dirigirse por cuenta, y el servidor resuelve cada cuenta a su
primera conexión. El inicio de sesión no impide que una cuenta tenga dos
conexiones, así que la segunda sigue abierta pero nadie le escribe. No se
arregló en la ola porque el producto promete una sesión por cuenta, y
hacerlo bien exigiría meter la identidad de la conexión en la capa pura.

## Ejemplo
1. Ana entra desde su tableta.
2. Abre la misma cuenta en el portátil.
3. Hace un cambio en la tableta.
4. El portátil sigue mostrando el estado anterior.

## Por qué importa
No lo ve quien usa una cuenta en un solo dispositivo. Lo vería quien
cambie de dispositivo sin cerrar el primero. Si no se hace, ese caso
seguirá pareciendo un cuelgue. Ningún test lo cubre.

## Dónde está
- <ruta del servidor>: <función que reparte los envíos>
- Comportamiento anterior: <sha>:<ruta>:<línea>
Verificado en {{git.ola}}<ola> @ <sha>.

## Propuesta
Decidir qué debe pasar con dos sesiones: rechazar la segunda conexión al
autenticar, o repartir cada envío a todas las conexiones de la cuenta
sin que la capa pura lo sepa.
Tamaño: tarea suelta · Carril: ola · Ola candidata: ninguna · Riesgo: medio

## Origen
Ola <ola>, PR #<n>, <fecha>. Hallazgo NO BLOQUEA del crítico,
aceptado como deuda por el PM.
```
