"""Catálogos y parámetros que definen el perfil de gasto simulado.

Todo lo que se quiera ajustar (zonas, comercios, montos, horarios, intensidad de
los patrones) vive aquí; `generar_transacciones.py` solo contiene la lógica.
"""

from typing import NamedTuple


class Plantilla(NamedTuple):
    """Plantilla de comercio. `nombre` usa la sintaxis de Faker: {{last_name}}, etc."""

    nombre: str
    monto_min: float
    monto_max: float
    instancias: int = 1
    movil: bool = False  # True: la ubicación cambia en cada compra (apps de transporte)


# --- Ubicaciones -------------------------------------------------------------

# Zonas de la ciudad donde vive la persona: centro aproximado (lat, lon).
# En cada ejecución se asignan al azar los roles casa / trabajo / zona favorita.
ZONAS_LOCALES = {
    "Roma Norte, CDMX": (19.4194, -99.1617),
    "Condesa, CDMX": (19.4113, -99.1740),
    "Polanco, CDMX": (19.4326, -99.1946),
    "Coyoacán, CDMX": (19.3467, -99.1617),
    "Santa Fe, CDMX": (19.3592, -99.2597),
    "Centro Histórico, CDMX": (19.4326, -99.1332),
}

# Destinos posibles para el viaje de fin de semana (se elige uno por ejecución).
DESTINOS_VIAJE = {
    "Guadalajara, Jal.": (20.6767, -103.3475),
    "Oaxaca, Oax.": (17.0732, -96.7266),
    "Cancún, Q. Roo": (21.1619, -86.8515),
    "Monterrey, N.L.": (25.6866, -100.3161),
    "Puerto Vallarta, Jal.": (20.6534, -105.2253),
}

# Radio (en grados) alrededor del centro de la zona: ~0.006° ≈ 650 m.
RADIO_COMERCIO = 0.006
RADIO_MOVIL = 0.012
RADIO_DESTINO = 0.02

# Probabilidad de que un comercio caiga en cada rol de zona, según el perfil.
PERFILES_ZONA = {
    "ocio": {"favorita": 0.55, "trabajo": 0.15, "casa": 0.15, "otras": 0.15},
    "hogar": {"casa": 0.70, "trabajo": 0.15, "favorita": 0.05, "otras": 0.10},
    "mixto": {"casa": 0.25, "trabajo": 0.25, "favorita": 0.30, "otras": 0.20},
    "traslado": {"casa": 0.35, "trabajo": 0.35, "favorita": 0.20, "otras": 0.10},
}

# --- Cuentas -----------------------------------------------------------------

CUENTAS = ["Débito Nómina", "Tarjeta de Crédito", "Cuenta Digital"]

# --- Categorías de gasto variable -------------------------------------------

# peso:      frecuencia relativa de la categoría.
# horas:     (inicio, fin, peso) en formato 24 h; el rango puede cruzar medianoche.
# cuentas:   peso de cada cuenta para esta categoría.
# zonas:     perfil de zona (ver PERFILES_ZONA) para ubicar los comercios.
CATEGORIAS = {
    "Comida": {
        "peso": 30,
        "horas": [(8, 11, 1.5), (13, 16, 3), (19, 23, 2), (23, 1, 0.5)],
        "cuentas": {"Débito Nómina": 2, "Tarjeta de Crédito": 5, "Cuenta Digital": 3},
        "zonas": "ocio",
        "comercios": [
            Plantilla("Taquería {{last_name}}", 60, 250, 3),
            Plantilla("Café {{first_name}}", 45, 160, 2),
            Plantilla("Restaurante {{last_name}}", 250, 1200, 3),
            Plantilla("Fonda Doña {{first_name_female}}", 80, 180, 2),
            Plantilla("Pizzería {{last_name}}", 150, 450, 1),
            Plantilla("Sushi {{last_name}}", 200, 650, 1),
        ],
    },
    "Transporte": {
        "peso": 20,
        "horas": [(7, 10, 3), (18, 21, 3), (21, 2, 1)],
        "cuentas": {"Débito Nómina": 2, "Tarjeta de Crédito": 2, "Cuenta Digital": 6},
        "zonas": "traslado",
        "comercios": [
            Plantilla("Uber", 60, 350, movil=True),
            Plantilla("DiDi", 55, 320, movil=True),
            Plantilla("Recarga Tarjeta de Movilidad", 50, 200),
            Plantilla("Gasolinera {{last_name}}", 400, 1100, 2),
            Plantilla("Estacionamiento {{last_name}}", 30, 120, 2),
        ],
    },
    "Supermercado": {
        "peso": 12,
        "horas": [(10, 14, 1), (17, 21, 2)],
        "cuentas": {"Débito Nómina": 7, "Tarjeta de Crédito": 3, "Cuenta Digital": 0},
        "zonas": "hogar",
        "comercios": [
            Plantilla("Súper {{last_name}}", 300, 2500, 2),
            Plantilla("Abarrotes {{last_name}}", 20, 200, 3),
            Plantilla("Minisúper {{last_name}}", 30, 250, 2),
        ],
    },
    "Entretenimiento": {
        "peso": 8,
        "horas": [(17, 20, 1), (20, 3, 3)],
        "cuentas": {"Débito Nómina": 0, "Tarjeta de Crédito": 7, "Cuenta Digital": 3},
        "zonas": "ocio",
        "comercios": [
            Plantilla("Bar {{last_name}}", 250, 1500, 3),
            Plantilla("Cantina La {{first_name_female}}", 200, 900, 2),
            Plantilla("Mezcalería {{last_name}}", 300, 1200, 1),
            Plantilla("Cine {{last_name}}", 90, 350, 1),
            Plantilla("Antro {{last_name}}", 400, 2500, 1),
        ],
    },
    "Compras": {
        "peso": 5,
        "horas": [(11, 15, 1.5), (16, 21, 2)],
        "cuentas": {"Débito Nómina": 2, "Tarjeta de Crédito": 8, "Cuenta Digital": 0},
        "zonas": "mixto",
        "comercios": [
            Plantilla("Tienda de ropa {{last_name}}", 400, 2500, 2),
            Plantilla("Librería {{last_name}}", 150, 800, 1),
            Plantilla("Electrónica {{last_name}}", 300, 6000, 1),
            Plantilla("Zapatería {{last_name}}", 600, 2200, 1),
        ],
    },
    "Salud": {
        "peso": 4,
        "horas": [(9, 14, 1.5), (16, 20, 1)],
        "cuentas": {"Débito Nómina": 6, "Tarjeta de Crédito": 4, "Cuenta Digital": 0},
        "zonas": "hogar",
        "comercios": [
            Plantilla("Farmacia {{last_name}}", 80, 900, 3),
            Plantilla("Consultorio Dr. {{last_name}}", 500, 1200, 1),
            Plantilla("Laboratorio {{last_name}}", 300, 1500, 1),
        ],
    },
}

# Comercios del destino de viaje (solo se usan durante el fin de semana de viaje).
COMERCIOS_VIAJE = {
    "Comida": [
        Plantilla("Restaurante {{last_name}}", 250, 1500, 3),
        Plantilla("Taquería {{last_name}}", 80, 300, 2),
        Plantilla("Café {{first_name}}", 50, 180, 2),
    ],
    "Entretenimiento": [
        Plantilla("Bar {{last_name}}", 300, 1800, 2),
        Plantilla("Tour guiado {{last_name}}", 500, 2500, 1),
    ],
    "Compras": [
        Plantilla("Artesanías {{last_name}}", 200, 2500, 2),
        Plantilla("Tienda de recuerdos {{last_name}}", 100, 800, 1),
    ],
    "Transporte": [
        Plantilla("Uber", 70, 350, movil=True),
        Plantilla("Taxi de sitio", 120, 500, movil=True),
    ],
}

# Peso de cada categoría durante los días de viaje.
PESOS_VIAJE = {"Comida": 50, "Entretenimiento": 20, "Transporte": 20, "Compras": 10}

# --- Cargos fijos (una vez al mes) -------------------------------------------

# (concepto, categoría, monto_min, monto_max, día_min, día_max, cuenta)
CARGOS_FIJOS = [
    ("Renta departamento", "Vivienda", 9000, 16000, 1, 5, "Débito Nómina"),
    ("CFE - Recibo de luz", "Servicios", 350, 900, 8, 12, "Débito Nómina"),
    ("Internet hogar", "Servicios", 499, 699, 9, 11, "Débito Nómina"),
    ("Plan de telefonía móvil", "Servicios", 299, 499, 18, 22, "Tarjeta de Crédito"),
    ("Gas natural", "Servicios", 300, 700, 20, 26, "Débito Nómina"),
    ("Netflix", "Suscripciones", 299, 299, 3, 3, "Tarjeta de Crédito"),
    ("Spotify", "Suscripciones", 129, 129, 7, 7, "Tarjeta de Crédito"),
    ("Gimnasio {{last_name}}", "Suscripciones", 699, 1200, 1, 3, "Tarjeta de Crédito"),
    ("Almacenamiento en la nube", "Suscripciones", 49, 49, 14, 14, "Tarjeta de Crédito"),
]

# Cargos del viaje: transporte comprado días antes y hotel cobrado al salir.
MONTO_TRANSPORTE_VIAJE = (2500, 7500)
DIAS_ANTICIPACION_VIAJE = (5, 15)
MONTO_NOCHE_HOTEL = (1500, 4000)

# --- Intensidad de los patrones ----------------------------------------------

# Multiplicador del volumen de transacciones por día de la semana (lunes = 0).
PESO_DIA_SEMANA = [0.9, 0.9, 1.0, 1.0, 1.3, 1.5, 1.2]

FACTOR_QUINCENA = 2.5  # días de pago: 15 y último del mes
FACTOR_POST_QUINCENA = 1.8  # día siguiente al pago: 16 y 1
FACTOR_PRE_QUINCENA = 0.7  # 3 días antes de cada pago ("la cuesta")
FACTOR_VIAJE = 1.3

# Ajuste de categorías por tipo de día (multiplica su peso).
AJUSTE_FIN_DE_SEMANA = {"Entretenimiento": 2.0, "Comida": 1.2, "Compras": 1.3, "Transporte": 0.7}
AJUSTE_QUINCENA = {"Compras": 2.0, "Entretenimiento": 1.5, "Supermercado": 1.6}

# Categoría en la que la persona "gasta de más" (se elige al azar si no se indica).
# Valor: cuántas veces más transacciones tiene. Transporte necesita más porque
# cada viaje es barato; así cualquiera de ellas queda arriba con claridad.
FACTOR_DOMINANTE = {"Comida": 2.5, "Transporte": 6.0, "Entretenimiento": 3.0, "Compras": 3.0}
FACTOR_MONTO_DOMINANTE = 1.4  # y además son más caras

FACTOR_MONTO_QUINCENA = 1.2
FACTOR_MONTO_VIAJE = 1.3

# Zona favorita: sus comercios se vuelven más populares.
FACTOR_ZONA_FAVORITA = 2.0
# Popularidad tipo Zipf: unos pocos comercios concentran la mayoría de compras.
EXPONENTE_POPULARIDAD = 0.9

# Compras atípicas (montos muy por encima de lo normal).
PROB_ATIPICO = 0.003
RANGO_ATIPICO = (3, 6)
