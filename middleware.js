// Protege /admin con usuario y contraseña (HTTP Basic) antes de servir cualquier archivo.
// Requiere las variables de entorno ADMIN_USER y ADMIN_PASS en Vercel (Settings > Environment Variables).
// Si no están configuradas, el acceso queda cerrado (no se publica el panel sin protección).
export const config = { matcher: ["/admin", "/admin/:path*"] };

export default function middleware(request) {
  const user = process.env.ADMIN_USER;
  const pass = process.env.ADMIN_PASS;
  if (!user || !pass) return new Response("Administración no configurada.", { status: 503 });

  const [scheme, encoded] = (request.headers.get("authorization") || "").split(" ");
  if (scheme === "Basic" && encoded) {
    try {
      const [u, ...rest] = atob(encoded).split(":");
      if (u === user && rest.join(":") === pass) return undefined; // credenciales correctas: continuar
    } catch (e) {
      console.error("Encabezado de autorización ilegible", e);
    }
  }
  return new Response("Acceso restringido.", { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Ozono Clear - Administración", charset="UTF-8"' } });
}
