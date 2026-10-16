"""Lo que `leer_transacciones` acepta o rechaza del archivo como tal: ruta, codificación, columnas,
archivo sin transacciones y forma del resultado (R1 de docs/DOMINIO.md)."""

import pathlib
from datetime import date

import pandas as pd
import pytest
from _csv_de_prueba import COLUMNAS, escribir, escribir_lineas, fila, linea

from reporte.datos import ErrorDeEntrada, leer_transacciones
from reporte.nucleo.tipos import Transacciones

FIXTURES = pathlib.Path(__file__).parent / "fixtures"


def test_una_ruta_inexistente_se_rechaza_nombrando_la_ruta(tmp_path: pathlib.Path) -> None:
    with pytest.raises(ErrorDeEntrada) as error:
        leer_transacciones(tmp_path / "no-existe.csv")

    assert "no-existe.csv" in str(error.value)


def test_una_carpeta_se_rechaza_nombrando_la_ruta(tmp_path: pathlib.Path) -> None:
    carpeta = tmp_path / "carpeta-de-datos"
    carpeta.mkdir()

    with pytest.raises(ErrorDeEntrada) as error:
        leer_transacciones(carpeta)

    assert "carpeta-de-datos" in str(error.value)


def test_un_archivo_de_cero_bytes_no_tiene_transacciones(tmp_path: pathlib.Path) -> None:
    ruta = tmp_path / "vacio.csv"
    ruta.write_bytes(b"")

    with pytest.raises(ErrorDeEntrada) as error:
        leer_transacciones(ruta)

    assert str(error.value) == "El archivo no tiene transacciones"


def test_un_archivo_con_solo_el_encabezado_no_tiene_transacciones(tmp_path: pathlib.Path) -> None:
    ruta = escribir(tmp_path, [])

    with pytest.raises(ErrorDeEntrada) as error:
        leer_transacciones(ruta)

    assert str(error.value) == "El archivo no tiene transacciones"


def test_un_csv_con_bom_y_acentos_conserva_ambos_y_la_primera_columna(
    tmp_path: pathlib.Path,
) -> None:
    ruta = tmp_path / "bom.csv"
    sin_bom = escribir(tmp_path, [fila(concepto="Panadería Ñandú")])
    ruta.write_bytes(b"\xef\xbb\xbf" + sin_bom.read_bytes())

    resultado = leer_transacciones(ruta)

    assert resultado.tabla.columns[0] == "id_transaccion"
    assert resultado.tabla["concepto"].tolist() == ["Panadería Ñandú"]


def test_un_csv_sin_bom_conserva_acentos_y_la_ene(tmp_path: pathlib.Path) -> None:
    ruta = escribir(tmp_path, [fila(concepto="Panadería Ñandú")])

    resultado = leer_transacciones(ruta)

    assert resultado.tabla["concepto"].tolist() == ["Panadería Ñandú"]


def test_un_csv_en_latin_1_se_rechaza_diciendo_que_no_es_utf_8(tmp_path: pathlib.Path) -> None:
    ruta = tmp_path / "latin1.csv"
    sin_codificar = escribir(tmp_path, [fila(concepto="Panadería Ñandú")])
    ruta.write_bytes(sin_codificar.read_text(encoding="utf-8").encode("latin-1"))

    with pytest.raises(ErrorDeEntrada) as error:
        leer_transacciones(ruta)

    assert "UTF-8" in str(error.value)


def test_un_csv_con_comillas_mal_cerradas_se_rechaza_en_lugar_de_leerse_mal(
    tmp_path: pathlib.Path,
) -> None:
    ruta = tmp_path / "comillas.csv"
    ruta.write_text(
        ",".join(COLUMNAS) + '\nTX000001,2026-09-15 10:00:00,100.00,"Café"x,Comida,c,z,19,-99\n',
        encoding="utf-8",
    )

    with pytest.raises(ErrorDeEntrada):
        leer_transacciones(ruta)


def test_falta_una_columna_y_el_rechazo_la_nombra(tmp_path: pathlib.Path) -> None:
    columnas = [c for c in COLUMNAS if c != "zona"]
    ruta = escribir(tmp_path, [fila()], columnas)

    with pytest.raises(ErrorDeEntrada) as error:
        leer_transacciones(ruta)

    assert "zona" in str(error.value)


def test_el_rechazo_nombra_cada_columna_faltante(tmp_path: pathlib.Path) -> None:
    columnas = [c for c in COLUMNAS if c not in {"zona", "cuenta"}]
    ruta = escribir(tmp_path, [fila()], columnas)

    with pytest.raises(ErrorDeEntrada) as error:
        leer_transacciones(ruta)

    assert "zona" in str(error.value)
    assert "cuenta" in str(error.value)


def test_un_encabezado_con_coma_final_se_rechaza_diciendo_que_hay_una_columna_sin_nombre(
    tmp_path: pathlib.Path,
) -> None:
    ruta = escribir_lineas(tmp_path, [",".join(COLUMNAS) + ",", linea() + ","])

    with pytest.raises(ErrorDeEntrada) as error:
        leer_transacciones(ruta)

    assert "sin nombre" in str(error.value)


def test_sobra_una_columna_y_el_rechazo_la_nombra(tmp_path: pathlib.Path) -> None:
    ruta = escribir(tmp_path, [fila(notas="regalo")], [*COLUMNAS, "notas"])

    with pytest.raises(ErrorDeEntrada) as error:
        leer_transacciones(ruta)

    assert "notas" in str(error.value)


def test_una_columna_repetida_se_rechaza_nombrandola(tmp_path: pathlib.Path) -> None:
    ruta = escribir(tmp_path, [fila()], [*COLUMNAS, "zona"])

    with pytest.raises(ErrorDeEntrada) as error:
        leer_transacciones(ruta)

    assert "zona" in str(error.value)


def test_las_columnas_en_otro_orden_se_aceptan_y_cada_valor_sigue_a_su_columna(
    tmp_path: pathlib.Path,
) -> None:
    ruta = escribir(tmp_path, [fila(monto="42.50", concepto="Café")], list(reversed(COLUMNAS)))

    resultado = leer_transacciones(ruta)

    assert list(resultado.tabla.columns) == COLUMNAS
    assert resultado.tabla["monto"].tolist() == [42.5]
    assert resultado.tabla["concepto"].tolist() == ["Café"]


def test_una_muestra_con_la_forma_del_generador_sale_tipada_y_sin_avisos() -> None:
    resultado = leer_transacciones(FIXTURES / "muestra_generador.csv")

    assert isinstance(resultado, Transacciones)
    tabla = resultado.tabla
    assert list(tabla.columns) == COLUMNAS
    assert pd.api.types.is_datetime64_any_dtype(tabla["fecha"])
    for numerica in ("monto", "latitud", "longitud"):
        assert pd.api.types.is_float_dtype(tabla[numerica]), numerica
    for texto in ("id_transaccion", "concepto", "categoria", "cuenta", "zona"):
        assert tabla[texto].map(type).eq(str).all(), texto
    assert tabla["id_transaccion"].tolist() == [f"TX{n:06d}" for n in range(1, 9)]
    assert tabla["zona"].iloc[0] == "Coyoacán, CDMX"
    assert tabla["monto"].iloc[5] == 69.70
    assert resultado.mes == date(2026, 9, 1)
    assert resultado.avisos == ()


def test_un_monto_con_mas_de_dos_decimales_se_conserva_entero(tmp_path: pathlib.Path) -> None:
    ruta = escribir(tmp_path, [fila(monto="10.005")])

    resultado = leer_transacciones(ruta)

    assert resultado.tabla["monto"].tolist() == [10.005]
