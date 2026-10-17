"""Presentación: da formato a lo que trae `Analisis`; no lee archivos ni calcula estadísticas."""

from reporte.presentacion.formatos import (
    dia_de_la_semana,
    formatear_entero,
    formatear_fecha,
    formatear_mes,
    formatear_monto,
    formatear_porcentaje,
)
from reporte.presentacion.pagina import renderizar
from reporte.presentacion.red import referencias_de_red

__all__ = [
    "dia_de_la_semana",
    "formatear_entero",
    "formatear_fecha",
    "formatear_mes",
    "formatear_monto",
    "formatear_porcentaje",
    "referencias_de_red",
    "renderizar",
]
