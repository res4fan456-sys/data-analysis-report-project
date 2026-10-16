"""Formato es-MX de montos, porcentajes, conteos y fechas (R15, `docs/DOMINIO.md`).

Los textos esperados son literales del contrato: se afirman tal cual.
"""

import datetime

import numpy as np
import pytest

from reporte.presentacion import (
    dia_de_la_semana,
    formatear_entero,
    formatear_fecha,
    formatear_mes,
    formatear_monto,
    formatear_porcentaje,
)


@pytest.mark.parametrize(
    ("monto", "esperado"),
    [
        (1234.56, "$1,234.56"),
        (9879934.3, "$9,879,934.30"),
        (0, "$0.00"),
    ],
)
def test_monto_lleva_signo_de_pesos_comas_de_miles_y_dos_decimales(monto, esperado):
    assert formatear_monto(monto) == esperado


@pytest.mark.parametrize(("monto", "esperado"), [(2.675, "$2.68"), (10.005, "$10.01")])
def test_monto_redondea_la_mitad_hacia_arriba_como_una_persona(monto, esperado):
    assert formatear_monto(monto) == esperado


def test_monto_con_mas_de_dos_decimales_se_redondea_y_no_se_trunca():
    assert formatear_monto(1234.5678) == "$1,234.57"


def test_monto_por_debajo_de_la_mitad_se_redondea_hacia_abajo():
    assert formatear_monto(1234.564) == "$1,234.56"


def test_monto_acepta_el_float_de_numpy_que_entrega_el_nucleo():
    assert formatear_monto(np.float64(2.675)) == "$2.68"


@pytest.mark.parametrize(
    ("proporcion", "esperado"),
    [(0.4234, "42.3 %"), (1.0, "100.0 %"), (0.0, "0.0 %")],
)
def test_porcentaje_lleva_un_decimal_y_espacio_normal_antes_del_signo(proporcion, esperado):
    texto = formatear_porcentaje(proporcion)

    assert texto == esperado
    assert texto[-2] == " "


@pytest.mark.parametrize(("proporcion", "esperado"), [(0.0045, "0.5 %"), (0.0055, "0.6 %")])
def test_porcentaje_redondea_la_mitad_hacia_arriba_sin_error_de_float(proporcion, esperado):
    assert formatear_porcentaje(proporcion) == esperado


def test_porcentaje_acepta_el_float_de_numpy_que_entrega_el_nucleo():
    assert formatear_porcentaje(np.float64(0.0045)) == "0.5 %"


def test_entero_lleva_comas_de_miles():
    assert formatear_entero(20000) == "20,000"


def test_fecha_de_un_digito_no_lleva_cero_a_la_izquierda():
    assert formatear_fecha(datetime.date(2026, 3, 1)) == "1 de marzo de 2026"


def test_fecha_de_dos_digitos():
    assert formatear_fecha(datetime.date(2026, 9, 15)) == "15 de septiembre de 2026"


def test_mes_del_reporte_va_en_espanol_con_el_anio():
    assert formatear_mes(datetime.date(2026, 9, 1)) == "septiembre de 2026"


def test_los_siete_dias_salen_en_espanol_con_acento_y_empiezan_en_lunes():
    dias = [dia_de_la_semana(datetime.date(2026, 9, 14 + d)) for d in range(7)]

    assert dias == ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"]


def test_dia_de_la_semana_de_las_fechas_del_reporte():
    assert dia_de_la_semana(datetime.date(2026, 9, 16)) == "miércoles"
    assert dia_de_la_semana(datetime.date(2026, 9, 19)) == "sábado"


def test_los_doce_meses_salen_en_espanol_en_orden():
    meses = [formatear_mes(datetime.date(2026, m, 1)).split(" de ")[0] for m in range(1, 13)]

    assert meses == [
        "enero",
        "febrero",
        "marzo",
        "abril",
        "mayo",
        "junio",
        "julio",
        "agosto",
        "septiembre",
        "octubre",
        "noviembre",
        "diciembre",
    ]
