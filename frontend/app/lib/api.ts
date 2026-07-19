export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  errors?: string[];
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

/**
 * Sanctum SPA cookie-based auth: no token is stored in JS-accessible
 * storage. `credentials: 'include'` sends the httpOnly session cookie
 * automatically on every request.
 */

// Compatibility stubs for code that still references token-based auth.
// These are kept to avoid breaking imports across the codebase during
// the migration. They return null / no-op.
export function getAuthToken(): string | null {
  return null;
}
export function clearAuthToken(): void {
  // no-op — cookies are server-managed
}
export function setAuthToken(_token: string): void {
  // no-op — cookies are server-managed
}

/**
 * Call once before login/register to get Sanctum's CSRF cookie set.
 */
export async function ensureCsrfCookie(): Promise<void> {
  await fetch(`${API_BASE.replace('/api/v1', '')}/sanctum/csrf-cookie`, {
    credentials: 'include',
  });
}

function getCsrfTokenFromCookie(): string {
  const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : '';
}

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    credentials: 'include',
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

/**
 * Authenticated requests — with cookie auth, this is the same as
 * fetchApi plus the CSRF header for state-changing verbs.
 */
export async function fetchApiWithAuth<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const isMutation = !!options?.method && options.method !== 'GET';
  return fetchApi<T>(endpoint, {
    ...options,
    headers: {
      ...(options?.headers || {}),
      ...(isMutation ? { 'X-XSRF-TOKEN': getCsrfTokenFromCookie() } : {}),
    },
  });
}

/**
 * Login/logout no longer manage a stored token — the cookie IS the session.
 */
export async function login(email: string, password: string): Promise<void> {
  await ensureCsrfCookie();
  await fetchApiWithAuth('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  await fetchApiWithAuth('/auth/logout', { method: 'POST' });
}

/**
 * Make an authenticated request that returns a raw Response (for file downloads).
 */
export async function fetchApiRaw(
  endpoint: string,
  options?: RequestInit,
): Promise<Response> {
  const isMutation = !!options?.method && options.method !== 'GET';
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(options?.headers || {}),
      ...(isMutation ? { 'X-XSRF-TOKEN': getCsrfTokenFromCookie() } : {}),
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ errors: ['Request failed'] }));
    throw new Error(error.errors?.[0] || `HTTP ${res.status}`);
  }

  return res;
}

/**
 * Upload a file with auth (for FormData-based endpoints).
 */
export async function uploadFileWithAuth<T>(
  endpoint: string,
  formData: FormData,
): Promise<ApiResponse<T>> {
  const isMutation = true;
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...(isMutation ? { 'X-XSRF-TOKEN': getCsrfTokenFromCookie() } : {}),
    },
    body: formData,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ errors: ['Upload failed'] }));
    throw new Error(error.errors?.[0] || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch blog posts list (public).
 */
export async function fetchBlogPosts(
  locale: string,
  pillar?: string,
  page = 1,
  perPage = 10,
): Promise<ApiResponse<import('@/app/types/content').BlogPost[]>> {
  const params = new URLSearchParams({ locale, page: String(page), per_page: String(perPage) });
  if (pillar) params.set('pillar', pillar);
  return fetchApi(`/blog/posts?${params.toString()}`);
}

/**
 * Fetch a single blog post by slug.
 */
export async function fetchBlogPost(
  slug: string,
  locale?: string,
): Promise<ApiResponse<import('@/app/types/content').BlogPost>> {
  const params = locale ? `?locale=${locale}` : '';
  return fetchApi(`/blog/posts/${slug}${params}`);
}

/**
 * Fetch blog comments for a post.
 */
export async function fetchBlogComments(
  postId: number,
): Promise<ApiResponse<import('@/app/types/content').BlogComment[]>> {
  return fetchApi(`/blog/posts/${postId}/comments`);
}

/**
 * Submit a blog comment.
 */
export async function submitBlogComment(
  postId: number,
  data: { content: string; author_name?: string },
): Promise<ApiResponse<import('@/app/types/content').BlogComment>> {
  return fetchApiWithAuth(`/blog/posts/${postId}/comments`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Fetch portfolio projects list (public).
 */
export async function fetchPortfolioProjects(
  locale: string,
  technology?: string,
): Promise<ApiResponse<import('@/app/types/content').PortfolioProject[]>> {
  const params = new URLSearchParams({ locale });
  if (technology) params.set('technology', technology);
  return fetchApi(`/portfolio?${params.toString()}`);
}

/**
 * Fetch a single portfolio project by slug.
 */
export async function fetchPortfolioProject(
  slug: string,
  locale?: string,
): Promise<ApiResponse<import('@/app/types/content').PortfolioProject>> {
  const params = locale ? `?locale=${locale}` : '';
  return fetchApi(`/portfolio/${slug}${params}`);
}

/**
 * Fetch approved testimonials (public).
 */
export async function fetchTestimonials(
  locale: string,
): Promise<ApiResponse<import('@/app/types/content').Testimonial[]>> {
  return fetchApi(`/testimonials?locale=${locale}`);
}

/**
 * Submit a testimonial (public).
 */
export async function submitTestimonial(
  data: { author_name: string; content: string; role?: string; locale?: string },
): Promise<ApiResponse<import('@/app/types/content').Testimonial>> {
  return fetchApi('/testimonials', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
