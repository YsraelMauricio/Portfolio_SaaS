'use client';

import { useState, useEffect } from 'react';
import { getAuthToken } from './api';

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const token = getAuthToken();
      setIsLoggedIn(!!token);
    };

    checkAuth();

    // Re-check on window focus (in case another tab logged out)
    window.addEventListener('focus', checkAuth);
    return () => window.removeEventListener('focus', checkAuth);
  }, []);

  return { isLoggedIn };
}
