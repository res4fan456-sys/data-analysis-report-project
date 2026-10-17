# Design

## Context

- `analizar` (`src/reporte/nucleo/analisis.py`) devuelve hoy `Analisis(mes, ultimo_dia, resumen, avisos)`; su
  docstring ya anuncia que las fases siguientes le añaden campos. `docs/ARQUITECTURA.md` (Contratos) declara
  `patrones` y `hallazgos` como campos de `Analisis`: este change los crea, de forma aditiva.
- `tests/test_arquitectura.py` ya vigila que `nucleo` no haga I/O ni importe otras capas; los módulos nuevos
  caen bajo esa guarda sin tocarla.
- El generador (`generador/generar_transacciones.py`) construye el perfil con `crear_perfil` dentro de `main`,
  que no devuelve nada; el perfil solo se ve impreso con `-v` (`imprimir_resumen`). `main` siembra
  `random.Random(semilla)` y `Faker.seed_instance(semilla)` antes de cualquier consumo y llama primero a
  `crear_perfil`: el orden de esas llamadas fija el CSV.
- Lo que el generador inyecta, medido en el pre-vuelo con 20,000 registros de septiembre de 2026 y semillas 7,
  42 y 2026 para cada categoría dominante (11 corridas): la categoría dominante detectada es siempre la inyectada
  (42.8 %–62.3 % del gasto variable; la segunda, ≤ 19.9 %); la zona favorita también (41.4 %–91.2 %; la segunda,
  ≤ 33.7 %); el viaje, siempre uno, de viernes a domingo, con destino y fechas iguales a los del perfil; el factor
  del día de pago, entre ×2.03 y ×2.78. El fin de semana **no** es parte del perfil: el generador lo aplica
  siempre, pero baja `Transporte` ×0.7 en fin de semana, y con `Transporte` dominante y semilla 42 el factor es
  ×1.09, bajo el umbral de 1.1. La cuesta tampoco es fiable (×1.13 con `Comida` y semilla 42).

## Goals / Non-Goals

**Goals:**

- Cada regla R6–R10 en su propia función pura, probada por la interfaz pública `analizar` con tablas hechas a mano.
- Que la presentación no tenga que calcular nada: cada patrón trae los datos de su gráfica.
- Una comparación de sistema entre lo detectado y lo inyectado que no dependa de parsear texto.

**Non-Goals:**

- Redactar los hallazgos: el texto es de la presentación (regla innegociable 4); el núcleo decide cuáles, en qué
  orden y con qué cifra.
- Cambiar el resumen de la Fase 1 o cualquier campo existente de `Analisis`.
- Hacer configurables los umbrales.

## Decisions

### Nombres que consume `chart-pattern-sections`

Se fijan aquí porque el otro change de la ola los lee. Todo es `@dataclass(frozen=True)` con tipos nativos
(`float`, `int`, `str`, `date`), como `Resumen`.

- `Analisis.patrones: Patrones` y `Analisis.hallazgos: tuple[Hallazgo, ...]`.
- `EstadoDePatron`: `APARECE`, `NO_APARECE`, `SIN_DATOS` (un `StrEnum`).
- `Patrones(dominante, zona_favorita, quincena, fin_de_semana, viaje)`.
- `ParteDelGasto(nombre: str, monto: float, proporcion: float)`.
- `CategoriaDominante(estado, categoria: str | None, proporcion_variable: float, proporcion_total: float,
  reparto: tuple[ParteDelGasto, ...])`.
- `ZonaFavorita(estado, zona: str | None, proporcion: float, reparto: tuple[ParteDelGasto, ...])`.
- `TipoDeDia`: `PAGO`, `POST_PAGO`, `CUESTA`, `NORMAL`; `GastoPorTipoDeDia(tipo, dias: int, promedio: float,
  factor: float)`.
- `Quincena(estado, por_tipo: tuple[GastoPorTipoDeDia, ...], factor_dia_de_pago: float,
  dias_de_pago_en_fin_de_semana: tuple[date, ...])`.
- `FinDeSemana(estado, promedio_viernes_a_domingo: float, promedio_lunes_a_jueves: float, factor: float,
  nocturno: float, proporcion_nocturno: float)`.
- `Viaje(destino: str, inicio: date, fin: date, gasto: float)`; `GastoDelDia(dia: date, monto: float,
  destino: str | None)` (`destino` es el del viaje que ocupa ese día, o `None`);
  `PatronDeViaje(estado, viajes: tuple[Viaje, ...], gasto_diario: tuple[GastoDelDia, ...])`.
- `TipoDeHallazgo`: `DOMINANTE`, `ZONA_FAVORITA`, `QUINCENA`, `FIN_DE_SEMANA`, `VIAJE`, `DIA_DE_MAYOR_GASTO`,
  `GASTO_VARIABLE`, `TICKET_PROMEDIO`; `Hallazgo(tipo, cifra: float, relevancia: float | None, viaje: Viaje |
  None)`. `cifra` es la proporción, el factor o el monto que respalda el hallazgo; `relevancia` es `None` en los
  de relleno.

Un factor o una proporción que no se puede calcular vale `0.0` con estado `SIN_DATOS`, nunca `nan`: la
presentación no tiene que distinguir flotantes especiales. Alternativa descartada: `float | None` en cada cifra,
que obliga a la plantilla a ramificar por campo.

### Umbrales de R14

- Categoría dominante: aparece si su proporción del gasto variable **supera** 0.30 (texto literal de R14).
- Quincena: aparece si el factor del día de pago es **de al menos** 1.1 (R14 dice que «< 1.1» no es patrón).
- Zona favorita (≥ 0.30 del gasto en `Comida` + `Entretenimiento` de las zonas no lejanas) y fin de semana
  (factor ≥ 1.1): `docs/DOMINIO.md` no les fija umbral; se extienden los de R6 y R9 por analogía. Con lo medido,
  la zona favorita inyectada nunca baja de 0.41 y una zona no inyectada nunca sube de 0.34.
- Promedios por día sobre los días del calendario del tipo, con gasto o sin él: así un mes con pocas compras no
  infla el promedio de los días que sí las tienen. Se toman todas las transacciones, como dice R9; medido, quitar
  cargos fijos y `Viajes` no mueve ningún factor más de 0.02.

### Viaje

- La ciudad de una zona es su nombre hasta la primera coma (`Guadalajara, Jal.` → `Guadalajara`), que es como el
  generador escribe `Vuelo a {ciudad}`; la comparación con el `concepto` es sin distinguir mayúsculas.
- Haversine con radio terrestre de 6,371 km, con `math`, sin dependencias.
- Una transacción `Viajes` que menciona la ciudad cuenta para el primer viaje a esa zona que empieza después de
  ella (el vuelo se compra antes), o el último si ninguno: así nunca cuenta dos veces.

### Relevancia de los hallazgos

Proporción del gasto total que el hallazgo explica (spec `resumen-del-mes`). Es comparable entre patrones porque
todo se mide en pesos del mismo mes. Alternativa: un orden fijo por tipo; es más simple, pero no es «por
relevancia» como pide R4, y deja el viaje caro detrás de una zona favorita barata.

### Perfil del generador como dato

Se extrae de `main` una función pública, p. ej. `generar_mes(registros, mes, semilla, categoria_dominante) ->
tuple[list[dict], Perfil]`, que hace exactamente lo que `main` hacía entre sembrar y escribir, en el mismo orden;
`main` la llama y conserva la escritura y `-v`. La guarda es `tests/sistema/test_generador.py`, que fija los
SHA-256 del CSV y de `-v` y no se modifica. Alternativa descartada: parsear la salida de `-v`, que hace de un
texto de depuración un contrato.

### Suite de sistema

La prueba nueva genera los cuatro meses en el proceso con `generar_mes`, los escribe en `tmp_path`, y los pasa
por `leer_transacciones` y `analizar` reales; compara contra el `Perfil`. No afirma el fin de semana ni la
cuesta, que el perfil no inyecta de forma fiable (ver Context). Semilla 42 para las cuatro categorías: medida en
el pre-vuelo, pasa en las cuatro.

## Risks / Trade-offs

- [El refactor del generador cambia el orden de consumo del `rng` y altera el CSV] → los SHA de
  `tests/sistema/test_generador.py` lo detectan; el implementador corre esos tests por ruta antes de entregar
  (tarea 3.1).
- [Empates de suma binaria en la categoría o la zona, como el día de mayor gasto en la Fase 1] → mismo criterio
  que `_primer_dia_con_el_maximo` (`math.isclose`, `rel_tol=1e-9`) y desempate alfabético; tiene prueba (tareas 1.2
  y 1.4).
- [Cuatro meses de 20,000 registros alargan la suite de sistema] → un fixture de módulo por categoría; se
  generan una vez por corrida (tarea 3.2).
- [El umbral de la zona favorita es una extensión, no una regla escrita] → queda en la spec con su escenario; el
  usuario lo confirma o lo revierte en la PR de ola.
