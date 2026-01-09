'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { setUnauthorizedHandler, clearUnauthorizedHandler } from '@/lib/api-client';
import { useAuth } from '@/contexts/auth-context';

/**
 * Component to handle 401 Unauthorized errors globally
 * Shows a toast notification and redirects to login page
 */
export default function UnauthorizedHandler() {
  const router = useRouter();
  const { logout } = useAuth();

  useEffect(() => {
    // Flag to prevent multiple redirects
    let isHandling = false;

    const handleUnauthorized = () => {
      // Prevent multiple simultaneous redirects
      if (isHandling) return;
      isHandling = true;

      // Clear authentication data using AuthContext logout method
      // This ensures both localStorage and React state are cleared
      logout();

      // Show toast notification
      toast.error('认证已过期，请重新登录', {
        duration: 3000,
      });

      // Redirect to login page after a short delay
      setTimeout(() => {
        router.push('/login');
        isHandling = false;
      }, 500);
    };

    // Set the global handler
    setUnauthorizedHandler(handleUnauthorized);

    // Cleanup on unmount
    return () => {
      clearUnauthorizedHandler();
    };
  }, [router, logout]);

  return null; // This component doesn't render anything
}
