"""Resumen del mes (R3, R4 y R5 de docs/DOMINIO.md) por `analizar`, con tablas hechas a mano."""

from datetime import date

import pandas as pd
import pytest

from reporte.nucleo import analizar
from reporte.nucleo.tipos import Transacciones


def _transacciones(
    filas: list[tuple[str, float, str]],
    mes: date = date(2026, 9, 1),
    avisos: tuple[str, ...] = (),
) -> Transacciones:
    """Tabla mínima con el tipado que deja la lectura: `fecha` datetime64 y `monto` float."""
    tabla = pd.DataFrame(
        {
            "fecha": pd.to_datetime([f for f, _, _ in filas]),
            "monto": [float(m) for _, m, _ in filas],
            "categoria": [c for _, _, c in filas],
        }
    )
    return Transacciones(tabla=tabla, mes=mes, avisos=avisos)


def _montos(*montos: float) -> Transacciones:
    return _transacciones([("2026-09-01 10:00:00", m, "Comida") for m in montos])


def test_tres_transacciones_dan_total_numero_y_ticket_promedio() -> None:
    resumen = analizar(_montos(100.00, 250.50, 49.50)).resumen

    assert resumen.total == 400.00
    assert resumen.numero == 3
    assert resumen.ticket_promedio == pytest.approx(133.3333333333)


def test_una_sola_transaccion_a_mitad_de_mes_produce_el_resumen_del_mes() -> None:
    analisis = analizar(_transacciones([("2026-09-17 10:00:00", 87.25, "Comida")]))

    resumen = analisis.resumen
    assert (resumen.total, resumen.numero, resumen.ticket_promedio) == (87.25, 1, 87.25)
    assert analisis.mes == date(2026, 9, 1)


def test_las_cifras_del_resumen_son_tipos_nativos() -> None:
    resumen = analizar(_montos(100.00, 250.50)).resumen

    assert type(resumen.total) is float
    assert type(resumen.numero) is int
    assert type(resumen.ticket_promedio) is float
    assert type(resumen.monto_dia_mayor_gasto) is float
    assert type(resumen.gasto_variable) is float
    assert type(resumen.proporcion_variable) is float


def test_dia_con_mas_gasto_aunque_no_tenga_la_compra_mas_cara() -> None:
    resumen = analizar(
        _transacciones(
            [
                ("2026-09-03 08:00:00", 300, "Comida"),
                ("2026-09-10 09:00:00", 500, "Comida"),
                ("2026-09-03 21:30:00", 300, "Comida"),
            ]
        )
    ).resumen

    assert resumen.dia_mayor_gasto == date(2026, 9, 3)
    assert resumen.monto_dia_mayor_gasto == 600


def test_el_dia_de_mayor_gasto_es_una_fecha_y_no_una_marca_de_tiempo() -> None:
    resumen = analizar(_transacciones([("2026-09-03 08:15:00", 10, "Comida")])).resumen

    assert type(resumen.dia_mayor_gasto) is date


def test_empate_entre_dos_dias_gana_el_mas_temprano_aunque_vaya_despues_en_el_archivo() -> None:
    resumen = analizar(
        _transacciones(
            [
                ("2026-09-12 12:00:00", 400, "Comida"),
                ("2026-09-20 12:00:00", 100, "Comida"),
                ("2026-09-05 12:00:00", 400, "Comida"),
            ]
        )
    ).resumen

    assert resumen.dia_mayor_gasto == date(2026, 9, 5)
    assert resumen.monto_dia_mayor_gasto == 400


def test_dos_dias_que_solo_difieren_por_el_error_de_la_suma_binaria_empatan() -> None:
    assert 10.00 + 250.96 != 260.96

    resumen = analizar(
        _transacciones(
            [
                ("2026-09-12 09:00:00", 10.00, "Comida"),
                ("2026-09-12 18:00:00", 250.96, "Comida"),
                ("2026-09-05 12:00:00", 260.96, "Comida"),
            ]
        )
    ).resumen

    assert resumen.dia_mayor_gasto == date(2026, 9, 5)
    assert resumen.monto_dia_mayor_gasto == pytest.approx(260.96)


def test_una_diferencia_real_menor_a_un_centavo_no_es_empate() -> None:
    resumen = analizar(
        _transacciones(
            [
                ("2026-09-05 12:00:00", 400.00, "Comida"),
                ("2026-09-12 12:00:00", 400.004, "Comida"),
            ]
        )
    ).resumen

    assert resumen.dia_mayor_gasto == date(2026, 9, 12)
    assert resumen.monto_dia_mayor_gasto == pytest.approx(400.004)


def test_cargos_fijos_y_viajes_fuera_del_variable() -> None:
    resumen = analizar(
        _transacciones(
            [
                ("2026-09-01 10:00:00", 600, "Comida"),
                ("2026-09-02 10:00:00", 300, "Vivienda"),
                ("2026-09-03 10:00:00", 50, "Suscripciones"),
                ("2026-09-04 10:00:00", 50, "Viajes"),
            ]
        )
    ).resumen

    assert resumen.gasto_variable == 600
    assert resumen.proporcion_variable == pytest.approx(0.6)


def test_servicios_tambien_queda_fuera_del_variable() -> None:
    resumen = analizar(
        _transacciones(
            [("2026-09-01 10:00:00", 100, "Comida"), ("2026-09-02 10:00:00", 100, "Servicios")]
        )
    ).resumen

    assert resumen.gasto_variable == 100
    assert resumen.proporcion_variable == 0.5


def test_categoria_desconocida_cuenta_como_variable() -> None:
    resumen = analizar(
        _transacciones(
            [("2026-09-01 10:00:00", 100, "Comida"), ("2026-09-02 10:00:00", 100, "Mascotas")]
        )
    ).resumen

    assert resumen.gasto_variable == 200
    assert resumen.proporcion_variable == 1.0


def test_la_categoria_se_compara_tal_como_viene() -> None:
    resumen = analizar(
        _transacciones(
            [("2026-09-01 10:00:00", 100, "vivienda"), ("2026-09-02 10:00:00", 100, "Vivienda ")]
        )
    ).resumen

    assert resumen.gasto_variable == 200


@pytest.mark.parametrize(
    ("mes", "ultimo_dia"),
    [
        (date(2028, 2, 1), date(2028, 2, 29)),
        (date(2026, 2, 1), date(2026, 2, 28)),
        (date(2026, 9, 1), date(2026, 9, 30)),
        (date(2026, 12, 1), date(2026, 12, 31)),
    ],
)
def test_el_analisis_trae_el_mes_y_su_ultimo_dia_del_calendario(
    mes: date, ultimo_dia: date
) -> None:
    transacciones = _transacciones([(f"{mes:%Y-%m-%d} 10:00:00", 10, "Comida")], mes=mes)

    analisis = analizar(transacciones)

    assert (analisis.mes, analisis.ultimo_dia) == (mes, ultimo_dia)


def test_los_avisos_llegan_sin_cambiar_y_en_el_mismo_orden() -> None:
    avisos = ("segundo aviso", "primer aviso", "tercer aviso")

    analisis = analizar(_transacciones([("2026-09-01 10:00:00", 10, "Comida")], avisos=avisos))

    assert analisis.avisos == avisos


def test_el_analisis_y_su_resumen_son_inmutables() -> None:
    analisis = analizar(_montos(10))

    with pytest.raises(AttributeError):
        analisis.mes = date(2026, 1, 1)  # type: ignore[misc]
    with pytest.raises(AttributeError):
        analisis.resumen.total = 0.0  # type: ignore[misc]
