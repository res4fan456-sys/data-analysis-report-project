"""El núcleo del dominio no importa I/O y `src/` nunca importa `generador/` ni Faker: dos
reglas innegociables que la mecánica exige automatizar (CLAUDE.md, Reglas de proceso 7, y
Reglas innegociables de arquitectura 1 y 5). Amplía PROHIBIDOS cuando el proyecto decida
qué más queda fuera del núcleo."""

import ast
import pathlib

RAIZ = pathlib.Path(__file__).resolve().parents[1] / "src" / "reporte"
PROHIBIDOS = {"requests", "httpx", "socket", "subprocess", "sqlite3", "psycopg", "boto3"}
DEL_GENERADOR = {"generador", "faker"}


def _imports(archivo: pathlib.Path) -> set[str]:
    arbol = ast.parse(archivo.read_text(encoding="utf-8"))
    nombres: set[str] = set()
    for nodo in ast.walk(arbol):
        if isinstance(nodo, ast.Import):
            nombres.update(a.name.split(".")[0] for a in nodo.names)
        elif isinstance(nodo, ast.ImportFrom) and nodo.module:
            nombres.add(nodo.module.split(".")[0])
    return nombres


def _archivos_del_reporte() -> list[pathlib.Path]:
    archivos = sorted(RAIZ.rglob("*.py"))
    assert archivos, f"no hay módulos Python bajo {RAIZ}: la guarda no revisaría nada"
    return archivos


def test_el_nucleo_no_importa_io() -> None:
    for archivo in _archivos_del_reporte():
        prohibidos = _imports(archivo) & PROHIBIDOS
        assert not prohibidos, f"{archivo.relative_to(RAIZ.parent)} importa {sorted(prohibidos)}"


def test_el_reporte_no_importa_el_generador_ni_faker() -> None:
    for archivo in _archivos_del_reporte():
        del_generador = _imports(archivo) & DEL_GENERADOR
        assert not del_generador, (
            f"{archivo.relative_to(RAIZ.parent)} importa {sorted(del_generador)}"
        )
