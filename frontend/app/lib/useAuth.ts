'use client';
import { useEffect, useState } from 'react';
import { fetchApiWithAuth } from '@/app/lib/api';
import type { User } from '@/app/types/dashboard';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApiWithAuth<{ user: User } | User>('/auth/user')
      .then((res) => setUser(res.data as unknown as User))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  return { user, isLoggedIn: !!user, loading };
}
