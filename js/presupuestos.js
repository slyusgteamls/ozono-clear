// Lógica compartida del sistema de presupuestos (panel del equipo y página del cliente).
export const KEY = "ozono-presupuestos-v2";
export const TZ = "America/Argentina/Buenos_Aires";
export const TIPOS = {
  V: ["Vehículos", "Autos, camionetas, utilitarios y remises"],
  M: ["Micros y transporte", "Micros de larga distancia, minibuses, colectivos y flotas"],
  H: ["Hogares", "Casas, departamentos y habitaciones particulares"],
  L: ["Locales comerciales", "Salones, negocios, gimnasios y lavaderos"],
  E: ["Empresas y oficinas", "Oficinas, salas de reunión y espacios comunes"],
  S: ["Sanitarios", "Baños y vestuarios cuando se presupuestan por separado"],
  I: ["Instituciones", "Clubes, escuelas, cuarteles y otros establecimientos"],
  O: ["Otros servicios", "Trabajos especiales que no encajan en las categorías anteriores"],
};
export const ESTADOS = { borrador: "Borrador", enviado: "Enviado", aceptado: "Aceptado", realizado: "Realizado" };
export const CODIGO = /^OCB-[VMHLESIO]-\d{6}-\d{3}$/;

export const hoy = () => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(new Date());
export const fechaHora = (iso) => new Intl.DateTimeFormat("es-AR", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
export const fechaLarga = (ymd) => new Intl.DateTimeFormat("es-AR", { timeZone: TZ, dateStyle: "long" }).format(new Date(ymd + "T12:00:00-03:00"));
export const money = (n) => {
  const d = Number.isInteger(n) ? 0 : 2; // $ 250.000 o $ 250.000,50
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
};
export const VALIDEZ_DIAS = 7;
/** Último día en que se puede aceptar (fecha del presupuesto + días de validez), AAAA-MM-DD. */
export const venceEl = (c) => {
  const d = new Date(`${c.fecha}T12:00:00-03:00`);
  d.setUTCDate(d.getUTCDate() + c.validezDias);
  return new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(d);
};
export const vencido = (c, ahora = hoy()) => ahora > venceEl(c);
const aammdd = (ymd) => ymd.slice(2).replaceAll("-", "");

/** Huella SHA-256 del contenido exacto del presupuesto (cambia si cambia cualquier dato). */
export async function huella(c) {
  const bytes = new TextEncoder().encode(JSON.stringify([c.codigo, c.version, c.cliente, c.servicio, c.importe, c.fecha, c.validezDias, c.condiciones]));
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))].map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const huellaCorta = (h) => h.slice(0, 16).toUpperCase().match(/.{4}/g).join("-");

/** Devuelve un mensaje de error en español, o null si el contenido es válido. */
export function errorContenido(c) {
  const t = (v, max) => typeof v === "string" && v.trim().length > 0 && v.length <= max;
  if (!c || typeof c !== "object") return "El presupuesto no tiene el formato esperado.";
  if (!CODIGO.test(c.codigo)) return "El código del presupuesto no es válido.";
  if (!Number.isInteger(c.version) || c.version < 1) return "La versión no es válida.";
  if (!t(c.cliente, 120)) return "Completá el nombre del cliente (hasta 120 caracteres).";
  if (!t(c.servicio, 300)) return "Completá el servicio a realizar (hasta 300 caracteres).";
  if (typeof c.importe !== "number" || !Number.isFinite(c.importe) || c.importe < 0 || c.importe > 1e10) return "El importe debe ser un número válido.";
  if (typeof c.fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(c.fecha)) return "La fecha no es válida.";
  if (!Number.isInteger(c.validezDias) || c.validezDias < 1 || c.validezDias > 90) return "La validez debe ser de 1 a 90 días.";
  if (!t(c.condiciones, 3000)) return "Completá las condiciones del trabajo (hasta 3000 caracteres).";
  return null;
}

// --- enlace: el contenido viaja en el fragmento (#...), que el navegador nunca envía a ningún servidor
const aB64 = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const codificar = (c) => aB64(JSON.stringify(c));
export function decodificar(token) {
  try {
    const bin = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
    const c = JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (ch) => ch.charCodeAt(0))));
    return errorContenido(c) ? null : c;
  } catch (e) {
    console.error("Enlace de presupuesto ilegible", e);
    return null;
  }
}

/** Código OCB-[TIPO]-[AAMMDD]-[NNN]. El correlativo es diario y no se repite entre tipos. */
export function nuevoCodigo(tipo, data, fecha) {
  if (!(tipo in TIPOS)) throw new Error("Elegí un tipo de trabajo.");
  const marca = `-${aammdd(fecha)}-`;
  const n = Math.max(0, ...data.presupuestos.filter((p) => p.codigo.includes(marca)).map((p) => Number(p.codigo.slice(-3)))) + 1;
  if (n > 999) throw new Error("Se alcanzó el máximo de 999 presupuestos para esa fecha.");
  return `OCB-${tipo}${marca}${String(n).padStart(3, "0")}`;
}

// --- mensaje de aceptación (lo arma el cliente y lo lee el panel)
export function mensajeAceptacion(c, hash, nombre, ahora = new Date()) {
  return [
    "ACEPTACIÓN DE PRESUPUESTO", `Código: ${c.codigo}`, `Versión: V${c.version}`, `Huella: ${huellaCorta(hash)}`, `Importe: ${money(c.importe)}`,
    `Acepta: ${nombre.trim()}`, "Declaro haber leído y aceptado este presupuesto tal como figura en el enlace.",
    `Fecha y hora del dispositivo: ${new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "medium" }).format(ahora)}`,
  ].join("\n");
}
export function leerMensaje(txt) {
  const g = (re) => (txt.match(re) || [])[1]?.trim();
  return { codigo: g(/Código:\s*(OCB-[A-Z]-\d{6}-\d{3})/), version: Number(g(/Versión:\s*V(\d+)/)) || null, huella: g(/Huella:\s*([0-9A-F]{4}(?:-[0-9A-F]{4}){3})/i)?.toUpperCase(), nombre: g(/Acepta:\s*(.+)/) };
}

// --- almacenamiento local del equipo
export function validarBase(d) {
  if (!d || !Array.isArray(d.presupuestos)) return "El archivo no tiene la estructura de una copia de presupuestos.";
  const vistos = new Set();
  for (const p of d.presupuestos) {
    if (!p || !CODIGO.test(p.codigo) || vistos.has(p.codigo)) return "Hay un código inválido o repetido.";
    vistos.add(p.codigo);
    if (!(p.estado in ESTADOS) || !Array.isArray(p.versiones) || !p.versiones.length) return `El presupuesto ${p.codigo} está incompleto.`;
    for (const v of p.versiones) {
      const err = errorContenido(v?.contenido);
      if (err || v.contenido.codigo !== p.codigo || !/^[0-9a-f]{64}$/.test(v.huella) || typeof v.creada !== "string") return `El presupuesto ${p.codigo} tiene una versión inválida${err ? ": " + err : "."}`;
      if (v.aceptacion && (typeof v.aceptacion.nombre !== "string" || typeof v.aceptacion.fechaHora !== "string")) return `La aceptación de ${p.codigo} está incompleta.`;
    }
  }
  return null;
}
export function cargar() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return { presupuestos: [] };
  try {
    const d = JSON.parse(raw);
    const err = validarBase(d);
    if (err) throw new Error(err);
    return d;
  } catch (e) {
    console.error("Presupuestos guardados ilegibles; se conserva una copia sin modificar.", e);
    localStorage.setItem(KEY + "-corrupto", raw);
    return { presupuestos: [], corrupto: true };
  }
}
export function guardar(d) {
  const err = validarBase(d);
  if (err) throw new Error(err);
  localStorage.setItem(KEY, JSON.stringify({ presupuestos: d.presupuestos }));
}
