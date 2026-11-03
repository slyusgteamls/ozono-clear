import { load, isLive } from "./storage.js";

const content = load();
const { settings } = content;
const waUrl = (text) => `https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(text)}`;
const $ = (id) => document.getElementById(id);
const node = (tag, text, cls) => Object.assign(document.createElement(tag), { textContent: text, className: cls || "" });
const SVG = "http://www.w3.org/2000/svg";
const icon = (name) => {
  const svg = document.createElementNS(SVG, "svg");
  const use = document.createElementNS(SVG, "use");
  svg.setAttribute("class", "ico");
  svg.setAttribute("aria-hidden", "true");
  use.setAttribute("href", `/assets/icons.svg#${name}`);
  svg.append(use);
  return svg;
};

// Todos los botones de WhatsApp son enlaces wa.me reales; aquí se actualizan con el número del panel.
document.querySelectorAll("[data-wa]").forEach((el) => {
  el.href = waUrl(el.dataset.wa);
  el.target = "_blank";
  el.rel = "noopener";
});

// Aplicaciones activas (portada: solo las destacadas, máx. 8; servicios: todas).
const list = $("app-list");
if (list) {
  const home = list.dataset.scope === "home";
  const active = content.apps.filter((a) => a.activa && (!home || a.destacada !== false)).slice(0, home ? 8 : undefined);
  const lis = active.map((a) => {
    const consult = Object.assign(node("a", "", "btn btn-wa btn-sm"), { href: waUrl(a.mensaje), target: "_blank", rel: "noopener" });
    consult.setAttribute("aria-label", `Consultar por ${a.titulo}`);
    consult.append(icon("wa"), "Consultar");
    const links = node("div", "", "links");
    links.append(consult);
    if (a.ficha) {
      const detail = Object.assign(node("a", "Ver detalle"), { href: `/aplicaciones/${a.id}.html` });
      detail.setAttribute("aria-label", `Ver detalle de ${a.titulo}`);
      links.append(detail);
    }
    const li = document.createElement("li");
    li.append(node(home ? "h3" : "h2", a.titulo), node("p", a.texto), links);
    return li;
  });
  if (!lis.length) lis.push(node("li", "Pronto vamos a publicar las aplicaciones. Mientras tanto, consultanos por WhatsApp."));
  list.replaceChildren(...lis);
}

// Banners por ubicación y promociones vigentes (solo dentro de su período).
const bannerBox = $("banners");
if (bannerBox) {
  content.banners.filter((b) => isLive(b) && b.zona === bannerBox.dataset.zona).forEach((b) => {
    const box = node("div", "", "banner");
    box.append(node("strong", b.titulo), node("span", " " + b.texto));
    if (b.enlace) {
      const a = Object.assign(node("a", "Ver más"), { href: b.enlace });
      if (/^https?:/.test(b.enlace)) a.rel = "noopener";
      box.append(" ", a);
    }
    bannerBox.append(box);
  });
}
const promoBox = $("promos");
if (promoBox) {
  const live = content.promos.filter(isLive);
  live.forEach((p) => { const art = document.createElement("article"); art.append(node("h3", p.titulo), node("p", p.texto)); promoBox.append(art); });
  promoBox.hidden = !live.length;
}

// Datos de contacto (contacto y pie de página) y año.
for (const id of ["mail-link", "mail-footer"]) {
  const el = $(id);
  if (el) { el.href = "mailto:" + settings.email; el.textContent = settings.email; }
}
for (const id of ["ig-link", "ig-footer"]) {
  const el = $(id);
  if (el) { el.href = "https://instagram.com/" + settings.instagram; if (id === "ig-link") el.textContent = "@" + settings.instagram; }
}
$("year").textContent = new Date().getFullYear();

// Mapa: el iframe de Google solo se crea cuando la persona lo pide.
const mapBlock = $("map-block");
if (mapBlock) {
  const query = settings.mapsQuery;
  const link = $("maps-link");
  link.href = settings.maps || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  $("map-embed").hidden = !query;
  mapBlock.hidden = !query && !settings.maps;
  $("map-load").addEventListener("click", () => {
    const frame = Object.assign(document.createElement("iframe"), {
      title: "Mapa de la zona de servicio de Ozono Clear Baradero",
      loading: "lazy",
      referrerPolicy: "no-referrer-when-downgrade",
      src: `https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`,
    });
    $("map-embed").replaceChildren(frame);
  });
}

const header = document.querySelector(".site-header");
const btn = document.querySelector(".menu-btn");
const nav = $("nav");
const closeMenu = () => { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); };
addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 20), { passive: true });
addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("open")) { closeMenu(); btn.focus(); } });
btn.addEventListener("click", () => btn.setAttribute("aria-expanded", String(nav.classList.toggle("open"))));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) closeMenu(); });

// Formulario: arma el mensaje y abre WhatsApp. No se envía nada hasta que la persona lo manda desde WhatsApp.
const form = $("form");
if (form) {
  const errorBox = $("form-error");
  const status = $("form-status");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.textContent = "";
    const d = Object.fromEntries(new FormData(form));
    const missing = ["nombre", "tipo", "mensaje"].filter((k) => !d[k]?.trim());
    if (missing.length) {
      errorBox.hidden = false;
      errorBox.textContent = "Completá nombre, tipo de instalación y mensaje para continuar.";
      form.elements[missing[0]].focus();
      return;
    }
    errorBox.hidden = true;
    const text = `Hola, soy ${d.nombre.trim()}${d.empresa?.trim() ? " (" + d.empresa.trim() + ")" : ""}.\nInstalación: ${d.tipo}.\n${d.mensaje.trim()}`;
    if (window.open(waUrl(text), "_blank", "noopener")) {
      status.textContent = "Abrimos WhatsApp con tu consulta. Para enviarla, tocá «Enviar» en WhatsApp.";
    } else {
      errorBox.hidden = false;
      errorBox.textContent = `Tu navegador bloqueó WhatsApp. Escribinos a ${settings.email}.`;
    }
  });
}

// Preguntas frecuentes publicadas (portada: las primeras; página de preguntas: todas).
const faqBox = $("faq-list");
if (faqBox) {
  const limit = Number(faqBox.dataset.limit) || Infinity;
  const items = content.faqs.filter((f) => f.activa).slice(0, limit);
  faqBox.replaceChildren(...(items.length ? items.map((f) => {
    const d = document.createElement("details");
    d.append(node("summary", f.pregunta), node("p", f.respuesta));
    return d;
  }) : [node("p", "Todavía no hay preguntas publicadas.")]));
}

// Ficha de aplicación: solo se muestra si la aplicación está activa en el panel.
const ficha = $("ficha");
if (ficha) {
  const byId = (id) => content.apps.find((a) => a.id === id);
  const app = byId(ficha.dataset.appId);
  if (!app || !app.activa) {
    document.title = "Página no disponible | Ozono Clear Baradero";
    document.head.append(Object.assign(document.createElement("meta"), { name: "robots", content: "noindex" }));
    ficha.replaceChildren(node("h1", "Esta página no está disponible por ahora"), node("p", "Podés ver los demás servicios o consultarnos directamente."), Object.assign(node("a", "Ver servicios", "btn btn-accent"), { href: "/servicios.html" }));
  } else {
    $("ficha-cta").href = waUrl(app.mensaje);
    ficha.querySelectorAll("[data-app-link]").forEach((li) => { if (!byId(li.dataset.appLink)?.activa) li.remove(); });
    if (!ficha.querySelector("[data-app-link]")) ficha.querySelector(".related-block").remove();
  }
    }
