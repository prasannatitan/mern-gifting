import { serve } from "bun";
import { getRoute, json, notFound } from "./src/core/router";
import { extractToken, verifyToken } from "./src/core/auth";

// Register all module routes
import "./src/modules/auth/routes";
import "./src/modules/products/routes";
import "./src/modules/orders/routes";
import "./src/modules/shipments/routes";

// Basic health check (stays here as top-level)
import "./src/health";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function withCors(res: Response): Response {
  const r = new Response(res.body, res);
  Object.entries(CORS_HEADERS).forEach(([k, v]) => r.headers.set(k, v));
  return r;
}

serve({
  async fetch(req) {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    const url = new URL(req.url);
    // Normalize path: collapse repeated slashes, strip trailing slash (so //auth/login/store and /auth/login/store/ both match)
    const pathname = (url.pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/");
    const handler = getRoute(req.method, pathname);

    const token = extractToken(req);
    const user = token ? verifyToken(token) : null;

    if (handler) {
      try {
        const res = await handler({ req, user });
        return withCors(res);
      } catch (err) {
        console.error(err);
        return withCors(json({ error: "Internal server error" }, { status: 500 }));
      }
    }

    return withCors(notFound());
  },
  port: Number(process.env.PORT ?? 4000),
});