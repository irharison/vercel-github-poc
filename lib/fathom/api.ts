import { fathomApiPath } from "@/lib/fathom/paths";

const AUTH_KEY = "fathom-basic";

export class ApiError extends Error {
  status: number;
  detail: unknown;
  constructor(status: number, detail: unknown) {
    const message = formatDetail(detail) || `Request failed (${status})`;
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

export function formatDetail(detail: unknown): string {
  if (!detail) return "";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (item && typeof item === "object" && "message" in item ? String(item.message) : String(item)))
      .join(" ");
  }
  if (typeof detail === "object" && detail && "detail" in detail) {
    return formatDetail((detail as { detail: unknown }).detail);
  }
  return "";
}

export function fieldErrors(detail: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  const list = detail && typeof detail === "object" && "detail" in detail ? (detail as { detail: unknown }).detail : detail;
  if (!Array.isArray(list)) return out;
  for (const item of list) {
    if (item && typeof item === "object" && "field" in item && "message" in item) {
      out[String(item.field)] = String(item.message);
    }
  }
  return out;
}

export function hasAuth(): boolean {
  return typeof window !== "undefined" && !!sessionStorage.getItem(AUTH_KEY);
}

export function setAuth(username: string, password: string) {
  sessionStorage.setItem(AUTH_KEY, `${username}:${password}`);
}

export function clearAuth() {
  sessionStorage.removeItem(AUTH_KEY);
}

export function authHeader(): Record<string, string> {
  const raw = typeof window === "undefined" ? null : sessionStorage.getItem(AUTH_KEY);
  if (!raw) return {};
  return { Authorization: `Basic ${btoa(raw)}` };
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = fathomApiPath(path);
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...authHeader(),
      ...init?.headers,
    },
    cache: "no-store",
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (
    response.status === 401 &&
    body &&
    typeof body === "object" &&
    "error" in body &&
    (body as { error?: unknown }).error === "Unauthorized" &&
    !("detail" in (body as object))
  ) {
    window.dispatchEvent(new Event("fathom-google-required"));
    throw new ApiError(401, "Sign in required.");
  }
  if (response.status === 401 && !path.includes("/User/Login")) {
    clearAuth();
    window.dispatchEvent(new Event("fathom-unauthorized"));
  }
  if (!response.ok) throw new ApiError(response.status, body?.detail ?? body);
  return body as T;
}

export function withBook(path: string, book: string): string {
  if (!book) return path;
  const join = path.includes("?") ? "&" : "?";
  return `${path}${join}book=${encodeURIComponent(book)}`;
}
