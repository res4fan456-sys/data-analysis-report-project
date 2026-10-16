# ARQUITECTURA — {{proyecto.nombre}}

<!-- Semilla del kit: este documento es del proyecto. El Planeador cita §4 (contratos intocables) y §5 (pirámide de pruebas) en cada pre-vuelo; mantenlos al día. -->

## 1. Capas y módulos

<qué capas hay, qué vive en cada una y en qué dirección dependen>

## 2. Dependencias permitidas

<qué puede importar a qué; lo que se vuelve lint o test de arquitectura, se dice aquí y se automatiza>

## 3. Flujo principal

<de la entrada a la salida, en un párrafo o un diagrama>

## 4. Contratos intocables

Nada de esto cambia salvo de forma aditiva y declarada en la propuesta del change:

1. <formato de datos, API, nombres accesibles, mensajes entre módulos…>

## 5. Pirámide de pruebas

| Nivel | Qué guarda | Dónde |
|---|---|---|
| Unitarias | Toda regla de negocio, por la interfaz pública | `tests/` |
| Integración | Los bordes de I/O (archivos, base, red), con dobles o servicios locales | `tests/` |
{{#si modulos.suite}}
| Sistema (`{{modulos.suite.nombre}}`) | El flujo principal de cada fase, contra el sistema real | <ruta> |
{{/si}}
