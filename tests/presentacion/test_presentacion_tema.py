"""La paleta negro y dorado se lee en los dos temas: contraste WCAG 2.1 de cada par de colores en que
se usa (requisito de legibilidad de la página)."""

import re

import pytest

from reporte.presentacion.tema import PARES, TEMA_CLARO, TEMA_OSCURO, Tema


def _luminancia(hexadecimal: str) -> float:
    canales = [int(hexadecimal[i : i + 2], 16) / 255 for i in (1, 3, 5)]
    lineales = [c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4 for c in canales]
    return 0.2126 * lineales[0] + 0.7152 * lineales[1] + 0.0722 * lineales[2]


def contraste(a: str, b: str) -> float:
    claro, oscuro = sorted((_luminancia(a), _luminancia(b)), reverse=True)
    return (claro + 0.05) / (oscuro + 0.05)


def test_la_formula_de_contraste_da_los_extremos_conocidos() -> None:
    assert contraste("#000000", "#ffffff") == pytest.approx(21.0)
    assert contraste("#777777", "#777777") == pytest.approx(1.0)
    assert contraste("#767676", "#ffffff") == pytest.approx(4.54, abs=0.01)


@pytest.mark.parametrize("tema", [TEMA_CLARO, TEMA_OSCURO], ids=lambda t: t.nombre)
@pytest.mark.parametrize("par", PARES, ids=lambda p: f"{p.primer_plano}-sobre-{p.fondo}")
def test_cada_par_de_colores_cumple_su_contraste_minimo(tema: Tema, par) -> None:
    proporcion = contraste(getattr(tema, par.primer_plano), getattr(tema, par.fondo))

    assert proporcion >= par.minimo, f"{tema.nombre}: {par.primer_plano} sobre {par.fondo}"


def test_los_pares_de_colores_y_sus_minimos_son_los_del_requisito() -> None:
    declarados = {
        ("texto", "fondo", 4.5),
        ("texto", "superficie", 4.5),
        ("texto_secundario", "fondo", 4.5),
        ("texto_secundario", "superficie", 4.5),
        ("acento", "fondo", 3.0),
        ("acento", "superficie", 3.0),
    }

    assert {(p.primer_plano, p.fondo, p.minimo) for p in PARES} == declarados
    assert len(PARES) == len(declarados)


def test_los_colores_de_los_dos_temas_son_hexadecimales_de_seis_digitos() -> None:
    colores = [valor for tema in (TEMA_CLARO, TEMA_OSCURO) for _, valor in tema.colores()]

    assert all(re.fullmatch(r"#[0-9a-f]{6}", c) for c in colores)
