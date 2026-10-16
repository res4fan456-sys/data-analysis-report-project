# Formato del reporte y de la representación de una ola

El usuario decide sobre este reporte. Se escribe en sub-bullets anidados, una idea por línea, sin prosa con varias rutas en una misma frase. Rutas y símbolos en código inline; cifras solo cuando cambian una decisión.

## La representación de una ola

```
- **Ola <ola> — `<change>`** (<N> PRs internas)
  - **Entregable**
    - <lo observable al cerrar: un archivo, una carpeta, un test, un comportamiento que ya no existe>
  - **Componentes que se modifican**
    - `<área/ruta>` (<qué le pasa: se parte, se retira, se mueve, consume X>)
    - No se toca: <lo que el lector esperaría ver y no cambia>
  - **Correcciones propuestas** (solo mientras la ola no está lista)
    - <qué cambia en qué artefacto, y por qué, con la evidencia>
```

Reglas: el entregable es lo que alguien puede abrir o correr, no la intención; los componentes son rutas reales verificadas; se dice explícitamente qué no se toca; una pregunta o una acción siguiente al final; un hallazgo que abre una decisión se presenta como decisión con opciones, nunca se resuelve en silencio.

## El reporte completo

1. **Veredicto**, una línea por change: lista para un PM / lista con correcciones / necesita replanteo; para la ola entera, binario: «lista para delegar» o «no lista». Una segunda línea con lo más importante.
2. **Por ola**, con la representación de arriba.
3. **Hallazgos** por severidad: `BLOQUEA EL ARRANQUE` (la ola no puede abrirse así), `CORREGIR ANTES DE ENCARGAR` (se corrige en los artefactos antes del primer encargo), `DEUDA` (se anota, no bloquea). Cada uno: qué pasa, evidencia `archivo:línea` (verificado / inferido), por qué importa, recomendación.
4. **Tope de PRs y partición**: cuenta por change y la redacción exacta que habría que cambiar.
5. **Lo que la ola absorbe** de la deuda heredada y de las auditorías: en qué grupo encaja cada punto, o por qué no.
6. **Lo que está bien**, breve, para no re-discutirlo.
7. **Decisiones para el usuario**, numeradas, cada una con opciones y recomendación.

Se guarda como archivo (`docs/olas/<ola>-revision.md`) y se presenta entero. Cuando la ola queda lista, el reporte final lleva el veredicto «lista para delegar» y enlaza el brief.
