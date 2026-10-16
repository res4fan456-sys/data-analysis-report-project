// Clasificación de PRs de una ola y conteo de lo que dicen sus comentarios:
// cuántas corridas de evidencia y pasadas de crítico hubo, y cuántos
// hallazgos BLOQUEA/NO BLOQUEA dejó cada veredicto. Funciones puras sobre
// los datos que ya trae `gh pr list`/`gh pr view --json comments,files`; el
// I/O de invocar `gh` es de `comandos/medir.mjs`. El prefijo de la rama de
// ola (`git.ola` del perfil) se pasa por parámetro; el resto de literales
// (`Ola <id>` en el título, `## Evidencia —`, `VEREDICTO`, `BLOQUEA`) son el
// contrato de la mecánica, igual en todo proyecto.

import { esDeTest } from '../diff-solo-comentarios.mjs';

function escaparRegExp(texto) {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Si el título de la PR menciona la ola (`Ola <ola>` o `(Ola <ola>)`), sin
 * confundirla con una ola distinta que comparte prefijo (`<ola>` dentro de
 * `<ola>-<n>`): el carácter que sigue a `<ola>` no puede ser otro de
 * identificador (letra, dígito o guion) -- si lo fuera, el título en
 * realidad habla de una ola distinta y más larga.
 */
function tituloMencionaLaOla(titulo, ola) {
  return new RegExp(`Ola ${escaparRegExp(ola)}(?![\\w-])`).test(titulo);
}

/**
 * Si una PR es de la ola `ola` (su identificador, sin el prefijo de rama), y
 * de qué tipo: `interna` (`baseRefName == "<prefijo><ola>"`), `cierre`
 * (`headRefName == "<prefijo><ola>"`), o `planeacion-o-archivado` (el
 * título la menciona, sin que su rama tenga nada que ver con la ola).
 * `undefined` si ninguna de las tres se cumple.
 * @returns {'interna'|'cierre'|'planeacion-o-archivado'|undefined}
 */
export function tipoDePrDeLaOla(pr, ola, prefijoDeRama = 'ola/') {
  const ramaDeOla = `${prefijoDeRama}${ola}`;
  if (pr.baseRefName === ramaDeOla) return 'interna';
  if (pr.headRefName === ramaDeOla) return 'cierre';
  if (tituloMencionaLaOla(pr.title, ola)) return 'planeacion-o-archivado';
  return undefined;
}

/** Si una PR es de la ola `ola`, de cualquiera de los tres tipos de `tipoDePrDeLaOla`. */
export function esDeLaOla(pr, ola, prefijoDeRama = 'ola/') {
  return tipoDePrDeLaOla(pr, ola, prefijoDeRama) !== undefined;
}

/** `esDeLaOla`, aplicada a la lista completa que trae `gh pr list`. */
export function prsDeLaOla(prs, ola, prefijoDeRama = 'ola/') {
  return prs.filter((pr) => esDeLaOla(pr, ola, prefijoDeRama));
}

/**
 * Las PRs de `prs` que llevan trabajo de producto: las internas y la de
 * cierre. Deja fuera las de planeación y archivado, cuyo diff es solo de
 * las rutas sin código y normaliza a cero o ruido cualquier línea de código
 * por token o por hora.
 */
export function prsDeProductoDeLaOla(prs, ola, prefijoDeRama = 'ola/') {
  return prs.filter((pr) => {
    const tipo = tipoDePrDeLaOla(pr, ola, prefijoDeRama);
    return tipo === 'interna' || tipo === 'cierre';
  });
}

/**
 * La categoría de merge a la rama principal de una PR de la ola:
 * `cierre-o-arreglo` si es la PR de cierre, `planeacion-o-archivado` si solo
 * la menciona el título. Una PR interna no tiene categoría: su base es la
 * rama de ola, nunca la principal. En un arreglo (una sola issue, sin rama
 * de ola) esta función no aplica -- todas sus PRs son `cierre-o-arreglo`
 * por definición.
 * @returns {'cierre-o-arreglo'|'planeacion-o-archivado'|undefined}
 */
export function categoriaDeMergeDeLaOla(pr, ola, prefijoDeRama = 'ola/') {
  const tipo = tipoDePrDeLaOla(pr, ola, prefijoDeRama);
  if (tipo === 'cierre') return 'cierre-o-arreglo';
  if (tipo === 'planeacion-o-archivado') return 'planeacion-o-archivado';
  return undefined;
}

/** Un mensaje de aviso por cada PR de `prs` que sigue sin mergear, para que quien lea el reporte no confunda sus ceros con una medición real. */
export function avisosDePrsSinMergear(prs) {
  return prs
    .filter((pr) => pr.mergedAt === null)
    .map((pr) => `da medir: la PR #${pr.number} sigue sin mergear -- sus horas de espera y su caché leída por PR salen en 0 hasta que se mergee`);
}

/**
 * Las PRs a medir para `da medir '#<n>'`: si `n` es el número de una PR, esa
 * PR sola -- un arreglo se mide por su propia PR, aunque cierre otra issue.
 * Si no, las PRs cuyo `closingIssuesReferences` incluye la issue `n`
 * (normalmente una, pero nada impide que más de una la cierren). Sin
 * ninguna de las dos, una lista vacía: la cáscara la trata como error, nunca
 * como «mide todo el historial».
 */
export function prsDelArreglo(numero, prs) {
  const porNumeroDePr = prs.find((pr) => pr.number === numero);
  if (porNumeroDePr) return [porNumeroDePr];
  return prs.filter((pr) => (pr.closingIssuesReferences ?? []).some((referencia) => referencia.number === numero));
}

/**
 * Cuántas veces empieza una línea de `texto` con `## Evidencia —`: cada una
 * es una corrida de evidencia (el gate o la suite) pegada en el cuerpo de la
 * PR o en un comentario. El encabezado no tiene que ser lo primero del
 * texto -- una pasada de corrección del PM suele abrir con una frase
 * ("Corregidas las N NO BLOQUEA...") antes de pegar su `## Evidencia —`.
 */
export function contarCorridasDeEvidencia(texto) {
  return (texto.match(/^## Evidencia —/gm) ?? []).length;
}

/** Si `comentario` es una pasada de revisión: contiene la palabra `VEREDICTO`. */
export function esPasadaDeVeredicto(comentario) {
  return comentario.body.includes('VEREDICTO');
}

const REGEX_ENCABEZADO = /^#{1,6}\s+(.*)$/;
// Solo numerado (`1.`): un veredicto de formato viejo marca cada hallazgo con
// una etiqueta en negrita pegada al número (`**1. BLOQUEA: …**`, `**B1. …**`)
// o con viñetas (`-`); ninguna de las dos es un elemento que este contrato
// reconozca -- `veredictoSinFormatoNumerado` avisa de esos casos en vez de
// contarlos mal.
const REGEX_ITEM_NUMERADO_DE_PRIMER_NIVEL = /^\d+\.\s+(.*)$/;
const REGEX_NO_BLOQUEA = /\bNO BLOQUEA\b/;
const REGEX_BLOQUEA_A_SECAS = /\bBLOQUEA\b/;

/** La clase que nombra `texto`: `NO BLOQUEA` primero (para no leer su `BLOQUEA` interno como la palabra sola), luego `BLOQUEA`; ninguna, si no nombra ninguna de las dos. Sensible a mayúsculas: es el marcador vigente, no una mención cualquiera de la palabra. */
function claseNombradaPor(texto) {
  if (REGEX_NO_BLOQUEA.test(texto)) return 'no-bloquea';
  if (REGEX_BLOQUEA_A_SECAS.test(texto)) return 'bloquea';
  return undefined;
}

/** Si `contenido` (ya sin la marca de lista) es el hueco de "sin hallazgos" bajo un encabezado de clase que no tiene ningún elemento que reportar. */
function esNinguno(contenido) {
  return /^ninguno\.?$/i.test(contenido.trim());
}

/**
 * Cuenta los hallazgos `BLOQUEA` y `NO BLOQUEA` de un veredicto (el formato
 * de *Qué entregar* del skill `desarrollo-autonomo-critico`): un hallazgo es
 * un elemento NUMERADO de primer nivel, sin sangría (`^\d+\. `). Su clase la
 * da EXCLUSIVAMENTE el encabezado Markdown (`#`...) bajo el que cae, cuando
 * ese encabezado nombra `BLOQUEA` o `NO BLOQUEA`; un elemento fuera de un
 * encabezado de clase no cuenta, nombre o no una de las dos palabras en su
 * propio texto (un veredicto de formato viejo repite sus hallazgos con
 * marcadores planos bajo un `### Triage del PM` que no es un encabezado de
 * clase, y contarlos ahí los duplica). "Ninguno." no cuenta. Los subpuntos
 * sangrados, las viñetas (`-`/`*`) y las filas de tabla nunca son un
 * elemento numerado de primer nivel, así que ya quedan fuera del patrón sin
 * necesitar una guarda aparte.
 */
export function contarHallazgos(texto) {
  let bloquea = 0;
  let noBloquea = 0;
  let claseDeLaSeccion;

  for (const linea of texto.split('\n')) {
    if (linea.trim() === '') continue;

    const encabezado = linea.match(REGEX_ENCABEZADO);
    if (encabezado) {
      claseDeLaSeccion = claseNombradaPor(encabezado[1] ?? '');
      continue;
    }

    if (claseDeLaSeccion === undefined) continue;
    if (/^\s/.test(linea)) continue; // sangrado: nunca de primer nivel

    const item = linea.match(REGEX_ITEM_NUMERADO_DE_PRIMER_NIVEL);
    if (!item) continue;
    if (esNinguno(item[1] ?? '')) continue;

    if (claseDeLaSeccion === 'bloquea') bloquea += 1;
    else noBloquea += 1;
  }

  return { bloquea, noBloquea };
}

/**
 * Si `texto` (un veredicto: un comentario ya filtrado por `esPasadaDeVeredicto`)
 * no sigue el formato numerado que `contarHallazgos` sabe leer: o bien no
 * trae NINGÚN encabezado de clase (`BLOQUEA`/`NO BLOQUEA`, en mayúsculas) en
 * todo el texto -- un veredicto del formato vigente siempre trae al menos
 * una de las dos secciones, aunque sea "Ninguno." --, o bien trae alguna con
 * contenido real -- ni vacía ni reducida a "Ninguno." -- pero SIN ningún
 * elemento numerado de primer nivel que `contarHallazgos` pueda contar. En
 * los dos casos sus hallazgos quedan sin contar en vez de adivinarse; la
 * cáscara avisa de esto por stderr en vez de publicar una cifra que no
 * corresponde al texto.
 */
export function veredictoSinFormatoNumerado(texto) {
  let claseDeLaSeccion;
  let tuvoContenido = false;
  let tuvoItemNumerado = false;
  let huboEncabezadoDeClase = false;
  let sinFormato = false;

  const cerrarSeccion = () => {
    if (claseDeLaSeccion !== undefined && tuvoContenido && !tuvoItemNumerado) sinFormato = true;
  };

  for (const linea of texto.split('\n')) {
    const encabezado = linea.match(REGEX_ENCABEZADO);
    if (encabezado) {
      cerrarSeccion();
      claseDeLaSeccion = claseNombradaPor(encabezado[1] ?? '');
      if (claseDeLaSeccion !== undefined) huboEncabezadoDeClase = true;
      tuvoContenido = false;
      tuvoItemNumerado = false;
      continue;
    }

    if (claseDeLaSeccion === undefined) continue;
    if (linea.trim() === '') continue;

    const item = !/^\s/.test(linea) ? linea.match(REGEX_ITEM_NUMERADO_DE_PRIMER_NIVEL) : null;
    if (item && esNinguno(item[1] ?? '')) continue; // "1. Ninguno." declara cero, no es contenido sin formato
    if (!item && esNinguno(linea.trim())) continue; // "Ninguno." como párrafo suelto, sin marca de lista

    tuvoContenido = true;
    if (item) tuvoItemNumerado = true;
  }
  cerrarSeccion();

  return sinFormato || !huboEncabezadoDeClase;
}

/**
 * Los hallazgos BLOQUEA/NO BLOQUEA de un veredicto, o cero de los dos si
 * `veredictoSinFormatoNumerado` dice que no sigue el formato. El aviso que
 * la cáscara imprime por esa razón («sus BLOQUEA/NO BLOQUEA de esa pasada no
 * se cuentan») tiene que ser cierto: una sección de clase sin elemento
 * numerado no puede dejar pasar los hallazgos que sí cuenta
 * `contarHallazgos` en OTRA sección del mismo veredicto que sí sigue el
 * formato. Esta es la única función que la cáscara debe llamar para saber
 * qué aporta un veredicto: el aviso y el conteo salen siempre de la misma
 * decisión, nunca de dos pasadas independientes por el texto.
 */
export function hallazgosDeVeredicto(texto) {
  if (veredictoSinFormatoNumerado(texto)) return { bloquea: 0, noBloquea: 0 };
  return contarHallazgos(texto);
}

/** Si `ruta` es un archivo de test, con el mismo criterio que `da diff-solo-comentarios` (tests/, test_*.py, *.test.ts, e2e/…). */
export function esArchivoDeTest(ruta) {
  return esDeTest(ruta);
}

/**
 * Líneas añadidas/borradas, repartidas entre archivos de producto y de test según `esArchivoDeTest`.
 * @param {Array<{path: string, additions: number, deletions: number}>} archivos
 */
export function lineasDeProductoYTest(archivos) {
  const producto = { additions: 0, deletions: 0 };
  const test = { additions: 0, deletions: 0 };
  for (const archivo of archivos) {
    const destino = esArchivoDeTest(archivo.path) ? test : producto;
    destino.additions += archivo.additions;
    destino.deletions += archivo.deletions;
  }
  return { producto, test };
}
