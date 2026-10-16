"""Tipos compartidos entre capas.

`Transacciones` vive en `nucleo` para que `datos` produzca el tipo que `nucleo` consume sin que
`nucleo` dependa de `datos` (docs/ARQUITECTURA.md, Contratos).
"""

from dataclasses import dataclass
from datetime import date

import pandas as pd


@dataclass(frozen=True)
class Transacciones:
    """Transacciones ya validadas de un solo mes.

    `tabla` trae las nueve columnas del CSV tipadas (`fecha` datetime64; `monto`, `latitud` y
    `longitud` float), `mes` es el primer día del mes del reporte y `avisos` lleva lo que no
    impide el reporte pero se debe advertir.
    """

    tabla: pd.DataFrame
    mes: date
    avisos: tuple[str, ...]
