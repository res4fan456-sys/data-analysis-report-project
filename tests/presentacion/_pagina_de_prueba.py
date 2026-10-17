"""Ayudas de los tests de la página: un `Analisis` hecho a mano y un lector del HTML que devuelve sus
elementos y los nodos de texto fuera de `head`, `script`, `style`, `template` y de los elementos con
`hidden`. No aplica CSS."""

from datetime import date
from html.parser import HTMLParser

from reporte.nucleo import Analisis, Resumen

VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "wbr"}
NO_VISIBLES = {"head", "script", "style", "template"}

RESUMEN_DE_SEPTIEMBRE = Resumen(
    total=400.0,
    numero=3,
    ticket_promedio=133.333333,
    dia_mayor_gasto=date(2026, 9, 16),
    monto_dia_mayor_gasto=250.5,
    gasto_variable=300.0,
    proporcion_variable=0.75,
)


def analisis_de_septiembre(avisos: tuple[str, ...] = ()) -> Analisis:
    return Analisis(
        mes=date(2026, 9, 1),
        ultimo_dia=date(2026, 9, 30),
        resumen=RESUMEN_DE_SEPTIEMBRE,
        avisos=avisos,
    )


def analisis_de_febrero_bisiesto() -> Analisis:
    return Analisis(
        mes=date(2028, 2, 1),
        ultimo_dia=date(2028, 2, 29),
        resumen=RESUMEN_DE_SEPTIEMBRE,
        avisos=(),
    )


class _Lector(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.textos: list[str] = []
        self.elementos: list[tuple[str, dict[str, str | None], list[str]]] = []
        self._pila: list[tuple[str, bool]] = []

    def _oculto(self) -> bool:
        return any(oculto for _, oculto in self._pila)

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        atributos = dict(attrs)
        self.elementos.append((tag, atributos, [e[0] for e in self._pila]))
        if tag not in VOID:
            self._pila.append((tag, tag in NO_VISIBLES or "hidden" in atributos))

    def handle_endtag(self, tag: str) -> None:
        while self._pila:
            if self._pila.pop()[0] == tag:
                break

    def handle_data(self, data: str) -> None:
        if data.strip() and not self._oculto():
            self.textos.append(data.strip())


def leer(html: str) -> _Lector:
    lector = _Lector()
    lector.feed(html)
    lector.close()
    return lector


def textos_visibles(html: str) -> list[str]:
    """Los nodos de texto visibles, sin espacios de borde: fuera de `head`, `script`, `style`,
    `template` y de los elementos con `hidden`."""
    return leer(html).textos


def etiquetas(html: str) -> list[str]:
    return [tag for tag, _, _ in leer(html).elementos]
