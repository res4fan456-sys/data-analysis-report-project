"""La validación de R1 a R3: función pura sobre registros de texto, sin tocar el disco."""

import math
from collections.abc import Sequence

import pandas as pd

from reporte.datos.errores import ErrorDeEntrada
from reporte.nucleo.tipos import Transacciones

COLUMNAS = (
    "id_transaccion",
    "fecha",
    "monto",
    "concepto",
    "categoria",
    "cuenta",
    "zona",
    "latitud",
    "longitud",
)
_SIN_TRANSACCIONES = "El archivo no tiene transacciones"
_FORMATO_FECHA = "%Y-%m-%d %H:%M:%S"
_PATRON_FECHA = r"[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-5][0-9]"
_LATITUD_MEXICO = (14, 33)
_LONGITUD_MEXICO = (-119, -86)


def validar_registros(registros: Sequence[Sequence[str]]) -> Transacciones:
    """Valida el encabezado y las filas (el primer registro con campos es el encabezado).

    Un registro sin ningún campo (una línea en blanco), en cualquier posición, no es una
    transacción ni un encabezado y se ignora, pero cada fila conserva su posición en el archivo
    para nombrarla como la ve el autor en una hoja de cálculo.
    """
    con_campos = [i for i, registro in enumerate(registros) if registro]
    if len(con_campos) < 2:
        raise ErrorDeEntrada(_SIN_TRANSACCIONES)
    encabezado = list(registros[con_campos[0]])
    _comprobar_columnas(encabezado)

    posiciones = [i - 1 for i in con_campos[1:]]
    filas = [registros[i] for i in con_campos[1:]]
    de_mas = pd.Series([len(f) > len(COLUMNAS) for f in filas], index=posiciones, dtype=bool)
    completas = [[*f[: len(COLUMNAS)], *[""] * (len(COLUMNAS) - len(f))] for f in filas]
    crudo = pd.DataFrame(completas, columns=encabezado, index=posiciones)[list(COLUMNAS)]

    fechas = pd.to_datetime(crudo["fecha"], format=_FORMATO_FECHA, errors="coerce")
    montos = _numerica(crudo["monto"])
    latitudes = _numerica(crudo["latitud"])
    longitudes = _numerica(crudo["longitud"])

    _comprobar_filas(
        crudo,
        de_mas,
        fecha_mala=fechas.isna() | ~crudo["fecha"].str.fullmatch(_PATRON_FECHA),
        monto_malo=montos.isna() | (montos <= 0),
        latitud_mala=latitudes.isna(),
        longitud_mala=longitudes.isna(),
    )
    _comprobar_identificadores(crudo["id_transaccion"])
    _comprobar_un_solo_mes(fechas)

    tabla = crudo.assign(
        fecha=fechas, monto=montos, latitud=latitudes, longitud=longitudes
    ).reset_index(drop=True)
    return Transacciones(
        tabla=tabla,
        mes=fechas.iloc[0].date().replace(day=1),
        avisos=_avisos_de_coordenadas(latitudes, longitudes),
    )


def _comprobar_columnas(encabezado: list[str]) -> None:
    faltantes = [c for c in COLUMNAS if c not in encabezado]
    sobrantes = [c for c in dict.fromkeys(encabezado) if c.strip() and c not in COLUMNAS]
    repetidas = [c for c in dict.fromkeys(encabezado) if c.strip() and encabezado.count(c) > 1]
    sin_nombre = sum(1 for c in encabezado if not c.strip())
    problemas = []
    if sin_nombre:
        problemas.append(
            "hay una columna sin nombre"
            if sin_nombre == 1
            else f"hay {sin_nombre} columnas sin nombre"
        )
    if faltantes:
        problemas.append(f"faltan las columnas {', '.join(faltantes)}")
    if sobrantes:
        problemas.append(f"sobran las columnas {', '.join(sobrantes)}")
    if repetidas:
        problemas.append(f"se repiten las columnas {', '.join(repetidas)}")
    if problemas:
        raise ErrorDeEntrada(f"El encabezado no cumple el contrato: {'; '.join(problemas)}.")


def _numerica(texto: pd.Series[str]) -> pd.Series[float]:
    """Convierte a float; lo que no es número o no es finito queda como nulo."""
    numeros = pd.to_numeric(texto, errors="coerce").astype(float)
    return numeros.mask(numeros.isin([math.inf, -math.inf]))


def _comprobar_filas(
    crudo: pd.DataFrame,
    de_mas: pd.Series[bool],
    *,
    fecha_mala: pd.Series[bool],
    monto_malo: pd.Series[bool],
    latitud_mala: pd.Series[bool],
    longitud_mala: pd.Series[bool],
) -> None:
    """Nombra la primera fila inválida, no la primera columna con algún fallo.

    Cada comprobación va en el orden del contrato (campos de más, vacíos, `fecha`, `monto`,
    `latitud`, `longitud`); gana la fila menor y, en un empate, la comprobación anterior.
    """
    vacios = crudo.apply(lambda columna: columna.str.strip().eq(""))
    comprobaciones: list[tuple[str, pd.Series[bool], str]] = [
        ("", de_mas, f"trae más de {len(COLUMNAS)} campos, uno por columna"),
        *[(c, vacios[c], "está vacío") for c in COLUMNAS],
        ("fecha", fecha_mala, "debe ser una fecha real con formato AAAA-MM-DD HH:MM:SS"),
        ("monto", monto_malo, "debe ser un número finito mayor que cero"),
        ("latitud", latitud_mala, "debe ser un número finito"),
        ("longitud", longitud_mala, "debe ser un número finito"),
    ]
    primera: tuple[int, str, str] | None = None
    for campo, mala, motivo in comprobaciones:
        if mala.any():
            posicion = int(mala.index[int(mala.to_numpy().argmax())])
            if primera is None or posicion < primera[0]:
                primera = (posicion, campo, motivo)
    if primera is not None:
        posicion, campo, motivo = primera
        fila = _fila_de_hoja(posicion)
        if campo:
            raise ErrorDeEntrada(f"Fila {fila}, campo «{campo}»: {motivo}.")
        raise ErrorDeEntrada(f"Fila {fila}: {motivo}.")


def _fila_de_hoja(posicion: int) -> int:
    """Fila de hoja de cálculo de un registro: su posición en el archivo contando desde 1.

    `posicion` es el índice del registro en el archivo menos uno, con las líneas en blanco y el
    encabezado incluidos.
    """
    return posicion + 2


def _comprobar_identificadores(ids: pd.Series[str]) -> None:
    repetidos = ids.duplicated()
    if repetidos.any():
        lugar = int(repetidos.to_numpy().argmax())
        raise ErrorDeEntrada(
            f"Fila {_fila_de_hoja(int(ids.index[lugar]))}: el id_transaccion «{ids.iloc[lugar]}» "
            "ya apareció en una fila anterior."
        )


def _comprobar_un_solo_mes(fechas: pd.Series[pd.Timestamp]) -> None:
    meses = sorted(fechas.dt.strftime("%Y-%m").unique())
    if len(meses) > 1:
        raise ErrorDeEntrada(
            f"Las transacciones deben ser de un solo mes y el archivo trae {', '.join(meses)}."
        )


def _avisos_de_coordenadas(
    latitudes: pd.Series[float], longitudes: pd.Series[float]
) -> tuple[str, ...]:
    dentro = latitudes.between(*_LATITUD_MEXICO) & longitudes.between(*_LONGITUD_MEXICO)
    fuera = int((~dentro).sum())
    if fuera == 0:
        return ()
    if fuera == 1:
        return ("1 transacción tiene coordenadas fuera de México.",)
    return (f"{fuera} transacciones tienen coordenadas fuera de México.",)
