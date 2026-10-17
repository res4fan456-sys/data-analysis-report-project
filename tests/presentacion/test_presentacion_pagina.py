"""La página del reporte: lo que el autor ve de su mes (R15, R16, R17 de docs/DOMINIO.md)."""

import base64
import pathlib
import re

from _pagina_de_prueba import (
    analisis_de_febrero_bisiesto,
    analisis_de_septiembre,
    etiquetas,
    leer,
    textos_visibles,
)

from reporte.presentacion import referencias_de_red, renderizar
from reporte.presentacion.tema import TEMA_CLARO, TEMA_OSCURO, Tema

ACTIVOS = pathlib.Path(__file__).resolve().parents[2] / "src/reporte/presentacion/activos"
CIERRE = "Aquí queda la línea del respeto"


def _estilo(html: str) -> str:
    return "".join(
        m.group(1) for m in re.finditer(r"<style[^>]*>(.*?)</style>", html, flags=re.DOTALL)
    )


def test_el_resumen_de_septiembre_muestra_cada_cifra_en_es_mx() -> None:
    visibles = textos_visibles(renderizar(analisis_de_septiembre()))
    texto = " | ".join(visibles)

    for esperado in (
        "1 de septiembre de 2026",
        "30 de septiembre de 2026",
        "$400.00",
        "$133.33",
        "16 de septiembre de 2026",
        "miércoles",
        "$250.50",
        "$300.00",
        "75.0 %",
    ):
        assert any(esperado in nodo for nodo in visibles), f"falta {esperado!r} en: {texto}"
    assert "septiembre de 2026" in visibles
    assert "3" in visibles


def test_la_pagina_no_reescribe_con_css_el_texto_de_los_formateadores() -> None:
    html = renderizar(analisis_de_septiembre())
    en_atributos = [a.get("style") or "" for _, a, _ in leer(html).elementos]

    assert "text-transform" not in _estilo(html)
    assert all("text-transform" not in estilo for estilo in en_atributos)


def test_el_periodo_de_febrero_bisiesto_termina_el_29() -> None:
    visibles = textos_visibles(renderizar(analisis_de_febrero_bisiesto()))

    assert "febrero de 2028" in visibles
    assert any("29 de febrero de 2028" in nodo for nodo in visibles)
    assert not any("28 de febrero de 2028" in nodo for nodo in visibles)


def test_los_avisos_se_muestran_antes_del_resumen() -> None:
    aviso = "2 transacciones tienen coordenadas fuera de México"
    visibles = textos_visibles(renderizar(analisis_de_septiembre(avisos=(aviso, "otro aviso"))))

    posicion_aviso = next(i for i, nodo in enumerate(visibles) if aviso in nodo)
    posicion_total = next(i for i, nodo in enumerate(visibles) if "$400.00" in nodo)
    assert posicion_aviso < posicion_total
    assert any("otro aviso" in nodo for nodo in visibles)


def test_sin_avisos_la_pagina_no_tiene_seccion_de_avisos() -> None:
    html = renderizar(analisis_de_septiembre())

    assert all(atributos.get("id") != "avisos" for _, atributos, _ in leer(html).elementos)


def test_con_avisos_la_pagina_tiene_seccion_de_avisos() -> None:
    html = renderizar(analisis_de_septiembre(avisos=("algo dudoso",)))

    assert any(atributos.get("id") == "avisos" for _, atributos, _ in leer(html).elementos)


def test_el_texto_de_un_aviso_se_muestra_literal_y_no_como_marcado() -> None:
    html = renderizar(analisis_de_septiembre(avisos=("<b>hola</b> & adiós",)))

    assert "<b>hola</b> & adiós" in textos_visibles(html)
    assert "b" not in etiquetas(html)


def test_la_pagina_no_tiene_referencias_de_red_ni_archivos_aparte() -> None:
    for analisis in (analisis_de_septiembre(), analisis_de_septiembre(avisos=("x",))):
        elementos = leer(renderizar(analisis)).elementos

        assert referencias_de_red(renderizar(analisis)) == ()
        assert not any(tag == "script" and "src" in a for tag, a, _ in elementos)
        assert not any(tag == "link" and "href" in a for tag, a, _ in elementos)


def test_la_fuente_inter_va_incrustada_con_el_contenido_exacto_del_archivo() -> None:
    estilo = _estilo(renderizar(analisis_de_septiembre()))

    bloques = re.findall(r"@font-face\s*\{([^}]*)\}", estilo)
    inter = [b for b in bloques if re.search(r"""font-family:\s*["']?Inter["']?\s*[;}]""", b)]
    assert len(inter) == 1
    origen = re.search(r"url\(\s*data:font/woff2;base64,([A-Za-z0-9+/=]+)\s*\)", inter[0])
    assert origen is not None
    assert base64.b64decode(origen.group(1)) == (ACTIVOS / "InterVariable.woff2").read_bytes()


def test_el_cuerpo_de_la_pagina_usa_la_familia_inter() -> None:
    estilo = _estilo(renderizar(analisis_de_septiembre()))

    assert re.search(r"""\bbody\s*\{[^}]*font-family:\s*["']?Inter\b""", estilo)


def test_el_ultimo_texto_visible_es_el_cierre_con_avisos_y_sin_ellos() -> None:
    for avisos in ((), ("un aviso",), ("<b>x</b>", "y")):
        visibles = textos_visibles(renderizar(analisis_de_septiembre(avisos=avisos)))

        assert visibles[-1] == CIERRE


def test_el_boton_del_tema_esta_en_el_encabezado_y_se_nombra_en_espanol() -> None:
    elementos = leer(renderizar(analisis_de_septiembre())).elementos
    botones = [(a, ancestros) for tag, a, ancestros in elementos if tag == "button"]

    assert len(botones) == 1
    atributos, ancestros = botones[0]
    assert "header" in ancestros
    assert "tema" in (atributos.get("aria-label") or "").lower()


def _variables(estilo: str, patron: str) -> dict[str, str]:
    bloque = re.search(patron + r"\s*\{([^}]*)\}", estilo)
    assert bloque is not None, f"no hay un bloque {patron}"
    return dict(re.findall(r"(--[\w-]+):\s*([^;]+);", bloque.group(1)))


def _tokens(tema: Tema) -> dict[str, str]:
    return {"--" + nombre.replace("_", "-"): valor for nombre, valor in tema.colores()}


def test_cada_bloque_de_css_lleva_los_colores_de_su_tema() -> None:
    estilo = _estilo(renderizar(analisis_de_septiembre()))
    media_oscura = r"@media \(prefers-color-scheme: dark\)\s*\{\s*:root:not\(\[data-tema\]\)"

    assert _variables(estilo, r"(?m)^:root") == _tokens(TEMA_CLARO)
    assert _variables(estilo, media_oscura) == _tokens(TEMA_OSCURO)
    assert _variables(estilo, r':root\[data-tema="claro"\]') == _tokens(TEMA_CLARO)
    assert _variables(estilo, r':root\[data-tema="oscuro"\]') == _tokens(TEMA_OSCURO)
