const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem("tanishq-store-auth");
    if (!raw) return null;
    const data = JSON.parse(raw) as { token?: string };
    return data.token ?? null;
  } catch {
    return null;
  }
}

export async function apiRequest<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || res.statusText || `HTTP ${res.status}`);
  }
  if (res.status === 204) return null as T;
  return res.json() as Promise<T>;
}

export interface LoginResponse {
  token: string;
  user: { id: string; email: string; name: string; role: string };
}

export interface ApiProduct {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  currency: string;
  status: string;
  vendor?: { id: string; name: string };
  createdAt: string;
}

export interface ApiStore {
  id: string;
  name: string;
  code: string;
  address: string | null;
  email: string | null;
  phone: string | null;
}
