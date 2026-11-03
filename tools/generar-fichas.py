#!/usr/bin/env python3
"""Genera aplicaciones/<id>.html a partir de data/fichas.json.
Uso (desde la raíz del proyecto): python3 tools/generar-fichas.py
Editá data/fichas.json y volvé a ejecutarlo para actualizar las fichas."""
import json, re
from html import escape as e
from pathlib import Path

root = Path(__file__).resolve().parent.parent
fichas = json.loads((root / "data/fichas.json").read_text(encoding="utf-8"))
header = '<header class="site-header"></header>'  # los completa aplicar-layout.py
footer = '<footer class="footer"></footer>'
fab = '<aside aria-label="Contacto rápido"></aside>'
titulos = {f["id"]: f["titulo"] for f in fichas}


def items(lst):
    return "".join(f"<li>{e(i)}</li>" for i in lst)


def render(f):
    img = f.get("imagen")
    foto = (f'<img class="ficha-img" src="{e(img["src"])}" width="{img["w"]}" height="{img["h"]}" fetchpriority="high" alt="{e(img["alt"])}">' if img else "")
    proc = f"<p>{e(f['procedimiento'])}</p>" if f.get("procedimiento") else "<p><em>[Procedimiento: pendiente de aportar por Ozono Clear]</em></p>"
    faq = "".join(f"<details><summary>{e(q['q'])}</summary><p>{e(q['a'])}</p></details>" for q in f["faq"])
    rel = "".join(f'<li data-app-link="{r}"><a href="/aplicaciones/{r}.html">{e(titulos[r])}</a></li>' for r in f["relacionadas"])
    sit = ""
    if f.get("situaciones"):
        li = "".join(f'<li><img src="{e(s["imagen"]["src"])}" width="{s["imagen"]["w"]}" height="{s["imagen"]["h"]}" loading="lazy" alt="{e(s["imagen"]["alt"])}"><div><h3>{e(s["titulo"])}</h3><p>{e(s["texto"])}</p><p class="lema">{e(s["lema"])}</p></div></li>' for s in f["situaciones"])
        sit = f'<h2>Situaciones habituales</h2><ul class="situaciones">{li}</ul><p class="note">Imágenes ilustrativas.</p>'
    titulo = f["meta_titulo"] + " | Ozono Clear Baradero"
    return f"""<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{e(titulo)}</title>
<meta name="description" content="{e(f['meta_desc'])}">
<meta property="og:title" content="{e(titulo)}">
<meta property="og:description" content="{e(f['meta_desc'])}">
<link rel="icon" href="/favicon.png" type="image/png">
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
<a class="skip" href="#contenido">Saltar al contenido</a>
{header}
<main class="doc" id="contenido">
<div id="ficha" data-app-id="{f['id']}">
<p class="crumb"><a href="/servicios.html">Servicios</a> / {e(f['titulo'])}</p>
<h1>{e(f['titulo'])}</h1>
{foto}
<h2>El problema</h2>
<p>{e(f['problema'])}</p>
<h2>Qué hacemos</h2>
<p>{e(f['servicio'])}</p>
<h2>Dónde se aplica</h2>
<ul>{items(f['contextos'])}</ul>
{sit}
<h2>Cómo se realiza</h2>
{proc}
<h2>Precauciones</h2>
<div class="safety"><ul>{items(f['precauciones'])}</ul></div>
<h2>Preguntas frecuentes</h2>
<div class="faq">{faq}</div>
<p><a class="btn btn-wa" id="ficha-cta" data-wa="Hola, quiero consultar por: {e(f['titulo'])}." href="/contacto.html">Consultar por este servicio</a></p>
<div class="related-block"><h2>Otras aplicaciones</h2><ul class="related">{rel}</ul></div>
</div>
</main>
{footer}
{fab}
<script type="module" src="/js/main.js"></script>
</body>
</html>
"""


out = root / "aplicaciones"
out.mkdir(exist_ok=True)
for viejo in out.glob("*.html"):
    viejo.unlink()  # evita fichas huérfanas
for f in fichas:
    (out / f"{f['id']}.html").write_text(render(f), encoding="utf-8")
    print("generada", f"aplicaciones/{f['id']}.html")

import runpy
runpy.run_path(str(root / "tools/aplicar-layout.py"))
