export const KEY = "ozono-content-v2";

export const DEFAULTS = {
  "settings": {
    "nombre": "Ozono Clear Baradero",
    "eslogan": "No es perfume, es limpieza que se siente.",
    "email": "OzonoClearBaradero@gmail.com",
    "whatsapp": "5493487616174",
    "instagram": "OzonoClear.ar",
    "maps": "",
    "mapsQuery": "Baradero, Buenos Aires"
  },
  "apps": [
    {
      "id": "autos",
      "titulo": "Autos particulares y remises",
      "texto": "Olores persistentes por humo, humedad, comida o uso diario, incluso en zonas de difícil acceso.",
      "mensaje": "Hola, consulto por un tratamiento para: Autos particulares y remises.",
      "activa": true,
      "destacada": true,
      "ficha": true
    },
    {
      "id": "transporte",
      "titulo": "Combis, micros y colectivos",
      "texto": "Olores acumulados por el uso diario de pasajeros, humedad, humo o comida en el interior de la unidad.",
      "mensaje": "Hola, consulto por un tratamiento para: Combis, micros y colectivos.",
      "activa": true,
      "destacada": true,
      "ficha": true
    },
    {
      "id": "reparto",
      "titulo": "Vehículos de reparto y flotas",
      "texto": "Olores por el uso intensivo en vehículos de reparto y flotas. Servicios programados a consulta.",
      "mensaje": "Hola, consulto por un tratamiento para: Vehículos de reparto y flotas.",
      "activa": true,
      "destacada": true,
      "ficha": true
    },
    {
      "id": "comercios",
      "titulo": "Comercios, gimnasios y oficinas",
      "texto": "Ambientes cerrados donde el olor afecta la atención al público, la actividad o el trabajo diario.",
      "mensaje": "Hola, consulto por un tratamiento para: Comercios, gimnasios y oficinas.",
      "activa": true,
      "destacada": true,
      "ficha": true
    },
    {
      "id": "viviendas",
      "titulo": "Viviendas y alojamientos temporarios",
      "texto": "Olores que persisten en viviendas y alojamientos entre un uso y otro.",
      "mensaje": "Hola, consulto por un tratamiento para: Viviendas y alojamientos temporarios.",
      "activa": true,
      "destacada": true,
      "ficha": true
    }
  ],
  "promos": [],
  "banners": [],
  "faqs": [
    {
      "id": "perfume",
      "pregunta": "¿Es lo mismo que un perfume o aromatizante?",
      "respuesta": "No. Perfumar puede cubrir el aroma temporalmente; el tratamiento con ozono busca actuar sobre el olor sin agregar fragancia.",
      "activa": true
    },
    {
      "id": "dentro",
      "pregunta": "¿Puedo quedarme durante la aplicación?",
      "respuesta": "No. Durante la aplicación no puede haber personas, mascotas ni plantas en el espacio tratado. El reingreso se hace una vez verificadas las condiciones seguras.",
      "activa": true
    },
    {
      "id": "seguro",
      "pregunta": "¿Es seguro para personas, mascotas y plantas?",
      "respuesta": "El ozono puede ser perjudicial si se usa de forma inadecuada. Por eso no puede haber personas, mascotas ni plantas durante la aplicación.",
      "activa": true
    },
    {
      "id": "garantia",
      "pregunta": "¿Garantizan que el olor desaparece por completo?",
      "respuesta": "No podemos garantizarlo. El resultado depende del origen del olor, los materiales y el estado del ambiente.",
      "activa": true
    },
    {
      "id": "espacios",
      "pregunta": "¿Qué espacios pueden tratarse?",
      "respuesta": "Vehículos particulares, remises, combis, micros, colectivos, vehículos de reparto, gimnasios, comercios, oficinas, viviendas y alojamientos temporarios. Cada caso se evalúa al consultar.",
      "activa": true
    },
    {
      "id": "empresas",
      "pregunta": "¿Hacen tratamientos periódicos para empresas?",
      "respuesta": "Podés consultarnos por servicios programados para flotas, empresas de transporte, gimnasios y comercios. Se define a consulta.",
      "activa": true
    },
    {
      "id": "costo",
      "pregunta": "¿Cuánto dura y cuánto cuesta?",
      "respuesta": "Depende del tipo de espacio y de la situación. Consultanos por WhatsApp y te pasamos los detalles.",
      "activa": true
    },
    {
      "id": "zona",
      "pregunta": "¿Trabajan fuera de Baradero?",
      "respuesta": "Trabajamos desde Baradero y podés consultarnos por servicios en otras zonas.",
      "activa": true
    }
  ]
};

export const ZONAS = { inicio: "Portada (debajo del título)", servicios: "Página de servicios" };
export const today = () => new Date().toLocaleDateString("sv");
/** Una promoción o banner está vigente si está activo y hoy cae dentro de su período. */
export const isLive = (x) => x.activa && (!x.inicio || x.inicio <= today()) && (!x.fin || today() <= x.fin);

const isText = (v) => typeof v === "string" && v.trim().length > 0;

/** Devuelve un mensaje de error en español, o null si los datos son válidos. */
export function validate(d) {
  if (!d || typeof d !== "object") return "El contenido no tiene el formato esperado.";
  const s = d.settings;
  if (!s || !["nombre", "eslogan", "email", "whatsapp", "instagram"].every((k) => isText(s[k]))) return "Faltan datos de configuración.";
  if (s.mapsQuery !== undefined && (typeof s.mapsQuery !== "string" || s.mapsQuery.length > 120)) return "La zona del mapa debe ser un texto de hasta 120 caracteres.";
  if (s.maps && !/^https:\/\//.test(s.maps)) return "El enlace de Google Maps debe empezar con https://.";
  if (!/^\d{10,15}$/.test(s.whatsapp)) return "El WhatsApp debe tener solo números, con código de país (ej: 5493487616174).";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email)) return "El correo electrónico no es válido.";
  if (!Array.isArray(d.apps)) return "La lista de aplicaciones no es válida.";
  const ids = new Set();
  for (const a of d.apps) {
    if (!a || !isText(a.id) || !isText(a.titulo) || !isText(a.texto) || !isText(a.mensaje) || typeof a.activa !== "boolean") return "Cada aplicación necesita título, descripción y mensaje de WhatsApp.";
    if (ids.has(a.id)) return "Hay aplicaciones con identificador repetido.";
    ids.add(a.id);
  }
  if (d.faqs !== undefined && !Array.isArray(d.faqs)) return "La lista de preguntas frecuentes no es válida.";
  for (const f of d.faqs ?? []) {
    if (!f || !isText(f.id) || !isText(f.pregunta) || !isText(f.respuesta) || typeof f.activa !== "boolean") return "Cada pregunta frecuente necesita pregunta y respuesta.";
  }
  for (const [key, label] of [["promos", "promoción"], ["banners", "banner"]]) {
    const list = d[key] ?? [];
    if (!Array.isArray(list)) return `La lista de ${label}s no es válida.`;
    for (const x of list) {
      if (!x || !isText(x.id) || !isText(x.titulo) || !isText(x.texto) || typeof x.activa !== "boolean") return `Cada ${label} necesita título y texto.`;
      if ([x.inicio, x.fin].some((f) => f && !/^\d{4}-\d{2}-\d{2}$/.test(f))) return `Hay una fecha no válida en un ${label}.`;
      if (x.inicio && x.fin && x.fin < x.inicio) return `En un ${label}, la fecha de fin es anterior a la de inicio.`;
      if (key === "banners") {
        if (!(x.zona in ZONAS)) return "Un banner tiene una ubicación no válida.";
        if (x.enlace && !/^(https?:\/\/|\/)/.test(x.enlace)) return "El enlace de un banner debe empezar con https://, http:// o /.";
      }
    }
  }
  return null;
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const data = JSON.parse(raw);
    const err = validate(data);
    if (err) throw new Error(err);
    data.settings.maps ??= "";
    data.settings.mapsQuery ??= DEFAULTS.settings.mapsQuery;
    data.promos ??= [];
    data.banners ??= [];
    data.faqs ??= structuredClone(DEFAULTS.faqs);
    return data;
  } catch (e) {
    console.error("Contenido guardado no utilizable; se usan los valores iniciales.", e);
    return structuredClone(DEFAULTS);
  }
}

export function save(data) {
  const err = validate(data);
  if (err) throw new Error(err);
  localStorage.setItem(KEY, JSON.stringify(data));
}
