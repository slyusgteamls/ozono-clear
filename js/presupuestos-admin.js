import { TIPOS, ESTADOS, hoy, fechaHora, fechaLarga, money, huella, huellaCorta, codificar, nuevoCodigo, errorContenido, leerMensaje, venceEl, vencido, TZ, cargar, guardar, validarBase } from "./presupuestos.js";

const SESSION = "ozono-admin";
const $ = (s) => document.querySelector(s);
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
};
let data = { presupuestos: [] };

function say(msg, ok = true) {
  const s = $("#status");
  s.textContent = msg;
  s.className = ok ? "ok" : "bad";
}
function persist() {
  try {
    guardar(data);
    return true;
  } catch (e) {
    console.error("No se pudieron guardar los presupuestos", e);
    say(e.message || "No se pudo guardar. Revisá el espacio del navegador.", false);
    return false;
  }
}
const ultima = (p) => p.versiones.at(-1);
const campo = (label, input) => el("label", {}, label, input);

/** Formulario en línea: campos = [nombre, etiqueta, propiedades, tag]; alEnviar devuelve un error (texto) o nada. */
function formulario(campos, etiqueta, alEnviar) {
  const inputs = {};
  const f = el("form", { className: "inline", noValidate: true });
  for (const [name, label, props, tag] of campos) {
    inputs[name] = el(tag || "input", { name, ...props });
    f.append(campo(label, inputs[name]));
  }
  const err = el("p", { className: "bad", role: "alert", hidden: true });
  f.append(err, el("button", { type: "submit", className: "primary", textContent: etiqueta }));
  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.hidden = true;
    const msg = await alEnviar(Object.fromEntries(Object.entries(inputs).map(([k, i]) => [k, i.value])), inputs);
    if (msg) { err.textContent = msg; err.hidden = false; }
  });
  return f;
}

function contenidoDe(v, codigo, version) {
  return { codigo, version, cliente: v.cliente.trim(), servicio: v.servicio.trim(), importe: Number(String(v.importe).replace(/\./g, "").replace(",", ".")), fecha: v.fecha, validezDias: Number(v.validez), condiciones: v.condiciones.trim() };
}

async function crear(v) {
  data = cargar();
  let codigo;
  try { codigo = nuevoCodigo(v.tipo, data, v.fecha || hoy()); } catch (e) { return e.message; }
  const c = contenidoDe(v, codigo, 1);
  const err = errorContenido(c);
  if (err) return err;
  data.presupuestos.push({ codigo, tipo: v.tipo, estado: "borrador", versiones: [{ version: 1, contenido: c, huella: await huella(c), creada: new Date().toISOString() }] });
  if (persist()) { $("#nuevo").reset(); $("#nuevo").fecha.value = hoy(); render(); say(`Presupuesto ${codigo} creado.`); }
}

async function nuevaVersion(p, v) {
  const n = ultima(p).version + 1;
  const c = contenidoDe(v, p.codigo, n);
  const err = errorContenido(c);
  if (err) return err;
  p.versiones.push({ version: n, contenido: c, huella: await huella(c), creada: new Date().toISOString() });
  p.estado = "borrador"; // la nueva versión debe ser aceptada de nuevo; la anterior se conserva
  if (persist()) { render(); say(`Se creó la V${n} de ${p.codigo}. La anterior queda conservada.`); }
}

function verificar(p, texto) {
  const m = leerMensaje(texto);
  if (!m.codigo) return { ok: false, texto: "No se reconoce un mensaje de aceptación (falta el código).", m };
  if (m.codigo !== p.codigo) return { ok: false, texto: `El mensaje es del presupuesto ${m.codigo}, no de ${p.codigo}.`, m };
  const v = p.versiones.find((x) => x.version === m.version);
  if (!v) return { ok: false, texto: `El mensaje indica la V${m.version}, que no existe en este presupuesto.`, m };
  if (m.huella !== huellaCorta(v.huella)) return { ok: false, texto: `La huella NO coincide con la V${m.version}: el contenido que vio el cliente es distinto del original.`, m };
  return { ok: true, texto: `La huella coincide con la V${m.version}: el cliente aceptó exactamente este contenido.`, m };
}

function registrarAceptacion(p, v, inputs) {
  const msg = v.mensaje.trim();
  const vr = msg ? verificar(p, msg) : null;
  const version = vr?.m.version ?? ultima(p).version;
  if (version !== ultima(p).version) return `El mensaje corresponde a la V${version}, pero la versión vigente es la V${ultima(p).version}.`;
  if (vr && !vr.ok && !confirm(`${vr.texto}\n\n¿Registrar la aceptación igualmente?`)) return "No se registró la aceptación.";
  if (!v.nombre.trim() || !v.fechaHora) return "Completá el nombre y la fecha y hora en que llegó el mensaje.";
  const fecha = new Date(`${v.fechaHora}:00-03:00`); // hora de Argentina (UTC-3, sin horario de verano)
  if (Number.isNaN(fecha.getTime())) return "La fecha y hora no son válidas.";
  const dia = new Intl.DateTimeFormat("sv-SE", { timeZone: TZ }).format(fecha);
  if (dia > venceEl(ultima(p).contenido) && !confirm(`El mensaje llegó el ${dia}, después del vencimiento (${venceEl(ultima(p).contenido)}).\n\n¿Registrar la aceptación igualmente?`)) return "No se registró la aceptación.";
  ultima(p).aceptacion = { nombre: v.nombre.trim(), fechaHora: fecha.toISOString(), registradaEl: new Date().toISOString(), origen: v.origen.trim(), verificada: Boolean(vr?.ok), mensaje: msg.slice(0, 2000) };
  p.estado = "aceptado";
  if (persist()) { render(); say(`Aceptación registrada en ${p.codigo}.`); }
}

function formAceptacion(p) {
  const f = formulario([
    ["mensaje", "Pegá el mensaje de aceptación recibido por WhatsApp", { rows: 5 }, "textarea"],
    ["nombre", "Nombre declarado por el cliente", { required: true }],
    ["fechaHora", "Fecha y hora (de Argentina) en que llegó el mensaje, según WhatsApp", { type: "datetime-local", required: true }],
    ["origen", "Número de WhatsApp desde el que llegó (opcional)", {}],
  ], "Registrar aceptación", (v, i) => registrarAceptacion(p, v, i));
  const aviso = el("p", { role: "status" });
  f.mensaje.addEventListener("input", () => {
    const r = f.mensaje.value.trim() ? verificar(p, f.mensaje.value) : null;
    aviso.textContent = r ? (r.ok ? "✔ " : "✘ ") + r.texto : "";
    aviso.className = r?.ok ? "ok" : "bad";
    if (r?.m.nombre && !f.nombre.value) f.nombre.value = r.m.nombre;
  });
  f.insertBefore(aviso, f.querySelector("p.bad"));
  return f;
}

function formVersion(p) {
  const c = ultima(p).contenido;
  const f = formulario([
    ["cliente", "Cliente", { value: c.cliente, maxLength: 120 }],
    ["servicio", "Servicio a realizar", { value: c.servicio, maxLength: 300 }],
    ["importe", "Importe en pesos", { value: String(c.importe).replace(".", ","), inputMode: "decimal" }],
    ["fecha", "Fecha", { type: "date", value: c.fecha }],
    ["validez", "Validez en días", { type: "number", value: String(c.validezDias), min: 1, max: 90 }],
    ["condiciones", "Condiciones del trabajo", { value: c.condiciones, rows: 4, maxLength: 3000 }, "textarea"],
  ], `Crear V${c.version + 1}`, (v) => nuevaVersion(p, v));
  return f;
}

function imprimir(p, v) {
  const c = v.contenido, a = v.aceptacion;
  const filas = [["Código", c.codigo], ["Versión", `V${c.version}`], ["Estado actual del presupuesto", ESTADOS[p.estado]], ["Fecha del presupuesto", fechaLarga(c.fecha)], ["Válido hasta", fechaLarga(venceEl(c))], ["Cliente", c.cliente], ["Servicio", c.servicio], ["Importe", money(c.importe)], ["Condiciones", c.condiciones], ["Huella del documento (SHA-256)", v.huella],
    ...(a ? [["Aceptado por", a.nombre], ["Fecha y hora de la aceptación", fechaHora(a.fechaHora)], ["Registrada el", fechaHora(a.registradaEl)], ["Origen", a.origen || "No informado"], ["Verificación de la huella", a.verificada ? "Coincide con este documento" : "No verificada automáticamente"]] : [["Aceptación", "Esta versión no tiene aceptación registrada"]])];
  $("#print-area").replaceChildren(
    el("h1", { textContent: "Ozono Clear Baradero" }), el("h2", { textContent: "Comprobante de presupuesto" }),
    el("table", {}, ...filas.map(([k, val]) => el("tr", {}, el("th", { scope: "row", textContent: k }), el("td", { textContent: val })))),
    el("p", { className: "legal", textContent: "Registro informativo generado por el equipo de Ozono Clear Baradero. Los datos de la aceptación fueron cargados a partir del mensaje recibido por WhatsApp. Por sí solo, este documento no constituye una prueba indiscutible." }),
  );
  window.print();
}

function enlace(v) { return `${location.origin}/presupuesto.html#${codificar(v.contenido)}`; }

function tarjeta(p) {
  const v = ultima(p), c = v.contenido;
  const panel = el("div", { className: "panel-inline" });
  const abrir = (form) => panel.replaceChildren(...(panel.firstChild?.dataset?.k === form.dataset.k ? [] : [form]));
  const boton = (texto, fn, cls) => el("button", { type: "button", textContent: texto, className: cls || "", onclick: fn });
  const acciones = el("div", { className: "row" },
    boton("Enviar por WhatsApp", () => {
      const txt = `Hola, te enviamos el presupuesto ${c.codigo} (V${c.version}) de Ozono Clear Baradero: ${enlace(v)}`;
      window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`, "_blank", "noopener");
      if (p.estado === "borrador") p.estado = "enviado";
      v.enviada = new Date().toISOString();
      if (persist()) { render(); say(`${c.codigo} marcado como enviado.`); }
    }, "primary"),
    boton("Copiar enlace", async () => {
      try { await navigator.clipboard.writeText(enlace(v)); say("Enlace copiado."); } catch (e) { console.error("No se pudo copiar", e); prompt("Copiá el enlace:", enlace(v)); }
    }));
  if (p.estado === "borrador" || p.estado === "enviado") acciones.append(boton("Registrar aceptación", () => { const f = formAceptacion(p); f.dataset.k = "a"; abrir(f); }));
  if (p.estado === "aceptado") acciones.append(boton("Marcar realizado", () => { p.estado = "realizado"; p.realizadoEl = new Date().toISOString(); if (persist()) render(); }));
  acciones.append(boton("Nueva versión", () => { const f = formVersion(p); f.dataset.k = "v"; abrir(f); }), boton("Comprobante PDF", () => imprimir(p, v)));
  if (p.estado === "borrador" && p.versiones.length === 1) acciones.append(boton("Eliminar", () => {
    if (confirm(`¿Eliminar el borrador ${p.codigo}? No se puede deshacer.`)) { data.presupuestos = data.presupuestos.filter((x) => x !== p); if (persist()) render(); }
  }));
  const hist = el("details", {}, el("summary", { textContent: `Historial (${p.versiones.length} ${p.versiones.length === 1 ? "versión" : "versiones"})` }),
    el("ul", {}, ...[...p.versiones].reverse().map((x) => el("li", {},
      `V${x.version} · creada ${fechaHora(x.creada)} · ${money(x.contenido.importe)} · huella ${huellaCorta(x.huella)}` + (x.enviada ? ` · enviada ${fechaHora(x.enviada)}` : "") + (x.aceptacion ? ` · aceptada por ${x.aceptacion.nombre} el ${fechaHora(x.aceptacion.fechaHora)}${x.aceptacion.verificada ? " (huella verificada)" : " (sin verificar)"}` : ""),
      " ", boton(`Comprobante V${x.version}`, () => imprimir(p, x), "link")))));
  return el("article", { className: "app est-" + p.estado },
    el("h3", {}, c.codigo + " ", el("span", { className: "badge est-" + p.estado, textContent: ESTADOS[p.estado] }), (p.estado === "borrador" || p.estado === "enviado") && vencido(c) ? el("span", { className: "badge est-vencido", textContent: "Vencido" }) : ""),
    el("p", { textContent: `${c.cliente} · ${c.servicio}` }),
    el("p", { textContent: `${money(c.importe)} · ${fechaLarga(c.fecha)} · Válido hasta ${fechaLarga(venceEl(c))} · Versión V${c.version}` }),
    acciones, panel, hist);
}

function render() {
  const estado = $("#f-estado").value, texto = $("#f-texto").value.trim().toLowerCase();
  const lista = data.presupuestos.filter((p) => (!estado || p.estado === estado) && (!texto || (p.codigo + " " + ultima(p).contenido.cliente).toLowerCase().includes(texto)))
    .sort((a, b) => b.codigo.slice(6).localeCompare(a.codigo.slice(6)));
  $("#items").replaceChildren(...(lista.length ? lista.map(tarjeta) : [el("p", { textContent: data.presupuestos.length ? "Ningún presupuesto coincide con el filtro." : "Todavía no hay presupuestos. Creá el primero arriba." })]));
  const cuenta = Object.fromEntries(Object.keys(ESTADOS).map((k) => [k, data.presupuestos.filter((p) => p.estado === k).length]));
  $("#resumen").textContent = Object.entries(ESTADOS).map(([k, t]) => `${t}: ${cuenta[k]}`).join(" · ");
}

function iniciar() {
  const ok = sessionStorage.getItem(SESSION) === "1";
  $("#bloqueo").hidden = ok;
  $("#panel").hidden = !ok;
  if (!ok) return;
  data = cargar();
  if (data.corrupto) say("Los presupuestos guardados estaban dañados. Se conservó una copia sin modificar y se muestra la lista vacía; restaurá una copia de seguridad.", false);
  $("#tipo").replaceChildren(...Object.entries(TIPOS).map(([k, [n, d]]) => el("option", { value: k, textContent: `${k} · ${n} (${d})` })));
  $("#f-estado").append(...Object.entries(ESTADOS).map(([k, t]) => el("option", { value: k, textContent: t })));
  $("#nuevo").fecha.value = hoy();
  render();
}

$("#nuevo").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target, err = $("#nuevo-error");
  err.hidden = true;
  const msg = await crear(Object.fromEntries(new FormData(f)));
  if (msg) { err.textContent = msg; err.hidden = false; }
});
$("#f-estado").addEventListener("change", render);
$("#f-texto").addEventListener("input", render);
$("#export").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify({ presupuestos: data.presupuestos }, null, 2)], { type: "application/json" }));
  el("a", { href: url, download: `ozono-presupuestos-${hoy()}.json` }).click();
  URL.revokeObjectURL(url);
  say("Copia descargada.");
});
$("#import").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  if (file.size > 5_000_000) return say("El archivo es demasiado grande para ser una copia válida.", false);
  try {
    const d = JSON.parse(await file.text());
    const err = validarBase(d);
    if (err) return say("Copia no válida: " + err, false);
    if (!confirm(`Esto reemplaza los ${data.presupuestos.length} presupuestos actuales por los ${d.presupuestos.length} de la copia. ¿Continuar?`)) return;
    data = { presupuestos: d.presupuestos };
    if (persist()) { render(); say("Copia restaurada."); }
  } catch (err) {
    console.error("Importación fallida", err);
    say("El archivo no es un JSON válido.", false);
  }
});
iniciar();
