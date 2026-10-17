"""Página del reporte: convierte un `Analisis` en un único HTML (R15–R17, `docs/DOMINIO.md`).

La plantilla no formatea ni calcula: todo lo que muestra llega aquí ya convertido en texto por los
formateadores es-MX, y el periodo sale de los campos del `Analisis`.
"""

import base64
from functools import cache
from importlib import resources

from jinja2 import Environment, PackageLoader, StrictUndefined

from reporte.nucleo import Analisis
from reporte.presentacion.formatos import (
    dia_de_la_semana,
    formatear_entero,
    formatear_fecha,
    formatear_mes,
    formatear_monto,
    formatear_porcentaje,
)
from reporte.presentacion.tema import TEMA_CLARO, TEMA_OSCURO, Tema

PLANTILLA = "reporte.html.j2"


@cache
def _entorno() -> Environment:
    return Environment(
        loader=PackageLoader("reporte.presentacion", "plantillas"),
        autoescape=True,
        undefined=StrictUndefined,
    )


@cache
def _fuente_inter_en_base64() -> str:
    archivo = resources.files("reporte.presentacion") / "activos" / "InterVariable.woff2"
    return base64.b64encode(archivo.read_bytes()).decode("ascii")


def _variables_css(tema: Tema) -> list[tuple[str, str]]:
    return [("--" + nombre.replace("_", "-"), valor) for nombre, valor in tema.colores()]


def renderizar(analisis: Analisis) -> str:
    resumen = analisis.resumen
    contexto = {
        "mes": formatear_mes(analisis.mes),
        "desde": formatear_fecha(analisis.mes),
        "hasta": formatear_fecha(analisis.ultimo_dia),
        "avisos": analisis.avisos,
        "total": formatear_monto(resumen.total),
        "numero": formatear_entero(resumen.numero),
        "ticket_promedio": formatear_monto(resumen.ticket_promedio),
        "dia_mayor_gasto": formatear_fecha(resumen.dia_mayor_gasto),
        "dia_mayor_gasto_semana": dia_de_la_semana(resumen.dia_mayor_gasto),
        "monto_dia_mayor_gasto": formatear_monto(resumen.monto_dia_mayor_gasto),
        "gasto_variable": formatear_monto(resumen.gasto_variable),
        "proporcion_variable": formatear_porcentaje(resumen.proporcion_variable),
        "variables_claro": _variables_css(TEMA_CLARO),
        "variables_oscuro": _variables_css(TEMA_OSCURO),
        "fuente_inter": _fuente_inter_en_base64(),
    }
    return _entorno().get_template(PLANTILLA).render(contexto)
