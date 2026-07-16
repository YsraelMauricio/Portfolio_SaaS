export interface BlogPost {
  id: number;
  slug: string;
  pillar: string | null;
  published_at: string | null;
  featured_image_url: string | null;
  author_name: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  title: string;
  summary: string;
  content: string;
  locale: string;
}

export interface BlogComment {
  id: number;
  blog_post_id: number;
  user_id: number | null;
  author_name: string;
  content: string;
  is_approved: boolean;
  created_at: string;
}

export interface PortfolioProject {
  id: number;
  slug: string;
  sort_order: number;
  technologies: string[];
  is_this_platform: boolean;
  live_url: string | null;
  source_url: string | null;
  featured_image_url: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  title: string;
  description: string;
  key_results: string;
  locale: string;
}

export interface Testimonial {
  id: number;
  author_name: string;
  role: string | null;
  content: string;
  is_approved: boolean;
  sort_order: number;
  created_at: string;
  locale: string;
}

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}
