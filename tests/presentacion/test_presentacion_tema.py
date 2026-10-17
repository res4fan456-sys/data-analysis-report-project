"""La paleta negro y dorado se lee en los dos temas: contraste WCAG 2.1 de cada par de colores en que
se usa (requisito de legibilidad de la página)."""

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


def test_el_texto_va_a_4_5_y_el_acento_de_las_cifras_grandes_a_3() -> None:
    minimos = {(p.primer_plano, p.fondo): p.minimo for p in PARES}

    assert minimos[("texto", "fondo")] == 4.5
    assert minimos[("texto_secundario", "superficie")] == 4.5
    assert minimos[("acento", "superficie")] == 3.0


def test_los_dos_temas_tienen_los_mismos_tokens_y_colores_hexadecimales() -> None:
    claro, oscuro = dict(TEMA_CLARO.colores()), dict(TEMA_OSCURO.colores())

    assert claro.keys() == oscuro.keys()
    assert all(len(c) == 7 and c.startswith("#") for c in [*claro.values(), *oscuro.values()])
