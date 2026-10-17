# Spec Delta

## ADDED Requirements

### Requirement: El perfil inyectado se obtiene como dato

El generador MUST ofrecer una función pública que, con las mismas opciones que la línea de comandos (registros,
mes, semilla y categoría dominante), devuelva las filas del mes y el perfil inyectado como dato: categoría
dominante, zona favorita, destino del viaje y sus días. La línea de comandos MUST producir con ella el mismo CSV
y la misma salida de `-v`, byte a byte.

#### Scenario: El perfil coincide con lo que imprime `-v`

- **WHEN** se pide el mes con `registros=2000`, `mes=2026-09`, `semilla=42` y `categoria_dominante="Comida"`
- **THEN** el perfil trae la categoría dominante, la zona favorita y el destino y las fechas del viaje que
  imprime `python -m generador -n 2000 --mes 2026-09 --semilla 42 --categoria-dominante Comida -v`

#### Scenario: La línea de comandos no cambia

- **WHEN** se ejecutan los escenarios de «La misma semilla reproduce exactamente el mismo mes»
- **THEN** los SHA-256 del CSV y de la salida de `-v` siguen siendo los mismos

### Requirement: Lo detectado coincide con lo inyectado

Para cada categoría dominante que el generador puede inyectar, con semilla fija, la suite de sistema MUST
comprobar que el análisis del CSV generado detecta la categoría dominante, la zona favorita y el viaje (destino,
primer y último día) del perfil inyectado, y que la quincena aparece.

#### Scenario: Una semilla por categoría dominante

- **WHEN** se genera septiembre de 2026 con 20,000 registros y semilla 42 para `Comida`, `Transporte`,
  `Entretenimiento` y `Compras`
- **THEN** en cada uno la categoría dominante, la zona favorita y el viaje detectados son los del perfil, y la
  quincena aparece
