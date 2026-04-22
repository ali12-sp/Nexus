import type { ApiEnvelope } from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api";

export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
export const API_DOCS_URL = `${API_ORIGIN}/api/docs`;

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details ?? null;
  }
}

type ApiRequestOptions = {
  method?: string;
  token?: string | null;
  body?: unknown;
  headers?: HeadersInit;
  formData?: FormData;
  cache?: RequestCache;
};

export const buildApiUrl = (path: string) =>
  path.startsWith("http")
    ? path
    : `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export const resolveAssetUrl = (value: string) =>
  value.startsWith("http") ? value : `${API_ORIGIN}${value}`;

export const apiFetch = async <T>(
  path: string,
  { method = "GET", token, body, headers, formData, cache }: ApiRequestOptions = {},
) => {
  const response = await fetch(buildApiUrl(path), {
    method,
    cache: cache ?? "no-store",
    headers: {
      ...(formData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: formData ? formData : body ? JSON.stringify(body) : undefined,
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new ApiError(
      payload?.message ?? "Request failed",
      response.status,
      payload && "errors" in payload ? (payload as ApiEnvelope<T> & { errors?: unknown }).errors : null,
    );
  }

  if (!payload) {
    throw new ApiError("Invalid API response", response.status);
  }

  return payload.data;
};
