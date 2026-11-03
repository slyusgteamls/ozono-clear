#!/usr/bin/env python3
"""Aplica el marco común a todas las páginas: encabezado, pie con créditos de Tera,
botón flotante de WhatsApp, enlaces wa.me reales y listas de respaldo de aplicaciones.
Uso: python3 tools/aplicar-layout.py (generar-fichas.py lo ejecuta al terminar)."""
import json, re, subprocess, tempfile
from html import escape as e, unescape
from pathlib import Path
from urllib.parse import quote

root = Path(__file__).resolve().parent.parent
with tempfile.TemporaryDirectory() as d:  # DEFAULTS es la única fuente de los datos iniciales
    p = Path(d) / "s.mjs"
    p.write_text((root / "js/storage.js").read_text(encoding="utf-8"), encoding="utf-8")
    DEF = json.loads(subprocess.check_output(["node", "-e", f"import({json.dumps(p.as_uri())}).then(m=>console.log(JSON.stringify(m.DEFAULTS)))"]))
fichas = json.loads((root / "data/fichas.json").read_text(encoding="utf-8"))
NUM = DEF["settings"]["whatsapp"]
WA_MSG = "Hola, quiero consultar por un tratamiento con ozono."
NAV = [("/que-es-el-ozono.html", "¿Qué es el ozono?"), ("/servicios.html", "Servicios"), ("/como-trabajamos.html", "Cómo trabajamos"), ("/seguridad.html", "Seguridad"), ("/empresas.html", "Empresas"), ("/contacto.html", "Contacto")]
EXTRA = [("/nosotros.html", "Nosotros"), ("/preguntas-frecuentes.html", "Preguntas frecuentes")]


def wa(msg): return f"https://wa.me/{NUM}?text={quote(msg, safe='')}"
def icon(n, cls="ico"): return f'<svg class="{cls}" aria-hidden="true"><use href="/assets/icons.svg#{n}"/></svg>'


def header(cur):
    links = "\n    ".join(f'<a href="{u}"' + (' aria-current="page"' if u == cur else "") + f">{t}</a>" for u, t in NAV)
    return f'''<header class="site-header">
  <a class="brand" href="/" aria-label="Ozono Clear Baradero, inicio"><img src="/assets/images/logo.webp" width="360" height="150" alt="Ozono Clear Baradero"></a>
  <button class="menu-btn" aria-expanded="false" aria-controls="nav">Menú</button>
  <nav id="nav" aria-label="Principal">
    {links}
    <a class="btn btn-wa" data-wa="{WA_MSG}" href="#">Consultar por WhatsApp</a>
  </nav>
</header>'''


def footer():
    rapidos = "".join(f'<li><a href="{u}">{t}</a></li>' for u, t in NAV + EXTRA)
    servicios = "".join(f'<li><a href="/aplicaciones/{f["id"]}.html">{e(f["titulo"])}</a></li>' for f in fichas)
    return f'''<footer class="footer">
  <div class="footer__grid">
    <div class="footer__brand">
      <a class="brand" href="/" aria-label="Ozono Clear Baradero, inicio"><img src="/assets/images/logo.webp" width="360" height="150" alt="Ozono Clear Baradero"></a>
      <p class="footer__tagline">No es perfume, es limpieza que se siente.</p>
      <div class="footer__social">
        <a class="social-link" id="ig-footer" href="https://instagram.com/{DEF['settings']['instagram']}" target="_blank" rel="noopener" aria-label="Instagram de Ozono Clear">{icon("ig")}</a>
        <a class="social-link" data-wa="{WA_MSG}" href="#" aria-label="WhatsApp de Ozono Clear">{icon("wa")}</a>
      </div>
    </div>
    <div class="footer__col"><h2 class="footer__heading">Links rápidos</h2><ul class="footer__links">{rapidos}</ul></div>
    <div class="footer__col"><h2 class="footer__heading">Servicios</h2><ul class="footer__links">{servicios}</ul></div>
    <div class="footer__col"><h2 class="footer__heading">Contacto</h2>
      <address class="footer__address">
        <p>{icon("pin")}<span>Baradero, Buenos Aires</span></p>
        <p>{icon("wa")}<a data-wa="{WA_MSG}" href="#">Escribinos por WhatsApp</a></p>
        <p>{icon("mail")}<a id="mail-footer" href="mailto:{DEF['settings']['email']}">{DEF['settings']['email']}</a></p>
      </address>
    </div>
  </div>
  <div class="footer__bottom"><div class="footer__bottom-inner">
    <span>© <span id="year">2026</span> Ozono Clear Baradero. Todos los derechos reservados. · <a href="/privacidad.html">Privacidad</a> · <a href="/terminos.html">Términos</a></span>
    <a class="footer__credit" href="https://teraweb.ar" target="_blank" rel="noopener"><span class="footer__credit-label"><span>Producido por</span> <span>Tera Web Solutions</span></span></a>
  </div></div>
</footer>'''


def fab():
    return f'<aside aria-label="Contacto rápido"><a class="whatsapp-fab" data-wa="{WA_MSG}" href="#" aria-label="Consultar por WhatsApp">{icon("wa", "ico ico--lg")}<span class="whatsapp-fab__tooltip" aria-hidden="true">¡Escribinos!</span></a></aside>'


def lista(h):
    return "".join(
        f'<li><{h}>{e(a["titulo"])}</{h}><p>{e(a["texto"])}</p><div class="links">'
        f'<a class="btn btn-wa btn-sm" href="{wa(a["mensaje"])}" target="_blank" rel="noopener" aria-label="Consultar por {e(a["titulo"])}">{icon("wa")}Consultar</a>'
        f'<a href="/aplicaciones/{a["id"]}.html" aria-label="Ver detalle de {e(a["titulo"])}">Ver detalle</a></div></li>' for a in DEF["apps"])


def fix_wa(m):
    tag = m.group(0)
    msg = unescape(re.search(r'data-wa="([^"]*)"', tag).group(1))
    tag = re.sub(r'\s(?:href|target|rel)="[^"]*"', "", tag)
    return tag[:-1] + f' href="{wa(msg)}" target="_blank" rel="noopener">'


for f in sorted(root.glob("*.html")) + sorted((root / "aplicaciones").glob("*.html")):
    cur = "/servicios.html" if f.parent.name == "aplicaciones" else ("/" + f.name if any(u == "/" + f.name for u, _ in NAV) else "")
    t = f.read_text(encoding="utf-8")
    t = re.sub(r'<header class="site-header".*?</header>', lambda m: header(cur), t, count=1, flags=re.S)
    t = re.sub(r"<footer.*?</footer>", lambda m: footer(), t, count=1, flags=re.S)
    t = re.sub(r'<aside aria-label="Contacto rápido">.*?</aside>', lambda m: fab(), t, count=1, flags=re.S)
    t = re.sub(r'(<ul class="app-list" id="app-list"( data-scope="home")?>).*?</ul>', lambda m: m.group(1) + lista("h3" if m.group(2) else "h2") + "</ul>", t, flags=re.S)
    t = re.sub(r'<a\b[^>]*\bdata-wa="[^"]*"[^>]*>', fix_wa, t)
    t = re.sub(r'(<a\b[^>]*class="[^"]*\bbtn-wa\b[^"]*"[^>]*>)(?!<svg)', lambda m: m.group(1) + icon("wa"), t)
    f.write_text(t, encoding="utf-8")
print("marco aplicado")
