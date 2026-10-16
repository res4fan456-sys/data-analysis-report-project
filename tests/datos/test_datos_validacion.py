"""Lo que `leer_transacciones` rechaza o avisa fila por fila: formato de cada campo, número de fila,
identificadores, un solo mes y coordenadas fuera de México (R2 y R3 de docs/DOMINIO.md)."""

import pathlib
import re
from datetime import date

import pytest
from _csv_de_prueba import COLUMNAS, escribir, escribir_lineas, fila, linea

from reporte.datos import ErrorDeEntrada, leer_transacciones


def _rechazo(ruta: pathlib.Path) -> str:
    with pytest.raises(ErrorDeEntrada) as error:
        leer_transacciones(ruta)
    return str(error.value)


def _nombra_la_fila(mensaje: str, numero: int) -> bool:
    return re.search(rf"fila\s+{numero}(?!\d)", mensaje, re.IGNORECASE) is not None


@pytest.mark.parametrize(
    "fecha",
    [
        "15/09/2026 10:00",
        "2026-09-15",
        "2026-09-15T10:00:00",
        "2026-9-1 10:00:00",
        "2026-09-31 10:00:00",
        "2026-09-15 24:00:00",
    ],
)
def test_una_fecha_con_otro_formato_o_inexistente_se_rechaza_nombrando_fila_y_campo(
    tmp_path: pathlib.Path, fecha: str
) -> None:
    ruta = escribir(tmp_path, [fila(1), fila(2, fecha=fecha)])

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 3)
    assert "fecha" in mensaje


@pytest.mark.parametrize("monto", ["0", "-12.50", "abc", "inf", "-inf", "nan", "1,234.50"])
def test_un_monto_cero_negativo_no_numerico_o_no_finito_se_rechaza_nombrando_fila_y_campo(
    tmp_path: pathlib.Path, monto: str
) -> None:
    ruta = escribir(tmp_path, [fila(1), fila(2, monto=monto)])

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 3)
    assert "monto" in mensaje


@pytest.mark.parametrize("campo", ["latitud", "longitud"])
@pytest.mark.parametrize("valor", ["norte", "inf", "nan"])
def test_una_coordenada_no_numerica_o_no_finita_se_rechaza_nombrando_fila_y_campo(
    tmp_path: pathlib.Path, campo: str, valor: str
) -> None:
    ruta = escribir(tmp_path, [fila(1), fila(2, **{campo: valor})])

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 3)
    assert campo in mensaje


@pytest.mark.parametrize("campo", [c for c in COLUMNAS if c != "id_transaccion"])
@pytest.mark.parametrize("vacio", ["", "   "])
def test_un_campo_vacio_o_de_espacios_se_rechaza_nombrando_fila_y_campo(
    tmp_path: pathlib.Path, campo: str, vacio: str
) -> None:
    ruta = escribir(tmp_path, [fila(1), fila(2, **{campo: vacio})])

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 3)
    assert campo in mensaje


def test_un_id_vacio_se_rechaza_nombrando_fila_y_campo(tmp_path: pathlib.Path) -> None:
    ruta = escribir(tmp_path, [fila(1), fila(2, id_transaccion=" ")])

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 3)
    assert "id_transaccion" in mensaje


def test_una_fila_con_campos_de_menos_se_rechaza_nombrando_el_campo_que_falta(
    tmp_path: pathlib.Path,
) -> None:
    ruta = escribir_lineas(
        tmp_path,
        [
            ",".join(COLUMNAS),
            linea(),
            "TX000002,2026-09-15 10:00:00,100.00,Café,Comida,Tarjeta",
        ],
    )

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 3)
    assert "zona" in mensaje


def test_una_fila_con_campos_de_mas_se_rechaza_nombrando_la_fila(tmp_path: pathlib.Path) -> None:
    ruta = escribir_lineas(
        tmp_path,
        [",".join(COLUMNAS), linea(), linea(id_transaccion="TX000002") + ",sobra"],
    )

    assert _nombra_la_fila(_rechazo(ruta), 3)


def test_una_primera_fila_con_campos_de_mas_tambien_se_rechaza_nombrando_la_fila(
    tmp_path: pathlib.Path,
) -> None:
    ruta = escribir_lineas(tmp_path, [",".join(COLUMNAS), linea() + ",sobra", linea()])

    assert _nombra_la_fila(_rechazo(ruta), 2)


def test_la_primera_fila_invalida_es_la_que_se_nombra(tmp_path: pathlib.Path) -> None:
    filas = [fila(n) for n in range(1, 9)]
    filas[2] = fila(3, monto="abc")
    filas[6] = fila(7, fecha="ayer")
    ruta = escribir(tmp_path, filas)

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 4)
    assert "monto" in mensaje
    assert not _nombra_la_fila(mensaje, 8)


def test_la_menor_fila_invalida_gana_aunque_su_campo_venga_despues_en_el_contrato(
    tmp_path: pathlib.Path,
) -> None:
    ruta = escribir(tmp_path, [fila(1, longitud="oeste"), fila(2, fecha="ayer")])

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 2)
    assert "longitud" in mensaje


def test_en_una_fila_con_varios_fallos_se_nombra_el_primer_campo_del_contrato(
    tmp_path: pathlib.Path,
) -> None:
    ruta = escribir(tmp_path, [fila(1, monto="abc", fecha="ayer", latitud="norte")])

    mensaje = _rechazo(ruta)

    assert "fecha" in mensaje
    assert "monto" not in mensaje
    assert "latitud" not in mensaje


def test_una_fila_con_campos_de_mas_gana_a_sus_otros_fallos(tmp_path: pathlib.Path) -> None:
    ruta = escribir_lineas(tmp_path, [",".join(COLUMNAS), linea(fecha="ayer") + ",sobra"])

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 2)
    assert "fecha" not in mensaje


def test_un_id_repetido_se_rechaza_nombrando_la_fila_donde_reaparece_y_el_id(
    tmp_path: pathlib.Path,
) -> None:
    filas = [fila(1), fila(2), fila(3), fila(4), fila(5, id_transaccion="TX000001")]
    ruta = escribir(tmp_path, filas)

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 6)
    assert "TX000001" in mensaje


def test_una_fila_invalida_se_rechaza_antes_que_un_id_repetido(tmp_path: pathlib.Path) -> None:
    filas = [fila(1), fila(1, monto="abc")]
    ruta = escribir(tmp_path, filas)

    mensaje = _rechazo(ruta)

    assert "monto" in mensaje


def test_dos_meses_se_rechazan_nombrando_cada_mes_en_orden_cronologico(
    tmp_path: pathlib.Path,
) -> None:
    filas = [
        fila(1, fecha="2026-10-01 08:00:00"),
        fila(2, fecha="2026-09-30 23:59:59"),
        fila(3, fecha="2026-09-15 10:00:00"),
    ]
    ruta = escribir(tmp_path, filas)

    mensaje = _rechazo(ruta)

    assert "2026-09" in mensaje
    assert "2026-10" in mensaje
    assert mensaje.index("2026-09") < mensaje.index("2026-10")


def test_el_mismo_mes_de_distinto_anio_cuenta_como_otro_mes(tmp_path: pathlib.Path) -> None:
    filas = [fila(1, fecha="2026-09-15 10:00:00"), fila(2, fecha="2025-09-15 10:00:00")]
    ruta = escribir(tmp_path, filas)

    mensaje = _rechazo(ruta)

    assert "2025-09" in mensaje
    assert "2026-09" in mensaje


def test_febrero_bisiesto_completo_se_acepta_con_su_mes(tmp_path: pathlib.Path) -> None:
    filas = [fila(d, fecha=f"2028-02-{d:02d} 12:00:00") for d in range(1, 30)]
    ruta = escribir(tmp_path, filas)

    resultado = leer_transacciones(ruta)

    assert resultado.mes == date(2028, 2, 1)
    assert len(resultado.tabla) == 29


def test_el_orden_del_archivo_se_conserva(tmp_path: pathlib.Path) -> None:
    filas = [
        fila(3, fecha="2026-09-20 10:00:00"),
        fila(1, fecha="2026-09-02 10:00:00"),
        fila(2, fecha="2026-09-11 10:00:00"),
    ]
    ruta = escribir(tmp_path, filas)

    resultado = leer_transacciones(ruta)

    assert resultado.tabla["id_transaccion"].tolist() == ["TX000003", "TX000001", "TX000002"]
    assert resultado.mes == date(2026, 9, 1)


def _cifras(texto: str) -> list[int]:
    return [int(c) for c in re.findall(r"(?<![\d.-])\d+(?![\d.])", texto)]


def test_las_coordenadas_fuera_de_mexico_se_aceptan_con_un_solo_aviso_que_cuenta_las_filas(
    tmp_path: pathlib.Path,
) -> None:
    filas = [
        fila(1),
        fila(2, latitud="40.4168", longitud="-3.7038"),
        fila(3, latitud="40.4168", longitud="-3.7038"),
    ]
    ruta = escribir(tmp_path, filas)

    resultado = leer_transacciones(ruta)

    assert len(resultado.tabla) == 3
    assert len(resultado.avisos) == 1
    assert _cifras(resultado.avisos[0]) == [2]


def test_una_fila_con_latitud_y_longitud_fuera_cuenta_una_sola_vez(tmp_path: pathlib.Path) -> None:
    ruta = escribir(tmp_path, [fila(1, latitud="60", longitud="10")])

    resultado = leer_transacciones(ruta)

    assert _cifras(resultado.avisos[0]) == [1]


@pytest.mark.parametrize(
    ("latitud", "longitud"),
    [("14", "-99"), ("33", "-99"), ("20", "-119"), ("20", "-86"), ("14", "-86"), ("33", "-119")],
)
def test_las_coordenadas_en_el_limite_se_aceptan_sin_avisos(
    tmp_path: pathlib.Path, latitud: str, longitud: str
) -> None:
    ruta = escribir(tmp_path, [fila(1, latitud=latitud, longitud=longitud)])

    assert leer_transacciones(ruta).avisos == ()


@pytest.mark.parametrize(
    ("latitud", "longitud"),
    [("13.999999", "-99"), ("33.000001", "-99"), ("20", "-119.000001"), ("20", "-85.999999")],
)
def test_las_coordenadas_apenas_fuera_del_limite_traen_aviso(
    tmp_path: pathlib.Path, latitud: str, longitud: str
) -> None:
    ruta = escribir(tmp_path, [fila(1, latitud=latitud, longitud=longitud)])

    assert len(leer_transacciones(ruta).avisos) == 1


def test_una_linea_en_blanco_al_final_no_es_una_transaccion(tmp_path: pathlib.Path) -> None:
    ruta = escribir_lineas(tmp_path, [",".join(COLUMNAS), linea(), ""])

    resultado = leer_transacciones(ruta)

    assert resultado.tabla["id_transaccion"].tolist() == ["TX000001"]
    assert list(resultado.tabla.index) == [0]


def test_un_encabezado_seguido_de_lineas_en_blanco_no_tiene_transacciones(
    tmp_path: pathlib.Path,
) -> None:
    ruta = escribir_lineas(tmp_path, [",".join(COLUMNAS), "", ""])

    assert _rechazo(ruta) == "El archivo no tiene transacciones"


def test_una_linea_en_blanco_en_medio_no_corre_la_numeracion_de_las_filas(
    tmp_path: pathlib.Path,
) -> None:
    ruta = escribir_lineas(
        tmp_path,
        [",".join(COLUMNAS), linea(), "", linea(id_transaccion="TX000002", monto="abc")],
    )

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 4)
    assert "monto" in mensaje


def test_un_id_repetido_despues_de_una_linea_en_blanco_nombra_su_fila_de_hoja(
    tmp_path: pathlib.Path,
) -> None:
    ruta = escribir_lineas(tmp_path, [",".join(COLUMNAS), linea(), "", linea()])

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 4)
    assert "TX000001" in mensaje


def test_una_linea_de_solo_espacios_si_es_una_fila_y_se_rechaza(tmp_path: pathlib.Path) -> None:
    ruta = escribir_lineas(tmp_path, [",".join(COLUMNAS), linea(), "   "])

    mensaje = _rechazo(ruta)

    assert _nombra_la_fila(mensaje, 3)
    assert "id_transaccion" in mensaje


def test_una_linea_en_blanco_en_medio_se_ignora_y_la_tabla_queda_contigua(
    tmp_path: pathlib.Path,
) -> None:
    ruta = escribir_lineas(
        tmp_path, [",".join(COLUMNAS), linea(), "", linea(id_transaccion="TX000002")]
    )

    resultado = leer_transacciones(ruta)

    assert resultado.tabla["id_transaccion"].tolist() == ["TX000001", "TX000002"]
    assert list(resultado.tabla.index) == [0, 1]
