import type { UserRole } from "@prisma/client";

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [key: string]: Json };

export type AuthUser = {
  id: string;
  role: UserRole;
  email: string;
};

export type HandlerContext = {
  req: Request;
  user: AuthUser | null;
};

export type Handler = (ctx: HandlerContext) => Promise<Response> | Response;

type RouteKey = `${string}:${string}`; // METHOD:/path

const routes = new Map<RouteKey, Handler>();

export function json(data: Json, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

export function notFound() {
  return json({ error: "Not found" }, { status: 404 });
}

export function unauthorized() {
  return json({ error: "Unauthorized" }, { status: 401 });
}

export function forbidden() {
  return json({ error: "Forbidden" }, { status: 403 });
}

export function badRequest(message: string) {
  return json({ error: message }, { status: 400 });
}

export function registerRoute(method: string, path: string, handler: Handler) {
  const key: RouteKey = `${method.toUpperCase()}:${path}`;
  routes.set(key, handler);
}

export function getRoute(method: string, path: string): Handler | undefined {
  const key: RouteKey = `${method.toUpperCase()}:${path}`;
  return routes.get(key);
}

export function requireRole(handler: Handler, roles: UserRole[]): Handler {
  return async (ctx) => {
    if (!ctx.user) return unauthorized();
    if (!roles.includes(ctx.user.role)) return forbidden();
    return handler(ctx);
  };
}

