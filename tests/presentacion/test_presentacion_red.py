"""El detector de referencias de red (R16): ninguna página carga nada de internet sin que un
test lo vea, y la fuente incrustada o las librerías no se rechazan en falso."""

import pytest

from reporte.presentacion import referencias_de_red

URL = "https://x.mx/recurso"


def _reporta(html: str, url: str) -> bool:
    return any(url in referencia for referencia in referencias_de_red(html))


@pytest.mark.parametrize(
    ("html", "url"),
    [
        ('<img src="https://x.mx/a.png">', "https://x.mx/a.png"),
        ('<link href="//x.mx/a.css">', "//x.mx/a.css"),
        ("<style>@font-face{src:url(http://x.mx/f.woff2)}</style>", "http://x.mx/f.woff2"),
        ('<style>@import "https://x.mx/b.css";</style>', "https://x.mx/b.css"),
        ('<script>fetch("https://x.mx")</script>', "https://x.mx"),
        ('<script>import("https://x.mx/m.js")</script>', "https://x.mx/m.js"),
    ],
    ids=["img-src", "link-href", "css-url", "css-import", "js-fetch", "js-import-dinamico"],
)
def test_reporta_cada_caso_sembrado(html, url):
    assert _reporta(html, url)


@pytest.mark.parametrize(
    "html",
    [
        f'<img srcset="{URL}">',
        f'<img srcset="a.png 1x, {URL} 2x">',
        f'<form action="{URL}"></form>',
        f'<button formaction="{URL}"></button>',
        f'<video poster="{URL}"></video>',
        f'<object data="{URL}"></object>',
        f'<svg><use xlink:href="{URL}"/></svg>',
        f'<script src="{URL}"></script>',
        f'<a href="{URL}">x</a>',
    ],
    ids=[
        "srcset",
        "srcset-segunda-url",
        "action",
        "formaction",
        "poster",
        "data",
        "xlink-href",
        "script-src",
        "a-href",
    ],
)
def test_reporta_cada_atributo_de_carga(html):
    assert _reporta(html, URL)


@pytest.mark.parametrize(
    "esquema", ["http:", "https:", "ws:", "wss:", "ftp:", "//", "HTTPS:", "  https:", "\\\\"]
)
def test_reporta_cada_esquema_de_red_sin_distinguir_mayusculas_ni_espacios_iniciales(esquema):
    assert _reporta(f'<img src="{esquema}//x.mx/a.png">', "x.mx/a.png")


@pytest.mark.parametrize(
    "html",
    [
        f'<div style="background:url({URL})"></div>',
        f"<div style=\"background:url('{URL}')\"></div>",
        f'<div style="background:url(&quot;{URL}&quot;)"></div>',
        f"<div style=\"@import '{URL}'\"></div>",
        f"<style>@import url({URL});</style>",
        f"<style>a{{background:URL( '{URL}' )}}</style>",
    ],
    ids=[
        "style-url",
        "style-url-comillas-simples",
        "style-url-comillas-escapadas",
        "style-import",
        "import-con-url",
        "url-con-espacios-y-mayusculas",
    ],
)
def test_reporta_url_e_import_de_css_en_style_y_en_atributos_style(html):
    assert _reporta(html, URL)


@pytest.mark.parametrize(
    "js",
    [
        f'import x from "{URL}"',
        f'import {{ a, b }} from "{URL}"',
        f"import '{URL}'",
        f'export * from "{URL}"',
        f'var r = new XMLHttpRequest(); r.open("GET", "{URL}")',
        f'new WebSocket("{URL}")',
        f'new EventSource("{URL}")',
        f'navigator.sendBeacon("{URL}", datos)',
        f'importScripts("local.js", "{URL}")',
        f"fetch(`{URL}`)",
    ],
    ids=[
        "import-por-defecto",
        "import-con-llaves",
        "import-de-efecto",
        "reexport",
        "xmlhttprequest",
        "websocket",
        "eventsource",
        "sendbeacon",
        "importscripts-segunda-url",
        "fetch-con-plantilla",
    ],
)
def test_reporta_cada_forma_de_carga_de_javascript(js):
    assert _reporta(f"<script>{js}</script>", URL)


def test_srcset_sin_espacio_tras_la_coma_reporta_la_segunda_url():
    assert _reporta('<img srcset="a.png 1x,//x.mx/b.png 2x">', "//x.mx/b.png")


def test_atributo_sin_valor_no_impide_reportar_los_demas():
    assert _reporta(f'<img src><video controls poster="{URL}"></video>', URL)


def test_script_sin_cierre_se_revisa_igual():
    assert _reporta(f'<script>fetch("{URL}")', URL)


def test_cada_referencia_dice_la_posicion_y_la_url():
    html = '<img src="https://x.mx/a.png"><script>fetch("https://y.mx")</script>'

    referencias = referencias_de_red(html)

    assert len(referencias) == 2
    assert "img" in referencias[0] and "src" in referencias[0]
    assert "fetch" in referencias[1]


def test_una_url_de_red_se_reporta_una_vez_por_posicion_donde_aparece():
    html = f'<img src="{URL}"><img src="{URL}">'

    assert len(referencias_de_red(html)) == 2


def test_fuente_incrustada_con_barras_en_su_base64_no_es_red():
    html = "<style>@font-face{src:url(data:font/woff2;base64,AB//CD) format('woff2')}</style>"

    assert referencias_de_red(html) == ()


def test_data_url_es_local_en_cualquier_atributo():
    html = '<img src="data:image/png;base64,AB//CD"><img srcset="data:image/png;base64,//AB 2x">'

    assert referencias_de_red(html) == ()


def test_espacio_de_nombres_y_licencia_en_un_script_no_son_red():
    html = (
        "<script>/* Licensed under http://www.apache.org/licenses/LICENSE-2.0 */\n"
        "// ver https://x.mx/licencia\n"
        'var s = document.createElementNS("http://www.w3.org/2000/svg", "svg");</script>'
    )

    assert referencias_de_red(html) == ()


def test_llamada_de_carga_dentro_de_un_comentario_de_javascript_no_se_ejecuta():
    html = f'<script>// fetch("{URL}")\n/* import("{URL}") */</script>'

    assert referencias_de_red(html) == ()


def test_cadena_con_dobles_barras_no_confunde_al_quitar_comentarios_de_javascript():
    html = f'<script>var a = "http://ejemplo"; fetch("{URL}")</script>'

    assert _reporta(html, URL)


def test_url_dentro_de_un_comentario_css_no_se_carga():
    html = f"<style>/* url({URL}) */ a {{ color: red }}</style>"

    assert referencias_de_red(html) == ()


def test_fragmento_y_rutas_relativas_son_locales():
    html = (
        '<a href="#//x.mx/ancla">ir</a><a href="#seccion">ir</a>'
        '<a href="informe.html">x</a><a href="mailto:a@x.mx">x</a>'
    )

    assert referencias_de_red(html) == ()


def test_url_de_red_en_texto_visible_no_es_referencia():
    html = f'<p>Visita {URL} y //x.mx/b o fetch("{URL}")</p>'

    assert referencias_de_red(html) == ()


def test_atributo_data_guion_no_es_el_atributo_data():
    html = f'<div data-url="{URL}" data-x="{URL}"></div>'

    assert referencias_de_red(html) == ()


def test_html_sin_referencias_devuelve_tupla_vacia():
    assert referencias_de_red("<p>hola</p>") == ()
