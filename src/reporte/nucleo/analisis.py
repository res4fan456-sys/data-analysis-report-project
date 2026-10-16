"""Análisis del mes: las cifras del resumen ejecutivo (R3, R4 y R5 de docs/DOMINIO.md)."""

import calendar
from dataclasses import dataclass
from datetime import date

import pandas as pd

from reporte.nucleo.tipos import Transacciones

CATEGORIAS_FUERA_DEL_VARIABLE = frozenset({"Vivienda", "Servicios", "Suscripciones", "Viajes"})


@dataclass(frozen=True)
class Resumen:
    """Cifras del resumen ejecutivo, sin redondear: el redondeo es de la presentación."""

    total: float
    numero: int
    ticket_promedio: float
    dia_mayor_gasto: date
    monto_dia_mayor_gasto: float
    gasto_variable: float
    proporcion_variable: float


@dataclass(frozen=True)
class Analisis:
    """Resultado del análisis de un mes; las fases siguientes le añaden campos."""

    mes: date
    ultimo_dia: date
    resumen: Resumen
    avisos: tuple[str, ...]


def analizar(transacciones: Transacciones) -> Analisis:
    """Calcula el resumen del mes y conserva los avisos de la lectura tal como llegaron."""
    mes = transacciones.mes
    ultimo = calendar.monthrange(mes.year, mes.month)[1]
    return Analisis(
        mes=mes,
        ultimo_dia=mes.replace(day=ultimo),
        resumen=_resumir(transacciones),
        avisos=transacciones.avisos,
    )


def _resumir(transacciones: Transacciones) -> Resumen:
    tabla = transacciones.tabla
    total = float(tabla["monto"].sum())
    numero = len(tabla)
    gasto_por_dia = tabla.groupby(tabla["fecha"].dt.normalize())["monto"].sum()
    dia_mayor_gasto = pd.Timestamp(gasto_por_dia.idxmax())
    variable = tabla.loc[~tabla["categoria"].isin(CATEGORIAS_FUERA_DEL_VARIABLE), "monto"].sum()
    return Resumen(
        total=total,
        numero=numero,
        ticket_promedio=total / numero,
        dia_mayor_gasto=dia_mayor_gasto.date(),
        monto_dia_mayor_gasto=float(gasto_por_dia.loc[dia_mayor_gasto]),
        gasto_variable=float(variable),
        proporcion_variable=float(variable) / total,
    )
