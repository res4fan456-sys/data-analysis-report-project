"""Tema de la página como datos: los tokens de color de los temas claro y oscuro y los pares de
colores en que se usan, para volcarlos en CSS y medir su contraste (`docs/STACK.md`, Estilo)."""

from dataclasses import dataclass, fields


@dataclass(frozen=True)
class Tema:
    nombre: str
    fondo: str
    superficie: str
    texto: str
    texto_secundario: str
    acento: str
    borde: str

    def colores(self) -> tuple[tuple[str, str], ...]:
        """Cada token de color (sin el nombre del tema) con su valor, en orden estable."""
        return tuple((f.name, getattr(self, f.name)) for f in fields(self) if f.name != "nombre")


@dataclass(frozen=True)
class ParDeColores:
    """Un color que se pinta sobre un fondo, con el contraste WCAG mínimo que debe tener."""

    primer_plano: str
    fondo: str
    minimo: float


TEMA_CLARO = Tema(
    nombre="claro",
    fondo="#faf8f2",
    superficie="#ffffff",
    texto="#17140d",
    texto_secundario="#5c5646",
    acento="#8a6200",
    borde="#d9d3c2",
)

TEMA_OSCURO = Tema(
    nombre="oscuro",
    fondo="#0b0b0d",
    superficie="#17171b",
    texto="#f4f1e8",
    texto_secundario="#b3ad9c",
    acento="#f5c542",
    borde="#34343b",
)

PARES = (
    ParDeColores("texto", "fondo", 4.5),
    ParDeColores("texto", "superficie", 4.5),
    ParDeColores("texto_secundario", "fondo", 4.5),
    ParDeColores("texto_secundario", "superficie", 4.5),
    ParDeColores("acento", "fondo", 3.0),
    ParDeColores("acento", "superficie", 3.0),
)
