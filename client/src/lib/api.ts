/** Base URL for API (no trailing slash) */
export const API_BASE = (import.meta.env.VITE_API_URL ?? "http://localhost:3000").replace(/\/$/, "");

/** Product image URL: supports full R2/CDN URLs or legacy `/uploads/...` paths. */
export function publicImageUrl(pathOrUrl: string | undefined | null): string | undefined {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) return pathOrUrl;
  return `${API_BASE}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

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
  category: string;
  description: string | null;
  basePrice: number;
  discountPrice?: number | null;
  stockQuantity?: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number | null;
  currency: string;
  status: string;
  images?: string[];
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

export interface ApiOrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ApiOrder {
  id: string;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  currency: string;
  placedAt: string;
  paymentVerifiedAt: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  shippingAddress?: string | null;
  shippingState?: string | null;
  shippingCity?: string | null;
  shippingPincode?: string | null;
  gstNumber?: string | null;
  vendor?: { id: string; name: string };
  shipment?: {
    id: string;
    courier: string | null;
    trackingNumber: string | null;
    trackingUrl: string | null;
    status: string;
  } | null;
  estimate?: { id: string; grandTotal: number } | null;
  items?: ApiOrderItem[];
}
