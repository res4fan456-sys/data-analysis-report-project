"""El núcleo del dominio no importa I/O: la regla innegociable que la mecánica
exige automatizar (CLAUDE.md, Reglas de proceso 7). Amplía PROHIBIDOS cuando
el proyecto decida qué más queda fuera del núcleo."""

import ast
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parents[1] / "src" / "reporte"
PROHIBIDOS = {"requests", "httpx", "socket", "subprocess", "sqlite3", "psycopg", "boto3"}


def _imports(archivo: pathlib.Path) -> set[str]:
    arbol = ast.parse(archivo.read_text(encoding="utf-8"))
    nombres: set[str] = set()
    for nodo in ast.walk(arbol):
        if isinstance(nodo, ast.Import):
            nombres.update(a.name.split(".")[0] for a in nodo.names)
        elif isinstance(nodo, ast.ImportFrom) and nodo.module:
            nombres.add(nodo.module.split(".")[0])
    return nombres


def test_el_nucleo_no_importa_io() -> None:
    for archivo in RAIZ.rglob("*.py"):
        prohibidos = _imports(archivo) & PROHIBIDOS
        assert not prohibidos, f"{archivo.relative_to(RAIZ.parent)} importa {sorted(prohibidos)}"
