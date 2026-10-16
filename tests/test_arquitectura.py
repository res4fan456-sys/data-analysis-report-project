"""La matriz «Puede importar de» de docs/ARQUITECTURA.md como test: ninguna capa de `src/reporte`
importa de otra capa o librería que la matriz no le permite (CLAUDE.md, Reglas innegociables de
arquitectura 1 y 2)."""

import ast
import pathlib
import sys

import pytest

RAIZ = pathlib.Path(__file__).resolve().parents[1] / "src" / "reporte"

IO_PROHIBIDO = {"pathlib", "os", "io", "shutil", "tempfile", "glob", "socket", "urllib", "http"}
# Con `importlib`, `builtins` y `__import__` el núcleo podría llegar a esos módulos sin importarlos.
ACCESO_INDIRECTO = {"importlib", "builtins"}
STDLIB = set(sys.stdlib_module_names)

# capa -> (librerías externas permitidas, prefijos internos permitidos). Una capa ausente de la tabla
# (`app`, `__main__` y el `__init__.py` raíz) puede importar de todas.
MATRIZ: dict[str, tuple[set[str], tuple[str, ...]]] = {
    "nucleo": ((STDLIB - IO_PROHIBIDO - ACCESO_INDIRECTO) | {"pandas"}, ("reporte.nucleo",)),
    "datos": (STDLIB | {"pandas"}, ("reporte.datos", "reporte.nucleo.tipos")),
    "presentacion": (STDLIB | {"jinja2"}, ("reporte.presentacion", "reporte.nucleo")),
}
CAPAS_SIN_LLAMADAS_PROHIBIDAS = {"nucleo"}
LLAMADAS_PROHIBIDAS = {"open", "__import__"}


def _paquete(archivo: pathlib.Path, raiz: pathlib.Path) -> str:
    """Paquete que contiene al archivo (también para `__init__.py`): ancla de los imports relativos."""
    partes = [raiz.name, *archivo.relative_to(raiz).with_suffix("").parts]
    return ".".join(partes[:-1])


def _importaciones(arbol: ast.AST, paquete: str) -> list[str]:
    """Nombres completos importados, con los relativos resueltos contra el paquete del archivo."""
    nombres: list[str] = []
    for nodo in ast.walk(arbol):
        if isinstance(nodo, ast.Import):
            nombres.extend(alias.name for alias in nodo.names)
        elif isinstance(nodo, ast.ImportFrom):
            base = nodo.module or ""
            if nodo.level:
                partes = paquete.split(".")
                ancla = ".".join(partes[: len(partes) - (nodo.level - 1)])
                base = f"{ancla}.{base}" if base else ancla
            nombres.extend(f"{base}.{alias.name}" for alias in nodo.names)
    return nombres


def _prohibido(capa: str, nombre: str, raiz_nombre: str) -> bool:
    externas, internas = MATRIZ[capa]
    if nombre == raiz_nombre or nombre.startswith(f"{raiz_nombre}."):
        return not any(nombre == p or nombre.startswith(f"{p}.") for p in internas)
    return nombre.split(".")[0] not in externas


def capa_de(archivo: pathlib.Path, raiz: pathlib.Path) -> str:
    partes = archivo.relative_to(raiz).parts
    return partes[0] if len(partes) > 1 else "raiz"


def infracciones(raiz: pathlib.Path) -> list[str]:
    """Una línea por import (o llamada a `open`) que la matriz no permite, con archivo e import."""
    encontradas: list[str] = []
    for archivo in sorted(raiz.rglob("*.py")):
        capa = capa_de(archivo, raiz)
        if capa not in MATRIZ:
            continue
        paquete = _paquete(archivo, raiz)
        arbol = ast.parse(archivo.read_text(encoding="utf-8"))
        relativo = archivo.relative_to(raiz.parent)
        for nombre in _importaciones(arbol, paquete):
            if _prohibido(capa, nombre, raiz.name):
                encontradas.append(f"{relativo} importa {nombre}")
        if capa in CAPAS_SIN_LLAMADAS_PROHIBIDAS:
            for nodo in ast.walk(arbol):
                if (
                    isinstance(nodo, ast.Call)
                    and isinstance(nodo.func, ast.Name)
                    and nodo.func.id in LLAMADAS_PROHIBIDAS
                ):
                    encontradas.append(f"{relativo} llama a {nodo.func.id}")
    return encontradas


def test_el_arbol_real_respeta_la_matriz_de_imports() -> None:
    capas = {capa_de(a, RAIZ) for a in RAIZ.rglob("*.py")}
    assert {"nucleo", "datos"} <= capas, f"la guarda no encontró nucleo y datos: {sorted(capas)}"
    assert infracciones(RAIZ) == []


def _sembrar(tmp_path: pathlib.Path, ruta: str, codigo: str) -> pathlib.Path:
    raiz = tmp_path / "reporte"
    archivo = raiz / ruta
    archivo.parent.mkdir(parents=True, exist_ok=True)
    archivo.write_text(codigo, encoding="utf-8")
    return raiz


PROHIBIDOS = [
    ("nucleo/analisis.py", "import reporte.datos\n", "reporte.datos"),
    ("nucleo/analisis.py", "import pathlib\n", "pathlib"),
    ("nucleo/analisis.py", "from os import path\n", "os.path"),
    ("nucleo/analisis.py", "import numpy\n", "numpy"),
    ("nucleo/analisis.py", "from .. import datos\n", "reporte.datos"),
    ("nucleo/analisis.py", "from ..datos import leer\n", "reporte.datos.leer"),
    ("nucleo/sub/hondo.py", "from ... import presentacion\n", "reporte.presentacion"),
    ("nucleo/analisis.py", "datos = open('f.csv')\n", "open"),
    ("nucleo/analisis.py", "import importlib\n", "importlib"),
    ("nucleo/analisis.py", "from importlib import import_module\n", "importlib.import_module"),
    ("nucleo/analisis.py", "import builtins\n", "builtins"),
    ("nucleo/analisis.py", "from builtins import open\n", "builtins.open"),
    ("nucleo/analisis.py", "modulo = __import__('os')\n", "__import__"),
    ("datos/lectura.py", "import reporte.presentacion\n", "reporte.presentacion"),
    ("datos/lectura.py", "from reporte.nucleo import analizar\n", "reporte.nucleo.analizar"),
    ("datos/lectura.py", "from ..nucleo.analisis import analizar\n", "reporte.nucleo.analisis"),
    ("datos/lectura.py", "import requests\n", "requests"),
    ("presentacion/pagina.py", "import pandas\n", "pandas"),
    ("presentacion/pagina.py", "from reporte.datos import leer\n", "reporte.datos.leer"),
]

PERMITIDOS = [
    ("nucleo/tipos.py", "import pandas as pd\nfrom dataclasses import dataclass\n"),
    ("nucleo/tipos.py", "from . import analisis\nfrom .analisis import analizar\n"),
    ("nucleo/__init__.py", "from reporte.nucleo.tipos import Transacciones\n"),
    ("datos/lectura.py", "import pathlib\nimport csv\nimport pandas as pd\n"),
    ("datos/lectura.py", "from reporte.nucleo.tipos import Transacciones\n"),
    ("datos/lectura.py", "from ..nucleo import tipos\nfrom ..nucleo.tipos import Transacciones\n"),
    ("datos/__init__.py", "from .lectura import leer_transacciones\n"),
    ("presentacion/pagina.py", "import jinja2\nfrom reporte.nucleo import Analisis\n"),
    ("presentacion/pagina.py", "import pathlib\nfrom ..nucleo.analisis import Analisis\n"),
    ("app.py", "import pandas\nimport pathlib\nfrom reporte import datos, nucleo, presentacion\n"),
    ("__main__.py", "from reporte.app import main\nimport requests\n"),
]


@pytest.mark.parametrize(("ruta", "codigo", "esperado"), PROHIBIDOS)
def test_un_import_fuera_de_la_matriz_se_rechaza_nombrando_archivo_e_import(
    tmp_path: pathlib.Path, ruta: str, codigo: str, esperado: str
) -> None:
    raiz = _sembrar(tmp_path, ruta, codigo)

    encontradas = infracciones(raiz)

    assert len(encontradas) == 1, encontradas
    assert f"reporte/{ruta}" in encontradas[0]
    assert esperado in encontradas[0]


@pytest.mark.parametrize(("ruta", "codigo"), PERMITIDOS)
def test_un_import_dentro_de_la_matriz_se_acepta(
    tmp_path: pathlib.Path, ruta: str, codigo: str
) -> None:
    raiz = _sembrar(tmp_path, ruta, codigo)

    assert infracciones(raiz) == []
