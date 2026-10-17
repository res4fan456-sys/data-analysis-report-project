"""La CLI `python -m reporte CSV [-o SALIDA]` por `main([...])`: dónde queda la página, qué lee el
autor cuando algo falla y qué código de salida recibe."""

import os
import pathlib

import pytest
from _csv_del_cli import escribir_csv

from reporte.app import main
from reporte.presentacion import formatear_monto

CIERRE = "Aquí queda la línea del respeto"


def _paginas(carpeta: pathlib.Path) -> list[pathlib.Path]:
    return sorted(carpeta.rglob("*.html"))


def test_la_pagina_queda_junto_al_csv_con_el_mes_de_los_datos(
    tmp_path: pathlib.Path, capsys: pytest.CaptureFixture[str]
) -> None:
    csv = escribir_csv(tmp_path / "datos" / "septiembre.csv")

    codigo = main([str(csv)])

    pagina = tmp_path / "datos" / "reporte_2026-09.html"
    assert codigo == 0
    assert _paginas(tmp_path) == [pagina]
    html = pagina.read_text(encoding="utf-8")
    assert formatear_monto(350.5) in html
    assert html.rstrip().endswith("</html>")
    assert str(pagina) in capsys.readouterr().out


def test_el_nombre_de_la_pagina_sigue_el_mes_de_los_datos_sea_cual_sea(
    tmp_path: pathlib.Path,
) -> None:
    csv = escribir_csv(tmp_path / "mes.csv", fecha="2028-02-29 10:00:00")

    codigo = main([str(csv)])

    assert codigo == 0
    assert _paginas(tmp_path) == [tmp_path / "reporte_2028-02.html"]


def test_una_pagina_anterior_se_reemplaza(tmp_path: pathlib.Path) -> None:
    csv = escribir_csv(tmp_path / "septiembre.csv")
    anterior = tmp_path / "reporte_2026-09.html"
    anterior.write_text("pagina vieja", encoding="utf-8")

    codigo = main([str(csv)])

    contenido = anterior.read_text(encoding="utf-8")
    assert codigo == 0
    assert CIERRE in contenido
    assert "pagina vieja" not in contenido


@pytest.mark.parametrize("opcion", ["-o", "--salida"])
def test_la_salida_elegida_crea_las_carpetas_que_faltan(
    tmp_path: pathlib.Path, opcion: str
) -> None:
    csv = escribir_csv(tmp_path / "transacciones.csv")
    destino = tmp_path / "informes" / "2026" / "sept.html"

    codigo = main([str(csv), opcion, str(destino)])

    assert codigo == 0
    assert CIERRE in destino.read_text(encoding="utf-8")
    assert _paginas(tmp_path) == [destino]


def test_un_csv_con_columna_de_mas_se_rechaza_nombrandola_sin_traza_y_sin_pagina(
    tmp_path: pathlib.Path, capsys: pytest.CaptureFixture[str]
) -> None:
    csv = escribir_csv(tmp_path / "transacciones.csv", columnas_extra=("notas",))

    codigo = main([str(csv)])

    salida = capsys.readouterr()
    assert codigo == 1
    assert "notas" in salida.err
    assert "Traceback" not in salida.err
    assert _paginas(tmp_path) == []


def test_un_csv_inexistente_se_rechaza_nombrando_la_ruta(
    tmp_path: pathlib.Path, capsys: pytest.CaptureFixture[str]
) -> None:
    codigo = main([str(tmp_path / "no-existe.csv")])

    salida = capsys.readouterr()
    assert codigo == 1
    assert "no-existe.csv" in salida.err
    assert "Traceback" not in salida.err
    assert _paginas(tmp_path) == []


def test_una_salida_que_es_una_carpeta_da_error_con_la_ruta_y_sin_traza(
    tmp_path: pathlib.Path, capsys: pytest.CaptureFixture[str]
) -> None:
    csv = escribir_csv(tmp_path / "transacciones.csv")
    carpeta = tmp_path / "carpeta-de-informes"
    carpeta.mkdir()

    codigo = main([str(csv), "-o", str(carpeta)])

    salida = capsys.readouterr()
    assert codigo == 1
    assert str(carpeta) in salida.err
    assert "Traceback" not in salida.err
    assert list(carpeta.iterdir()) == []
    assert _paginas(tmp_path) == []


def test_un_csv_sin_permiso_de_lectura_da_error_con_la_ruta_sin_traza_y_sin_pagina(
    tmp_path: pathlib.Path, capsys: pytest.CaptureFixture[str]
) -> None:
    csv = escribir_csv(tmp_path / "privado.csv")
    csv.chmod(0)
    if os.access(csv, os.R_OK):
        pytest.skip("este usuario lee archivos sin permiso (p. ej. root)")

    codigo = main([str(csv)])

    salida = capsys.readouterr()
    assert codigo == 1
    assert "privado.csv" in salida.err
    assert "Traceback" not in salida.err
    assert _paginas(tmp_path) == []


def _linea_de_uso(texto: str) -> str:
    return next(linea for linea in texto.splitlines() if linea.startswith("usage:"))


@pytest.mark.parametrize("argumentos", [[], ["transacciones.csv", "--no-existe"]])
def test_un_uso_incorrecto_muestra_la_linea_de_uso_y_sale_con_codigo_2(
    argumentos: list[str], capsys: pytest.CaptureFixture[str]
) -> None:
    with pytest.raises(SystemExit):
        main(["-h"])
    uso = _linea_de_uso(capsys.readouterr().out)

    with pytest.raises(SystemExit) as salida:
        main(argumentos)

    assert salida.value.code == 2
    assert uso in capsys.readouterr().err
