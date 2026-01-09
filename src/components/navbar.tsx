'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, Settings, User } from 'lucide-react';
import { config } from '@/lib/config';

export default function Navbar() {
  const router = useRouter();
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleAdminClick = () => {
    router.push('/admin');
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span className="font-semibold">{config.app.name}</span>
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 text-sm">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{user?.username}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAdminClick}
                  className="hidden sm:flex items-center space-x-2"
                >
                  <Settings className="h-4 w-4" />
                  <span>管理</span>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">退出</span>
                </Button>
              </>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={handleLoginClick}
                className="flex items-center space-x-2"
              >
                <LogIn className="h-4 w-4" />
                <span>登录</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}