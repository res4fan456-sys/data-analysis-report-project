"""Análisis del mes: las cifras del resumen ejecutivo (R3, R4 y R5 de docs/DOMINIO.md)."""

import calendar
import math
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


def _primer_dia_con_el_maximo(gasto_por_dia: pd.Series[float]) -> pd.Timestamp:
    """Día más temprano cuya suma empata con la mayor.

    Los montos no se redondean en el núcleo (docs/DOMINIO.md, caso borde «Montos con más de 2
    decimales»), así que dos sumas que solo difieren por el error de la suma binaria cuentan como
    empate y una diferencia real, aunque sea menor a un centavo, no.
    """
    maximo = float(gasto_por_dia.max())
    empatados = [math.isclose(float(suma), maximo, rel_tol=1e-9) for suma in gasto_por_dia]
    return pd.Timestamp(gasto_por_dia.index[empatados.index(True)])


def _resumir(transacciones: Transacciones) -> Resumen:
    tabla = transacciones.tabla
    total = float(tabla["monto"].sum())
    numero = len(tabla)
    gasto_por_dia = tabla.groupby(tabla["fecha"].dt.normalize())["monto"].sum()
    dia_mayor_gasto = _primer_dia_con_el_maximo(gasto_por_dia)
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
