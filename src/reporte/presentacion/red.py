"""Detector de referencias de red de la página (R16).

Una referencia de red es una URL `http:`, `https:`, `ws:`, `wss:` o `ftp:`, o una que empieza con
`//`, en una posición que el navegador carga: un atributo `src`, `href`, `srcset`, `action`,
`formaction`, `poster`, `data` o `xlink:href`; un `url()` o `@import` de CSS; o un `import`,
`import()`, `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `sendBeacon` o `importScripts` de
JavaScript. Una URL `data:`, un fragmento `#…` o una cadena fuera de esas posiciones (un espacio de
nombres XML, un aviso de licencia, un texto visible) no cuenta: buscar `//` en todo el HTML
rechazaría el base64 de la fuente incrustada.

El análisis de JavaScript es heurístico: no ejecuta el código, así que una URL armada en tiempo de
ejecución no se ve.
"""

import re
from html.parser import HTMLParser

_ESQUEMAS_DE_RED = ("http:", "https:", "ws:", "wss:", "ftp:", "//")
_ATRIBUTOS_DE_CARGA = frozenset(
    {"src", "href", "action", "formaction", "poster", "data", "xlink:href"}
)

_COMENTARIO_CSS = re.compile(r"/\*.*?\*/", re.DOTALL)
_URL_CSS = re.compile(r"""url\(\s*(?:"([^"]*)"|'([^']*)'|([^)"'\s]*))\s*\)""", re.IGNORECASE)
_IMPORT_CSS = re.compile(r"""@import\s*(?:"([^"]*)"|'([^']*)')""", re.IGNORECASE)

# Cadenas, plantillas y comentarios de JavaScript, para quitar los comentarios sin tocar el
# contenido de las cadenas (`"http://…"` contiene `//`).
_CADENAS_Y_COMENTARIOS_JS = re.compile(
    r"""(?P<cadena>"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)"""
    r"""|//[^\n]*|/\*.*?\*/""",
    re.DOTALL,
)
_LITERAL_JS = r"""(?:"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`)"""
_LLAMADA_DE_CARGA_JS = re.compile(
    rf"\b(fetch|import|sendBeacon|WebSocket|EventSource)\s*\(\s*{_LITERAL_JS}"
)
_IMPORT_ESTATICO_JS = re.compile(rf"\b(?:import|export)\s+(?:[^\"'`;(]*?\s+from\s+)?{_LITERAL_JS}")
_IMPORT_SCRIPTS_JS = re.compile(r"\bimportScripts\s*\(([^)]*)\)")
_ABRIR_XHR_JS = re.compile(rf"\.open\s*\(\s*(?:\"[A-Za-z]+\"|'[A-Za-z]+')\s*,\s*{_LITERAL_JS}")
_LITERALES_JS = re.compile(_LITERAL_JS)


def _es_de_red(url: str) -> bool:
    # El navegador ignora tabuladores y saltos dentro de la URL y trata `\` como `/`.
    normalizada = re.sub(r"[\t\n\r]", "", url).strip().lower().replace("\\", "/")
    return normalizada.startswith(_ESQUEMAS_DE_RED)


def _urls_de_srcset(valor: str) -> list[str]:
    urls: list[str] = []
    i, n = 0, len(valor)
    while i < n:
        while i < n and (valor[i].isspace() or valor[i] == ","):
            i += 1
        j = i
        while j < n and not valor[j].isspace():
            j += 1
        url = valor[i:j]
        if not url:
            break
        if url.endswith(","):
            url = url.rstrip(",")
            i = j
        else:
            coma = valor.find(",", j)
            i = n if coma == -1 else coma + 1
        urls.append(url)
    return urls


def _primer_grupo(coincidencia: re.Match[str], desde: int = 1) -> str:
    return next(g for g in coincidencia.groups()[desde - 1 :] if g is not None)


def _urls_de_css(css: str) -> list[tuple[str, str]]:
    css = _COMENTARIO_CSS.sub(" ", css)
    encontradas = [("url()", _primer_grupo(m)) for m in _URL_CSS.finditer(css)]
    encontradas += [("@import", _primer_grupo(m)) for m in _IMPORT_CSS.finditer(css)]
    return encontradas


def _urls_de_javascript(js: str) -> list[tuple[str, str]]:
    js = _CADENAS_Y_COMENTARIOS_JS.sub(lambda m: m.group(0) if m.group("cadena") else " ", js)
    encontradas = [(m.group(1), _primer_grupo(m, 2)) for m in _LLAMADA_DE_CARGA_JS.finditer(js)]
    encontradas += [("import", _primer_grupo(m)) for m in _IMPORT_ESTATICO_JS.finditer(js)]
    encontradas += [("XMLHttpRequest", _primer_grupo(m)) for m in _ABRIR_XHR_JS.finditer(js)]
    for llamada in _IMPORT_SCRIPTS_JS.finditer(js):
        encontradas += [
            ("importScripts", _primer_grupo(literal))
            for literal in _LITERALES_JS.finditer(llamada.group(1))
        ]
    return encontradas


class _Revisor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.referencias: list[str] = []
        self._etiqueta_de_codigo: str | None = None
        self._codigo: list[str] = []

    def _anotar(self, posicion: str, url: str) -> None:
        if _es_de_red(url):
            self.referencias.append(f"{posicion}: {url.strip()}")

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        for nombre, valor in attrs:
            if valor is None:
                continue
            posicion = f"<{tag} {nombre}>"
            if nombre == "srcset":
                for url in _urls_de_srcset(valor):
                    self._anotar(posicion, url)
            elif nombre in _ATRIBUTOS_DE_CARGA:
                self._anotar(posicion, valor)
            elif nombre == "style":
                for forma, url in _urls_de_css(valor):
                    self._anotar(f"<{tag} style> {forma}", url)
        if tag in ("script", "style"):
            self._etiqueta_de_codigo = tag
            self._codigo = []

    def handle_data(self, data: str) -> None:
        if self._etiqueta_de_codigo is not None:
            self._codigo.append(data)

    def handle_endtag(self, tag: str) -> None:
        if tag == self._etiqueta_de_codigo:
            self._revisar_codigo()

    def _revisar_codigo(self) -> None:
        etiqueta, codigo = self._etiqueta_de_codigo, "".join(self._codigo)
        self._etiqueta_de_codigo = None
        if etiqueta == "style":
            for forma, url in _urls_de_css(codigo):
                self._anotar(f"<style> {forma}", url)
        else:
            for forma, url in _urls_de_javascript(codigo):
                self._anotar(f"<script> {forma}", url)

    def terminar(self) -> None:
        self.close()
        if self._etiqueta_de_codigo is not None:
            self._revisar_codigo()


def referencias_de_red(html: str) -> tuple[str, ...]:
    """Devuelve cada referencia de red del HTML como `"<posición>: <url>"`, en orden de aparición."""
    revisor = _Revisor()
    revisor.feed(html)
    revisor.terminar()
    return tuple(revisor.referencias)
