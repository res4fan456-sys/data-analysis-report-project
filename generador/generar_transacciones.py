#!/usr/bin/env python3
"""Genera un CSV con transacciones financieras falsas de una persona durante un mes.

Cada ejecución produce datos distintos (salvo que se fije --semilla), pero siempre
incluye patrones de gasto deliberados para que un reporte posterior los detecte:
una categoría dominante, una zona favorita, picos en quincena y fines de semana,
y un viaje de fin de semana a otra ciudad.
"""

from __future__ import annotations

import argparse
import calendar
import csv
import random
import sys
from collections import Counter
from dataclasses import dataclass
from datetime import date, datetime, time, timedelta
from pathlib import Path

from faker import Faker

from generador import configuracion as cfg

LOCALE = "es_MX"
COLUMNAS = [
    "id_transaccion",
    "fecha",
    "monto",
    "concepto",
    "categoria",
    "cuenta",
    "zona",
    "latitud",
    "longitud",
]
CENTROS = {**cfg.ZONAS_LOCALES, **cfg.DESTINOS_VIAJE}


@dataclass(frozen=True)
class Comercio:
    nombre: str
    categoria: str
    monto_min: float
    monto_max: float
    zona: str | None  # None: comercio móvil, la ubicación cambia en cada compra
    lat: float | None
    lon: float | None


@dataclass(frozen=True)
class Perfil:
    """Patrones elegidos al azar para esta ejecución."""

    categoria_dominante: str
    casa: str
    trabajo: str
    favorita: str
    otras: tuple[str, ...]
    destino: str
    dias_viaje: frozenset[date]
    coord_casa: tuple[float, float]
    cuentas: dict[str, str]  # tipo de cuenta -> etiqueta con últimos 4 dígitos


# --- Utilidades --------------------------------------------------------------


def perfil_horario(rangos: list[tuple[int, int, float]]) -> list[float]:
    """Convierte rangos (inicio, fin, peso) en 24 pesos, uno por hora."""
    pesos = [0.05] * 24
    for inicio, fin, peso in rangos:
        hora = inicio
        while hora != fin:
            pesos[hora] += peso
            hora = (hora + 1) % 24
    return pesos


HORARIOS = {
    categoria: perfil_horario(datos["horas"]) for categoria, datos in cfg.CATEGORIAS.items()
}


def jitter(fake: Faker, centro: tuple[float, float], radio: float) -> tuple[float, float]:
    lat, lon = centro
    return float(fake.coordinate(center=lat, radius=radio)), float(
        fake.coordinate(center=lon, radius=radio)
    )


def momento(rng: random.Random, dia: date, hora: int) -> datetime:
    return datetime.combine(dia, time(hora, rng.randrange(60), rng.randrange(60)))


def nueva_fila(fecha, monto, concepto, categoria, cuenta, zona, lat, lon) -> dict:
    return {
        "fecha": fecha,
        "monto": round(monto, 2),
        "concepto": concepto,
        "categoria": categoria,
        "cuenta": cuenta,
        "zona": zona,
        "latitud": lat,
        "longitud": lon,
    }


def tipo_dia(dia: date, ultimo_dia: int) -> str:
    if dia.day in (15, ultimo_dia):
        return "quincena"
    if dia.day in (16, 1):
        return "post_quincena"
    if 12 <= dia.day <= 14 or ultimo_dia - 3 <= dia.day < ultimo_dia:
        return "pre_quincena"
    return "normal"


def es_quincena(tipo: str) -> bool:
    return tipo in ("quincena", "post_quincena")


# --- Perfil y comercios ------------------------------------------------------


def crear_perfil(
    fake: Faker, rng: random.Random, inicio: date, ultimo_dia: int, dominante: str | None
) -> Perfil:
    zonas = list(cfg.ZONAS_LOCALES)
    rng.shuffle(zonas)
    casa, trabajo, favorita, *otras = zonas

    viernes = [
        inicio + timedelta(days=i)
        for i in range(ultimo_dia - 2)
        if (inicio + timedelta(days=i)).weekday() == 4
    ]
    salida = rng.choice(viernes)

    cuentas = {}
    for tipo in cfg.CUENTAS:
        digitos = fake.credit_card_number()[-4:]
        while any(etiqueta.endswith(digitos) for etiqueta in cuentas.values()):
            digitos = fake.credit_card_number()[-4:]
        cuentas[tipo] = f"{tipo} ****{digitos}"

    return Perfil(
        categoria_dominante=dominante or rng.choice(list(cfg.FACTOR_DOMINANTE)),
        casa=casa,
        trabajo=trabajo,
        favorita=favorita,
        otras=tuple(otras),
        destino=rng.choice(list(cfg.DESTINOS_VIAJE)),
        dias_viaje=frozenset(salida + timedelta(days=i) for i in range(3)),
        coord_casa=jitter(fake, cfg.ZONAS_LOCALES[casa], cfg.RADIO_COMERCIO),
        cuentas=cuentas,
    )


def zona_por_rol(rng: random.Random, perfil: Perfil, perfil_zona: str) -> str:
    roles, pesos = zip(*cfg.PERFILES_ZONA[perfil_zona].items())
    rol = rng.choices(roles, weights=pesos)[0]
    if rol == "otras":
        return rng.choice(perfil.otras)
    return getattr(perfil, rol)


def crear_pool(
    fake: Faker,
    rng: random.Random,
    perfil: Perfil,
    categoria: str,
    plantillas: list[cfg.Plantilla],
    perfil_zona: str | None,
) -> tuple[list[Comercio], list[float]]:
    """Crea los comercios de una categoría y su popularidad. perfil_zona=None => destino de viaje."""
    usados: set[str] = set()
    comercios = []
    for plantilla in plantillas:
        for _ in range(plantilla.instancias):
            nombre = fake.parse(plantilla.nombre)
            for _ in range(20):
                if nombre not in usados:
                    break
                nombre = fake.parse(plantilla.nombre)
            usados.add(nombre)

            if plantilla.movil:
                zona, lat, lon = None, None, None
            elif perfil_zona is None:
                zona = perfil.destino
                lat, lon = jitter(fake, CENTROS[zona], cfg.RADIO_DESTINO)
            else:
                zona = zona_por_rol(rng, perfil, perfil_zona)
                lat, lon = jitter(fake, CENTROS[zona], cfg.RADIO_COMERCIO)
            comercios.append(
                Comercio(
                    nombre, categoria, plantilla.monto_min, plantilla.monto_max, zona, lat, lon
                )
            )

    rng.shuffle(comercios)
    pesos = [
        (1 / (i + 1) ** cfg.EXPONENTE_POPULARIDAD)
        * (cfg.FACTOR_ZONA_FAVORITA if comercio.zona == perfil.favorita else 1)
        for i, comercio in enumerate(comercios)
    ]
    return comercios, pesos


def crear_comercios(fake: Faker, rng: random.Random, perfil: Perfil) -> dict:
    pools = {}
    for categoria, datos in cfg.CATEGORIAS.items():
        pools[(categoria, "local")] = crear_pool(
            fake, rng, perfil, categoria, datos["comercios"], datos["zonas"]
        )
    for categoria, plantillas in cfg.COMERCIOS_VIAJE.items():
        pools[(categoria, "viaje")] = crear_pool(fake, rng, perfil, categoria, plantillas, None)
    return pools


# --- Generación de transacciones ---------------------------------------------


def peso_dia(dia: date, perfil: Perfil, ultimo_dia: int) -> float:
    peso = cfg.PESO_DIA_SEMANA[dia.weekday()]
    peso *= {
        "quincena": cfg.FACTOR_QUINCENA,
        "post_quincena": cfg.FACTOR_POST_QUINCENA,
        "pre_quincena": cfg.FACTOR_PRE_QUINCENA,
        "normal": 1,
    }[tipo_dia(dia, ultimo_dia)]
    if dia in perfil.dias_viaje:
        peso *= cfg.FACTOR_VIAJE
    return peso


def pesos_categoria(dia: date, perfil: Perfil, ultimo_dia: int) -> tuple[list[str], list[float]]:
    if dia in perfil.dias_viaje:
        pesos = dict(cfg.PESOS_VIAJE)
    else:
        pesos = {categoria: datos["peso"] for categoria, datos in cfg.CATEGORIAS.items()}
        if dia.weekday() >= 4:  # viernes a domingo
            for categoria, factor in cfg.AJUSTE_FIN_DE_SEMANA.items():
                pesos[categoria] *= factor
        if es_quincena(tipo_dia(dia, ultimo_dia)):
            for categoria, factor in cfg.AJUSTE_QUINCENA.items():
                pesos[categoria] *= factor
    if perfil.categoria_dominante in pesos:
        pesos[perfil.categoria_dominante] *= cfg.FACTOR_DOMINANTE[perfil.categoria_dominante]
    return list(pesos), list(pesos.values())


def calcular_monto(
    rng: random.Random, comercio: Comercio, perfil: Perfil, tipo: str, en_viaje: bool
) -> float:
    bajo, alto = comercio.monto_min, comercio.monto_max
    monto = rng.triangular(bajo, alto, bajo + (alto - bajo) * 0.3)
    if comercio.categoria == perfil.categoria_dominante:
        monto *= cfg.FACTOR_MONTO_DOMINANTE
    if es_quincena(tipo):
        monto *= cfg.FACTOR_MONTO_QUINCENA
    if en_viaje:
        monto *= cfg.FACTOR_MONTO_VIAJE
    if rng.random() < cfg.PROB_ATIPICO:
        monto *= rng.uniform(*cfg.RANGO_ATIPICO)
    return monto


def generar_variables(
    fake: Faker,
    rng: random.Random,
    perfil: Perfil,
    comercios: dict,
    inicio: date,
    ultimo_dia: int,
    n: int,
) -> list[dict]:
    dias = [inicio + timedelta(days=i) for i in range(ultimo_dia)]
    pesos_dias = [peso_dia(dia, perfil, ultimo_dia) for dia in dias]
    categorias_del_dia = {dia: pesos_categoria(dia, perfil, ultimo_dia) for dia in dias}

    filas = []
    for dia in rng.choices(dias, weights=pesos_dias, k=n):
        en_viaje = dia in perfil.dias_viaje
        tipo = tipo_dia(dia, ultimo_dia)
        categorias, pesos = categorias_del_dia[dia]
        categoria = rng.choices(categorias, weights=pesos)[0]
        pool, popularidad = comercios[(categoria, "viaje" if en_viaje else "local")]
        comercio = rng.choices(pool, weights=popularidad)[0]

        if comercio.zona is None:
            zona = (
                perfil.destino
                if en_viaje
                else zona_por_rol(rng, perfil, cfg.CATEGORIAS[categoria]["zonas"])
            )
            lat, lon = jitter(fake, CENTROS[zona], cfg.RADIO_MOVIL)
        else:
            zona, lat, lon = comercio.zona, comercio.lat, comercio.lon

        tipos_cuenta, pesos_cuenta = zip(*cfg.CATEGORIAS[categoria]["cuentas"].items())
        cuenta = perfil.cuentas[rng.choices(tipos_cuenta, weights=pesos_cuenta)[0]]
        hora = rng.choices(range(24), weights=HORARIOS[categoria])[0]

        filas.append(
            nueva_fila(
                momento(rng, dia, hora),
                calcular_monto(rng, comercio, perfil, tipo, en_viaje),
                comercio.nombre,
                categoria,
                cuenta,
                zona,
                lat,
                lon,
            )
        )
    return filas


def generar_cargos_fijos(
    fake: Faker, rng: random.Random, perfil: Perfil, inicio: date, ultimo_dia: int
) -> list[dict]:
    lat, lon = perfil.coord_casa
    filas = []
    for concepto, categoria, monto_min, monto_max, dia_min, dia_max, cuenta in cfg.CARGOS_FIJOS:
        dia = inicio.replace(day=rng.randint(dia_min, min(dia_max, ultimo_dia)))
        filas.append(
            nueva_fila(
                momento(rng, dia, rng.randint(5, 9)),
                rng.uniform(monto_min, monto_max),
                fake.parse(concepto),
                categoria,
                perfil.cuentas[cuenta],
                perfil.casa,
                lat,
                lon,
            )
        )
    return filas


def generar_cargos_viaje(
    fake: Faker, rng: random.Random, perfil: Perfil, inicio: date
) -> list[dict]:
    llegada, regreso = min(perfil.dias_viaje), max(perfil.dias_viaje)
    credito = perfil.cuentas["Tarjeta de Crédito"]
    ciudad = perfil.destino.split(",")[0]

    compra = max(inicio, llegada - timedelta(days=rng.randint(*cfg.DIAS_ANTICIPACION_VIAJE)))
    hotel_lat, hotel_lon = jitter(fake, CENTROS[perfil.destino], cfg.RADIO_DESTINO)
    noches = (regreso - llegada).days
    return [
        nueva_fila(
            momento(rng, compra, rng.randint(9, 23)),
            rng.uniform(*cfg.MONTO_TRANSPORTE_VIAJE),
            f"Vuelo a {ciudad}",
            "Viajes",
            credito,
            perfil.casa,
            *perfil.coord_casa,
        ),
        nueva_fila(
            momento(rng, regreso, rng.randint(10, 12)),
            noches * rng.uniform(*cfg.MONTO_NOCHE_HOTEL),
            fake.parse("Hotel {{last_name}}"),
            "Viajes",
            credito,
            perfil.destino,
            hotel_lat,
            hotel_lon,
        ),
    ]


# --- Salida ------------------------------------------------------------------


def escribir_csv(filas: list[dict], salida: Path) -> None:
    salida.parent.mkdir(parents=True, exist_ok=True)
    with salida.open("w", newline="", encoding="utf-8") as archivo:
        writer = csv.DictWriter(archivo, fieldnames=COLUMNAS)
        writer.writeheader()
        for fila in filas:
            writer.writerow(
                {
                    **fila,
                    "fecha": fila["fecha"].strftime("%Y-%m-%d %H:%M:%S"),
                    "monto": f"{fila['monto']:.2f}",
                    "latitud": f"{fila['latitud']:.6f}",
                    "longitud": f"{fila['longitud']:.6f}",
                }
            )


def imprimir_resumen(
    filas: list[dict], perfil: Perfil, salida: Path, semilla: int, ultimo_dia: int
) -> None:
    total = sum(fila["monto"] for fila in filas)
    por_categoria: Counter[str] = Counter()
    por_zona: Counter[str] = Counter()
    for fila in filas:
        por_categoria[fila["categoria"]] += fila["monto"]
        por_zona[fila["zona"]] += fila["monto"]

    llegada, regreso = min(perfil.dias_viaje), max(perfil.dias_viaje)
    print(f"{len(filas):,} transacciones -> {salida}")
    print(f"Semilla: {semilla} (repite este set con --semilla {semilla})")
    print("\nPatrones inyectados:")
    print(f"  Categoría dominante : {perfil.categoria_dominante}")
    print(f"  Zona favorita       : {perfil.favorita}")
    print(f"  Casa / trabajo      : {perfil.casa} / {perfil.trabajo}")
    print(f"  Viaje               : {perfil.destino} ({llegada:%d/%m} al {regreso:%d/%m})")
    print(f"  Quincenas           : días 15 y {ultimo_dia}")
    print(f"\nGasto total: ${total:,.2f}")
    print("Por categoría:")
    for categoria, monto in por_categoria.most_common():
        print(f"  {categoria:<16}{monto / total:6.1%}  ${monto:,.2f}")
    print("Top zonas:")
    for zona, monto in por_zona.most_common(3):
        print(f"  {zona:<24}{monto / total:6.1%}")


# --- CLI ---------------------------------------------------------------------


def mes_valido(valor: str) -> date:
    try:
        return datetime.strptime(valor, "%Y-%m").date()
    except ValueError:
        raise argparse.ArgumentTypeError("usa el formato AAAA-MM, por ejemplo 2026-09") from None


def mes_anterior() -> date:
    return (date.today().replace(day=1) - timedelta(days=1)).replace(day=1)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    parser.add_argument(
        "-n",
        "--registros",
        type=int,
        default=20_000,
        help="número de transacciones (default: 20000)",
    )
    parser.add_argument(
        "--mes",
        type=mes_valido,
        default=mes_anterior(),
        help="mes a simular, AAAA-MM (default: mes anterior)",
    )
    parser.add_argument(
        "--semilla", type=int, help="semilla para reproducir un set exacto (default: aleatoria)"
    )
    parser.add_argument(
        "--categoria-dominante",
        choices=list(cfg.FACTOR_DOMINANTE),
        help="categoría en la que se gasta de más (default: aleatoria)",
    )
    parser.add_argument(
        "-o", "--salida", type=Path, help="ruta del CSV (default: output/transacciones_AAAA-MM.csv)"
    )
    parser.add_argument(
        "-v",
        "--verbose",
        action="store_true",
        help="imprime el resumen con los patrones inyectados (revela la respuesta)",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    semilla = args.semilla if args.semilla is not None else random.randrange(2**32)
    rng = random.Random(semilla)
    fake = Faker(LOCALE)
    fake.seed_instance(semilla)

    inicio = args.mes
    ultimo_dia = calendar.monthrange(inicio.year, inicio.month)[1]
    perfil = crear_perfil(fake, rng, inicio, ultimo_dia, args.categoria_dominante)
    comercios = crear_comercios(fake, rng, perfil)

    fijas = generar_cargos_fijos(fake, rng, perfil, inicio, ultimo_dia) + generar_cargos_viaje(
        fake, rng, perfil, inicio
    )
    n_variables = args.registros - len(fijas)
    if n_variables < 1:
        sys.exit(f"--registros debe ser mayor que {len(fijas)} (número de cargos fijos)")
    variables = generar_variables(fake, rng, perfil, comercios, inicio, ultimo_dia, n_variables)

    filas = sorted(fijas + variables, key=lambda fila: fila["fecha"])
    for i, fila in enumerate(filas, start=1):
        fila["id_transaccion"] = f"TX{i:06d}"

    salida = args.salida or Path("output") / f"transacciones_{inicio:%Y-%m}.csv"
    escribir_csv(filas, salida)
    if args.verbose:
        imprimir_resumen(filas, perfil, salida, semilla, ultimo_dia)


if __name__ == "__main__":
    main()
