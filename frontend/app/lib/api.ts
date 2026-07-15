export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  errors?: string[];
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ errors: ['Request failed'] }));
    throw new Error(error.errors?.[0] || `HTTP ${res.status}`);
  }

  return res.json();
}
