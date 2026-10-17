"""Cada activo incrustable declara versión, licencia y huella en `activos/LICENCIAS.md` (regla
innegociable 6 de CLAUDE.md)."""

import hashlib
import pathlib

ACTIVOS = pathlib.Path(__file__).resolve().parents[2] / "src/reporte/presentacion/activos"


def _celdas(linea: str) -> list[str]:
    return [celda.strip() for celda in linea.strip().strip("|").split("|")]


def activos_sin_declarar(directorio: pathlib.Path) -> list[str]:
    """Una línea por activo incrustable que `LICENCIAS.md` no declara bien, con el motivo. Solo se
    exceptúan `LICENCIAS.md` y los archivos de la tabla «Textos de licencia»."""
    filas: list[list[str]] = []
    textos_de_licencia: set[str] = set()
    en_textos = False
    for linea in (directorio / "LICENCIAS.md").read_text(encoding="utf-8").splitlines():
        if linea.startswith("#"):
            en_textos = "Textos de licencia" in linea
        elif linea.startswith("|"):
            fila = _celdas(linea)
            if en_textos:
                textos_de_licencia.add(fila[0].strip("`"))
            else:
                filas.append(fila)
    columnas = next((f for f in filas if "Archivo" in f), [])
    problemas: list[str] = []
    for activo in sorted(directorio.iterdir()):
        if activo.name == "LICENCIAS.md" or activo.name in textos_de_licencia:
            continue
        fila = next((f for f in filas if f and f[0].strip("`") == activo.name), None)
        if fila is None:
            problemas.append(f"{activo.name}: no figura en LICENCIAS.md")
            continue
        datos = dict(zip(columnas, fila, strict=False))
        huella = hashlib.sha256(activo.read_bytes()).hexdigest()
        for columna in ("Versión", "Licencia", "Origen"):
            if not datos.get(columna):
                problemas.append(f"{activo.name}: falta {columna}")
        if datos.get("SHA-256") != huella:
            problemas.append(f"{activo.name}: la huella SHA-256 no es la del archivo")
    return problemas


def _sembrar(tmp_path: pathlib.Path, tabla: str) -> pathlib.Path:
    (tmp_path / "fuente.woff2").write_bytes(b"contenido")
    (tmp_path / "Fuente-LICENSE.txt").write_text("texto de licencia", encoding="utf-8")
    (tmp_path / "LICENCIAS.md").write_text(
        "# Activos\n\n| Archivo | Versión | Licencia | Origen | SHA-256 |\n|---|---|---|---|---|\n"
        + tabla
        + "\n## Textos de licencia\n\n| Archivo | Licencia de | SHA-256 |\n|---|---|---|\n"
        "| `Fuente-LICENSE.txt` | `fuente.woff2` | 00 |\n",
        encoding="utf-8",
    )
    return tmp_path


def test_los_activos_reales_estan_declarados() -> None:
    assert activos_sin_declarar(ACTIVOS) == []


def test_un_activo_que_no_figura_se_rechaza_nombrando_el_archivo(tmp_path: pathlib.Path) -> None:
    directorio = _sembrar(tmp_path, "")

    assert activos_sin_declarar(directorio) == ["fuente.woff2: no figura en LICENCIAS.md"]


def test_un_activo_sin_version_ni_licencia_se_rechaza(tmp_path: pathlib.Path) -> None:
    huella = hashlib.sha256(b"contenido").hexdigest()
    directorio = _sembrar(tmp_path, f"| fuente.woff2 |  |  | https://x.mx/f | {huella} |\n")

    assert activos_sin_declarar(directorio) == [
        "fuente.woff2: falta Versión",
        "fuente.woff2: falta Licencia",
    ]


def test_un_activo_con_huella_ajena_se_rechaza(tmp_path: pathlib.Path) -> None:
    directorio = _sembrar(tmp_path, "| fuente.woff2 | 1.0 | OFL-1.1 | https://x.mx/f | 00 |\n")

    assert activos_sin_declarar(directorio) == [
        "fuente.woff2: la huella SHA-256 no es la del archivo"
    ]


def test_un_activo_bien_declarado_se_acepta(tmp_path: pathlib.Path) -> None:
    huella = hashlib.sha256(b"contenido").hexdigest()
    directorio = _sembrar(
        tmp_path, f"| fuente.woff2 | 1.0 | OFL-1.1 | https://x.mx/f | {huella} |\n"
    )

    assert activos_sin_declarar(directorio) == []


def test_un_activo_con_license_en_el_nombre_pero_fuera_de_la_tabla_de_textos_se_rechaza(
    tmp_path: pathlib.Path,
) -> None:
    huella = hashlib.sha256(b"contenido").hexdigest()
    directorio = _sembrar(
        tmp_path, f"| fuente.woff2 | 1.0 | OFL-1.1 | https://x.mx/f | {huella} |\n"
    )
    (directorio / "mexico-unlicensed.geojson").write_text("{}", encoding="utf-8")

    assert activos_sin_declarar(directorio) == [
        "mexico-unlicensed.geojson: no figura en LICENCIAS.md"
    ]
