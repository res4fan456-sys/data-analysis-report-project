"""El entregable de la Fase 1 de punta a punta: el CSV del generador real pasa por `python -m reporte`
como lo corre el autor, y la página resultante cumple R15, R16 y R17 de docs/DOMINIO.md."""

from __future__ import annotations

import csv
import math
import os
import subprocess
import sys
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path

import pytest

from reporte.presentacion import (
    formatear_entero,
    formatear_monto,
    referencias_de_red,
)

pytestmark = pytest.mark.sistema

RAIZ = Path(__file__).resolve().parents[2]
TIEMPO_MAXIMO_SEGUNDOS = 300
CIERRE = "Aquí queda la línea del respeto"
LIMITE_DE_TAMANO = 10 * 1024 * 1024
NO_VISIBLES = {"head", "script", "style", "template"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "wbr"}


@dataclass(frozen=True)
class Corrida:
    codigo: int
    salida: str
    errores: str


def _correr(modulo: str, *argumentos: str) -> Corrida:
    proceso = subprocess.run(
        [sys.executable, "-m", modulo, *argumentos],
        cwd=RAIZ,
        capture_output=True,
        check=False,
        timeout=TIEMPO_MAXIMO_SEGUNDOS,
        env={**os.environ, "PYTHONIOENCODING": "utf-8"},
    )
    return Corrida(
        proceso.returncode,
        proceso.stdout.decode("utf-8", errors="replace"),
        proceso.stderr.decode("utf-8", errors="replace"),
    )


class _TextoVisible(HTMLParser):
    """Nodos de texto fuera de `head`, `script`, `style`, `template` y de los elementos con `hidden`."""

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.textos: list[str] = []
        self._pila: list[tuple[str, bool]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag not in VOID:
            oculto = tag in NO_VISIBLES or any(nombre == "hidden" for nombre, _ in attrs)
            self._pila.append((tag, oculto))

    def handle_endtag(self, tag: str) -> None:
        while self._pila:
            if self._pila.pop()[0] == tag:
                break

    def handle_data(self, data: str) -> None:
        if data.strip() and not any(oculto for _, oculto in self._pila):
            self.textos.append(data.strip())


def _textos_visibles(html: str) -> list[str]:
    lector = _TextoVisible()
    lector.feed(html)
    lector.close()
    return lector.textos


def _generar(carpeta: Path, *argumentos: str) -> Path:
    ruta = carpeta / "transacciones.csv"
    corrida = _correr("generador", *argumentos, "-o", str(ruta))
    assert corrida.codigo == 0, corrida.errores
    return ruta


@pytest.fixture(scope="module")
def septiembre(tmp_path_factory: pytest.TempPathFactory) -> tuple[Path, Corrida]:
    carpeta = tmp_path_factory.mktemp("septiembre")
    ruta = _generar(carpeta, "-n", "20000", "--mes", "2026-09", "--semilla", "42")
    return ruta, _correr("reporte", str(ruta))


def test_el_comando_escribe_la_pagina_junto_al_csv_y_la_nombra(
    septiembre: tuple[Path, Corrida],
) -> None:
    csv_generado, corrida = septiembre
    pagina = csv_generado.parent / "reporte_2026-09.html"

    assert corrida.codigo == 0, corrida.errores
    assert pagina.is_file()
    assert str(pagina) in corrida.salida


def test_la_pagina_no_tiene_referencias_de_red_cierra_con_el_mensaje_y_pesa_menos_de_10_mb(
    septiembre: tuple[Path, Corrida],
) -> None:
    pagina = septiembre[0].parent / "reporte_2026-09.html"
    html = pagina.read_text(encoding="utf-8")

    assert referencias_de_red(html) == ()
    assert _textos_visibles(html)[-1] == CIERRE
    assert pagina.stat().st_size < LIMITE_DE_TAMANO


def test_total_numero_y_ticket_promedio_visibles_son_los_que_da_sumar_el_csv(
    septiembre: tuple[Path, Corrida],
) -> None:
    csv_generado = septiembre[0]
    with csv_generado.open(encoding="utf-8", newline="") as archivo:
        montos = [float(fila["monto"]) for fila in csv.DictReader(archivo)]
    total = math.fsum(montos)
    visibles = _textos_visibles((csv_generado.parent / "reporte_2026-09.html").read_text("utf-8"))

    assert len(montos) == 20000
    for esperado in (
        formatear_monto(total),
        formatear_entero(len(montos)),
        formatear_monto(total / len(montos)),
    ):
        assert any(esperado in nodo for nodo in visibles), f"falta {esperado!r} en la página"


def test_un_csv_con_columna_de_mas_da_codigo_1_nombrandola_y_sin_pagina(tmp_path: Path) -> None:
    original = _generar(tmp_path, "-n", "50", "--mes", "2026-09", "--semilla", "7")
    lineas = original.read_text(encoding="utf-8").splitlines()
    con_notas = tmp_path / "con_notas.csv"
    con_notas.write_text(
        "\n".join([f"{lineas[0]},notas", *(f"{linea},x" for linea in lineas[1:])]) + "\n",
        encoding="utf-8",
    )

    corrida = _correr("reporte", str(con_notas))

    assert corrida.codigo == 1
    assert "notas" in corrida.errores
    assert "Traceback" not in corrida.errores
    assert not list(tmp_path.glob("*.html"))
