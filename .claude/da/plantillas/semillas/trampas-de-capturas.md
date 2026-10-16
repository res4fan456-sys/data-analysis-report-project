## {{modulos.visual.herramienta}} y capturas

<!-- Semilla del kit: este archivo es del proyecto. Añade aquí cada trampa que te cueste una captura; el kit no lo vuelve a escribir. -->

- **La captura reimpone el viewport de la herramienta.** Si cambiaste las métricas por otro canal (CDP, emulación), la captura puede salir con el viewport original aunque el DOM tenga el estado nuevo. La aserción sobre el DOM es fiable; la imagen no. Reporta la aserción y di que la captura no es producible.
- **Un navegador en pantalla completa no se redimensiona.** El error al cambiar el viewport es la prueba de que la pantalla completa se activó. Para cambiar lo que la página ve, usa el protocolo del navegador.
- **Dos corridas, dos juegos de nombres de archivo.** Un guion que escribe `captura-antes.png` en dos corridas conserva solo la segunda.
- **Los `aria-label` no son píxeles.** Un nombre accesible es un atributo, no texto visible: no lo busques en la imagen.
- **Una búsqueda de texto laxa matchea lo que no esperas.** Antes de fiarte de un `isVisible()`, imprime el texto literal del nodo y comprueba que contiene lo que buscas.
- **Antes de capturar, espera a una condición observable, no a un tiempo.** Una captura disparada nada más actuar puede salir a mitad de una animación. Mide la geometría dos veces seguidas y captura cuando no cambie. Y si una captura muestra algo raro, **pide la medición del DOM antes de retomar**: lo que parece «a media animación» puede ser un defecto real que la retoma no enseñaría.
