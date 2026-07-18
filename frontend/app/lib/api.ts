export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
  errors?: string[];
}

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

/**
 * Get the stored auth token (Sanctum Bearer token).
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token');
}

/**
 * Store the auth token after login.
 */
export function setAuthToken(token: string): void {
  localStorage.setItem('auth_token', token);
}

/**
 * Remove the auth token on logout.
 */
export function clearAuthToken(): void {
  localStorage.removeItem('auth_token');
}

/**
 * Log out the user by clearing the token and posting to the logout endpoint.
 */
export async function logout(): Promise<void> {
  localStorage.removeItem('auth_token');
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAuthToken()}`,
        Accept: 'application/json',
      },
    });
  } catch {
    // Silently fail — token is already cleared locally
  }
}

/**
 * Generic fetch without auth (for public endpoints).
 */
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

/**
 * Build headers for authenticated requests.
 */
function buildAuthHeaders(options?: RequestInit): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Only set Content-Type for non-FormData bodies
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  return headers;
}

/**
 * Fetch with authentication (Bearer token from localStorage).
 */
export async function fetchApiWithAuth<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<ApiResponse<T>> {
  const headers = buildAuthHeaders(options);

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      // Token expired or invalid — clear it
      clearAuthToken();
    }
    const error = await res.json().catch(() => ({ errors: ['Request failed'] }));
    throw new Error(error.errors?.[0] || `HTTP ${res.status}`);
  }

  return res.json();
}

/**
 * Make an authenticated request that returns a raw Response (for file downloads).
 */
export async function fetchApiRaw(
  endpoint: string,
  options?: RequestInit,
): Promise<Response> {
  const headers = buildAuthHeaders(options);

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers || {}),
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthToken();
    }
    const error = await res.json().catch(() => ({ errors: ['Request failed'] }));
    throw new Error(error.errors?.[0] || `HTTP ${res.status}`);
  }

  return res;
}

/**
 * Upload a file with auth (for FormData-based endpoints).
 */
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

export async function uploadFileWithAuth<T>(
  endpoint: string,
  formData: FormData,
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 401) {
      clearAuthToken();
    }
    const error = await res.json().catch(() => ({ errors: ['Upload failed'] }));
    throw new Error(error.errors?.[0] || `HTTP ${res.status}`);
  }

  return res.json();
}
