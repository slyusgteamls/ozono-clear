import { decodificar, huella, huellaCorta, mensajeAceptacion, money, fechaLarga, venceEl, vencido } from "./presupuestos.js";
import { load } from "./storage.js";

const $ = (id) => document.getElementById(id);
const c = decodificar(location.hash.slice(1));
addEventListener("hashchange", () => location.reload()); // otro enlace en la misma pestaña: mostrar el nuevo presupuesto

if (!c) {
  $("pres-error").hidden = false;
} else {
  const hash = await huella(c);
  document.title = `Presupuesto ${c.codigo} | Ozono Clear Baradero`;
  $("p-codigo").textContent = c.codigo;
  $("p-version").textContent = `V${c.version}`;
  $("p-fecha").textContent = fechaLarga(c.fecha);
  $("p-cliente").textContent = c.cliente;
  $("p-servicio").textContent = c.servicio;
  $("p-importe").textContent = money(c.importe);
  $("p-condiciones").textContent = c.condiciones;
  $("p-huella").textContent = huellaCorta(hash);
  $("p-vence").textContent = fechaLarga(venceEl(c));
  $("pres-doc").hidden = false;
  if (vencido(c)) {
    $("pres-vencido").hidden = false;
    $("aceptar").hidden = true; // un presupuesto vencido no se puede aceptar desde la página
  }

  $("guardar-pdf").addEventListener("click", () => window.print());
  $("aceptar").addEventListener("submit", (e) => {
    e.preventDefault();
    const error = $("acep-error");
    const f = e.target;
    if (!f.nombre.value.trim() || !f.decl.checked) {
      error.hidden = false;
      error.textContent = "Escribí tu nombre y marcá la declaración para aceptar.";
      return;
    }
    error.hidden = true;
    const texto = mensajeAceptacion(c, hash, f.nombre.value);
    const url = `https://wa.me/${load().settings.whatsapp}?text=${encodeURIComponent(texto)}`;
    $("acep-estado").textContent = window.open(url, "_blank", "noopener")
      ? "Abrimos WhatsApp con tu aceptación. Tocá «Enviar» para completarla."
      : "Tu navegador bloqueó WhatsApp. Escribinos desde el botón de WhatsApp del sitio y pegá este mensaje:\n" + texto;
  });
}
