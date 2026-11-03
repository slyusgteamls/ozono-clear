# Ozono Clear Baradero — Entrega 1 (sitio estático)
Local: `python3 -m http.server 8000` y abrir http://localhost:8000
Vercel: subir la carpeta como proyecto estático (sin build).
Pendiente: logo independiente (hoy `assets/images/logo-fuente.png`, fondo negro integrado vía mix-blend-mode), foto de colectivo, protocolo técnico, precios, páginas legales, /admin, resto de páginas.
Foto hero: pendiente confirmar autor/licencia en Unsplash (no Unsplash+) y registrar crédito.

## Admin (/admin)
Usuario/clave provisionales: admin / admin. NO es seguro: una página estática no puede proteger credenciales. Antes de uso real, agregar autenticación de servidor.
Los datos se guardan en localStorage del navegador (no se sincronizan). Respaldo: botones exportar/restaurar JSON.
Pendiente en admin: destacados, promociones, banners, FAQ/textos institucionales, SEO por aplicación, imágenes.

## Páginas legales y base
privacidad.html y terminos.html son BORRADORES a revisar por un profesional legal (falta razón social y domicilio legal).
No hay banner de cookies porque el sitio no usa cookies no esenciales ni analítica; si se agregan, hay que implementarlo.
sitemap.xml y la URL canónica: pendientes hasta definir el dominio. No hay página "gracias": el formulario abre WhatsApp y no puede confirmar un envío.

## Panel (actualización)
Promociones y banners con fechas (solo se muestran vigentes), destacados en portada (máx. 8, sin duplicar) y resumen. Ubicaciones de banner: portada y servicios.
Pendiente: editar FAQ y textos institucionales desde el panel, carga de imágenes, SEO por aplicación, fichas individuales por aplicación.

## Fichas por aplicación y preguntas frecuentes
- Fichas: `aplicaciones/<id>.html`, generadas desde `data/fichas.json` con `python3 tools/generar-fichas.py` (editar el JSON y volver a ejecutar). Cada una tiene sus metadatos SEO.
- Una ficha solo se muestra si la aplicación está activa en el panel; si no, muestra "no disponible" (noindex). Las aplicaciones creadas desde el panel no tienen ficha (el enlace "Ver detalle" solo aparece si la app tiene `ficha: true`).
- El texto de la ficha viene de fichas.json; el título/descripción editados en el panel afectan al listado, no a la ficha.
- Las fichas con `imagen: null` no muestran foto (pendiente). Solo "colectivos" usa la foto de la portada.
- FAQ: se editan en el panel. `preguntas-frecuentes.html` contiene un respaldo estático con los valores iniciales.
- Procedimiento de cada ficha: pendiente de Ozono Clear (marcado en la página).

## Auditorías ejecutadas (localhost, Chromium headless)
- axe-core (WCAG 2.0/2.1 A y AA + buenas prácticas): 12 páginas, escritorio y móvil.
- Lighthouse (portada, servicios y una ficha; móvil y escritorio).
- Teclado: orden de tabulación, foco visible, menú móvil con Enter/Escape, enlace "Saltar al contenido".
- Se corrigió: logo del encabezado (573 KB → 9 KB, `logo.webp`), listas de aplicaciones con respaldo estático (CLS), aside para el botón flotante, nivel de encabezados, zonas táctiles de 44 px, Escape en el menú.
- No cubierto: lector de pantalla real, pruebas en dispositivos físicos, Safari/Firefox, red real (Lighthouse usó simulación).
- `assets/images/logo-fuente.png` (573 KB) se conserva como archivo fuente; las páginas usan `logo.webp`.

## Reestructura según el cliente (v9)
Menú: ¿Qué es el ozono? · Servicios · Cómo trabajamos · Seguridad · Empresas · Contacto (+ Nosotros y Preguntas en el pie).
- 5 fichas: autos/remises, combis-micros-colectivos, reparto/flotas, comercios-gimnasios-oficinas, viviendas/alojamientos temporarios.
- Seguridad: sin personas, mascotas ni plantas durante la aplicación; reingreso con verificación de condiciones seguras (según el cliente).
- Todo el contacto es por WhatsApp; precios, tiempos, servicios programados y zonas "se definen a consulta".
- Sin dirección física: Google Maps es un enlace opcional (panel > Datos del negocio). Recomendado: perfil de Google Business con área de servicio, sin mostrar domicilio. No se incrusta mapa (evita contenido de terceros y cambios en privacidad/cookies).
- Sin fotos del equipo (decisión del cliente). Foto de portada: Unsplash, pendiente crédito/licencia.
- El almacenamiento local usa la clave v2: los datos guardados con versiones anteriores del panel no se leen.
- Pendiente de confirmar por Ozono Clear: texto de "Limitaciones" (borrador en ¿Qué es el ozono?), razón social, perfil de Google Business, que +54 9 3487 616174 sea WhatsApp Business (confirmado verbalmente), existencia real de los servicios programados.

## Marco común y WhatsApp (v10, a partir de la guía de código de Tera)
- Todos los botones de WhatsApp son enlaces `wa.me` reales con `target="_blank" rel="noopener"` (funcionan sin JavaScript); main.js actualiza el número desde el panel.
- WhatsApp en verde (#25d366) con texto/ícono azul oscuro (el blanco sobre ese verde da 2,0:1 y no pasa WCAG). Naranja para acciones que no son WhatsApp (`.btn-accent`).
- Íconos propios en `assets/icons.svg` (sin Font Awesome/Ionicons ni librerías externas).
- Encabezado, pie (con créditos de Tera Web Solutions), botón flotante, listas de respaldo y hrefs de WhatsApp salen de `tools/aplicar-layout.py`. Flujo: editar el script/`data/fichas.json` → `python3 tools/generar-fichas.py` (ejecuta también aplicar-layout).
- Mapa: sin dirección física, se muestra la zona del panel ("Baradero, Buenos Aires") y el iframe de Google solo se carga al tocar el botón. Política de privacidad actualizada. Vacío en el panel = sin mapa.
- Falta: logo de Tera para el pie (`assets/images/logo-teraweb.png`, hoy solo texto).
- `.vercelignore` excluye tools/, data/, README y el logo fuente. Decidir si se publica /admin (ver checklist).

## Presupuestos (v11) — sin servidor
Panel: /admin/presupuestos.html · Página del cliente: /presupuesto.html#<datos> (ambas noindex).
- Código: OCB-[TIPO]-[AAMMDD]-[NNN]. Tipos V M H L E S I O. El correlativo es diario y se asigna automáticamente (único en ESTE navegador). Sin datos personales en el código.
- Estados: borrador, enviado, aceptado, realizado. Cada cambio de importe/condiciones crea una versión nueva (V2…) que vuelve a borrador y debe aceptarse de nuevo; las anteriores se conservan.
- Enlace: el presupuesto viaja codificado en el fragmento de la URL (nunca llega a un servidor). Se envía por WhatsApp.
- Aceptación: el cliente escribe su nombre, marca la declaración y se abre WhatsApp con un mensaje (código, versión, huella SHA-256, importe, nombre). Vale cuando el equipo recibe ese mensaje. El panel verifica que la huella coincida con la versión original y registra la fecha/hora de WhatsApp (hora de Argentina, UTC-3).
- Comprobante: PDF desde el navegador (Imprimir > Guardar como PDF), por versión. Es un registro informativo.
- Copia de seguridad: exportar/importar .json con validación. Datos guardados solo en el navegador del equipo.
- LÍMITES (requieren servidor): hora automática e inalterable de la aceptación, IP/dispositivo del cliente, correlativo atómico entre dispositivos, panel compartido entre celulares, revocar enlaces, evitar que terceros fabriquen presupuestos con el dominio (la verdad es el registro del equipo), consulta desde otro dispositivo.
- Protección de /admin: middleware.js (HTTP Basic). Solo se probó su lógica en Node; verificar en Vercel. Variables: ADMIN_USER, ADMIN_PASS.
- Imágenes de viviendas (assets/images/viviendas-1..4.webp): recortadas de capturas (163x223 px). Origen y licencia sin confirmar; pedir originales.

## Validez de presupuestos (v12)
- Validez por defecto: 7 días (editable de 1 a 90 al crear o versionar). Entra en la huella. "Válido hasta" = fecha del presupuesto + días.
- Vencido: la página del cliente oculta la aceptación; el panel muestra "Vencido" y advierte si se registra una aceptación posterior al vencimiento.
- Sin servidor, el vencimiento usa el reloj del dispositivo del cliente (se puede evadir cambiando la hora o el enlace). La aplicación real del vencimiento requiere servidor.
- El almacenamiento de presupuestos pasó a la clave v2 (los presupuestos de prueba de versiones anteriores no se leen).

## Configurar la contraseña de /admin en Vercel
1. Vercel > el proyecto > Settings > Environment Variables.
2. Agregar ADMIN_USER (un usuario que no sea "admin") y ADMIN_PASS (contraseña larga; guardarla en un gestor de contraseñas). Entornos: Production (y Preview si se usa).
3. Redeploy: las variables solo se aplican a despliegues nuevos (Deployments > ... > Redeploy).
4. Abrir /admin: el navegador pide usuario y contraseña. Sin variables, /admin responde 503 (cerrado).

## Siguiente etapa: servidor real (propuesta, aún no construida)
- Supabase (Postgres + Auth + Edge Functions), región São Paulo. Sin librerías: fetch a la API REST.
- Tablas: presupuestos, versiones, aceptaciones, contadores diarios (correlativo atómico). Aceptación con hora del servidor, IP, navegador, texto exacto aceptado y huella.
- El cliente accede por token aleatorio (no adivinable) vía Edge Function; el equipo entra con login real (Supabase Auth) y RLS cierra las tablas.
- Costos/condiciones verificados (oct. 2026): plan gratuito de Supabase pausa el proyecto tras 1 semana sin actividad (para producción conviene Pro, ~USD 25/mes). Vercel Hobby es solo uso no comercial: un sitio comercial requiere Pro.
- Requiere actualizar la política de privacidad (IP/navegador al aceptar) y revisión legal.
