import { load, save, validate, isLive, ZONAS } from "./storage.js";

const SESSION = "ozono-admin";
const $ = (s) => document.querySelector(s);
const FIELDS = [["nombre", "Nombre del negocio"], ["eslogan", "Eslogan"], ["email", "Correo electrónico"], ["whatsapp", "WhatsApp (solo números, con código de país)"], ["instagram", "Usuario de Instagram (sin @)"], ["maps", "Enlace del perfil de Google Maps (opcional, https://…)"], ["mapsQuery", "Zona del mapa (ej: Baradero, Buenos Aires). Vacío = sin mapa"]];
let state;

function el(tag, props = {}, ...kids) {
  const n = Object.assign(document.createElement(tag), props);
  n.append(...kids);
  return n;
}
function say(msg, ok = true) {
  const s = $("#status");
  s.textContent = msg;
  s.className = ok ? "ok" : "bad";
}
function field(label, input) {
  return el("label", {}, label, input);
}

function renderSettings() {
  const box = $("#settings");
  box.replaceChildren(...FIELDS.map(([k, label]) =>
    field(label, el("input", { value: state.settings[k] ?? "", oninput: (e) => { state.settings[k] = e.target.value.trim(); } }))));
}

function move(i, d) {
  const j = i + d;
  if (j < 0 || j >= state.apps.length) return;
  [state.apps[i], state.apps[j]] = [state.apps[j], state.apps[i]];
  renderApps();
}

function renderApps() {
  const box = $("#apps");
  if (!state.apps.length) {
    box.replaceChildren(el("p", {}, "No hay aplicaciones. Agregá la primera con el botón de abajo."));
    return;
  }
  box.replaceChildren(...state.apps.map((a, i) => el("div", { className: "app" + (a.activa ? "" : " off") },
    field("Título", el("input", { value: a.titulo, oninput: (e) => { a.titulo = e.target.value; } })),
    field("Descripción", el("textarea", { rows: 3, value: a.texto, oninput: (e) => { a.texto = e.target.value; } })),
    field("Mensaje de WhatsApp", el("input", { value: a.mensaje, oninput: (e) => { a.mensaje = e.target.value; } })),
    el("div", { className: "row" },
      el("label", {}, el("input", { type: "checkbox", checked: a.activa, onchange: (e) => { a.activa = e.target.checked; renderApps(); } }), " Visible en el sitio"),
      el("label", {}, el("input", { type: "checkbox", checked: a.destacada !== false, onchange: (e) => {
        if (e.target.checked && state.apps.filter((x) => x !== a && x.destacada !== false).length >= 8) { e.target.checked = false; say("Podés destacar hasta 8 aplicaciones.", false); return; }
        a.destacada = e.target.checked; renderSummary();
      } }), " Destacada en portada"),
      el("button", { type: "button", textContent: "Subir", disabled: i === 0, onclick: () => move(i, -1) }),
      el("button", { type: "button", textContent: "Bajar", disabled: i === state.apps.length - 1, onclick: () => move(i, 1) }),
      el("button", { type: "button", textContent: "Eliminar", onclick: () => {
        if (confirm(`¿Eliminar «${a.titulo || "sin título"}»? No se puede deshacer.`)) { state.apps.splice(i, 1); renderApps(); }
      } })))));
}

const DATES = [["inicio", "Desde (opcional)", "date"], ["fin", "Hasta (opcional)", "date"]];
const SPECS = {
  faqs: [["pregunta", "Pregunta", "text"], ["respuesta", "Respuesta", "area"]],
  promos: [["titulo", "Título", "text"], ["texto", "Descripción", "area"], ...DATES],
  banners: [["titulo", "Título", "text"], ["texto", "Texto", "area"], ["enlace", "Enlace (opcional: https://… o /pagina.html)", "text"], ...DATES],
};

function renderItems(key, emptyMsg) {
  const box = $("#" + key);
  const items = state[key];
  if (!items.length) { box.replaceChildren(el("p", {}, emptyMsg)); return; }
  const swap = (i, d) => { const j = i + d; if (j >= 0 && j < items.length) { [items[i], items[j]] = [items[j], items[i]]; renderItems(key, emptyMsg); } };
  box.replaceChildren(...items.map((it, i) => el("div", { className: "app" + (it.activa ? "" : " off") },
    ...SPECS[key].map(([k, label, type]) => field(label, type === "area"
      ? el("textarea", { rows: 2, value: it[k] || "", oninput: (e) => { it[k] = e.target.value; } })
      : el("input", { type, value: it[k] || "", oninput: (e) => { it[k] = e.target.value; } }))),
    ...(key === "banners" ? [field("Ubicación", el("select", { onchange: (e) => { it.zona = e.target.value; } },
      ...Object.entries(ZONAS).map(([v, t]) => el("option", { value: v, textContent: t, selected: it.zona === v }))))] : []),
    el("div", { className: "row" },
      el("label", {}, el("input", { type: "checkbox", checked: it.activa, onchange: (e) => { it.activa = e.target.checked; renderItems(key, emptyMsg); renderSummary(); } }), " Publicado"),
      el("button", { type: "button", textContent: "Subir", disabled: i === 0, onclick: () => swap(i, -1) }),
      el("button", { type: "button", textContent: "Bajar", disabled: i === items.length - 1, onclick: () => swap(i, 1) }),
      el("button", { type: "button", textContent: "Eliminar", onclick: () => {
        if (confirm(`¿Eliminar «${it.titulo || it.pregunta || "sin título"}»? No se puede deshacer.`)) { items.splice(i, 1); renderItems(key, emptyMsg); renderSummary(); }
      } })))));
}

function renderSummary() {
  $("#summary").textContent = `Aplicaciones activas: ${state.apps.filter((a) => a.activa).length} · Destacadas en portada: ${state.apps.filter((a) => a.activa && a.destacada !== false).length} · Promociones vigentes: ${state.promos.filter(isLive).length} · Banners publicados: ${state.banners.filter(isLive).length}`;
}

const EMPTY = { faqs: "No hay preguntas frecuentes. Agregá la primera con el botón de abajo.", promos: "No hay promociones. Creá la primera cuando haya una oferta real para publicar.", banners: "No hay banners ni novedades." };
function render() {
  renderSettings();
  renderApps();
  renderItems("faqs", EMPTY.faqs);
  renderItems("promos", EMPTY.promos);
  renderItems("banners", EMPTY.banners);
  renderSummary();
}

function show() {
  const on = sessionStorage.getItem(SESSION) === "1";
  $("#login").hidden = on;
  $("#panel").hidden = !on;
  if (on) { state = load(); render(); }
}

$("#login-form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  if (f.get("u") === "admin" && f.get("p") === "admin") {
    sessionStorage.setItem(SESSION, "1");
    show();
  } else {
    $("#login-err").hidden = false;
  }
});
$("#logout").addEventListener("click", () => { sessionStorage.removeItem(SESSION); show(); });

$("#add").addEventListener("click", () => {
  state.apps.push({ id: "app-" + Date.now(), titulo: "", texto: "", mensaje: "Hola, quiero consultar por un tratamiento con ozono.", activa: false, destacada: false });
  renderApps();
});

$("#add-faq").addEventListener("click", () => { state.faqs.push({ id: "faq-" + Date.now(), pregunta: "", respuesta: "", activa: false }); renderItems("faqs", EMPTY.faqs); });
$("#add-promo").addEventListener("click", () => { state.promos.push({ id: "promo-" + Date.now(), titulo: "", texto: "", inicio: "", fin: "", activa: false }); renderItems("promos", EMPTY.promos); });
$("#add-banner").addEventListener("click", () => { state.banners.push({ id: "banner-" + Date.now(), titulo: "", texto: "", enlace: "", zona: "inicio", inicio: "", fin: "", activa: false }); renderItems("banners", EMPTY.banners); });

$("#save").addEventListener("click", () => {
  try {
    save(state);
    renderSummary();
    say("Cambios guardados en este navegador.");
  } catch (e) {
    console.error("No se pudo guardar", e);
    say(e.message || "No se pudo guardar. Revisá el espacio del navegador.", false);
  }
});

$("#export").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2)], { type: "application/json" }));
  const a = el("a", { href: url, download: "ozono-clear-respaldo.json" });
  a.click();
  URL.revokeObjectURL(url);
  say("Copia descargada.");
});

$("#import").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = "";
  if (!file) return;
  if (file.size > 1_000_000) return say("El archivo es demasiado grande para ser una copia válida.", false);
  try {
    const data = JSON.parse(await file.text());
    const err = validate(data);
    if (err) return say("Copia no válida: " + err, false);
    if (!confirm("Esto reemplaza los datos actuales. ¿Continuar?")) return;
    state = data;
    save(state);
    render();
    say("Copia restaurada y guardada.");
  } catch (err) {
    console.error("Importación fallida", err);
    say("El archivo no es un JSON válido.", false);
  }
});

show();
