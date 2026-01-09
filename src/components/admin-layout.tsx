'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Globe,
  MapPin,
  Settings,
  Menu,
  X,
  Shield,
  Search,
  Users
} from 'lucide-react';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: '概览',
    href: '/admin',
    icon: Home,
  },
  {
    name: '域名管理',
    href: '/admin/domains',
    icon: Globe,
  },
  {
    name: '区域管理',
    href: '/admin/regions',
    icon: MapPin,
  },
  {
    name: 'Whois管理',
    href: '/admin/whois',
    icon: Search,
  },
  {
    name: '用户管理',
    href: '/admin/users',
    icon: Users,
  },
  {
    name: '设置',
    href: '/admin/settings',
    icon: Settings,
  },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/10 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-card border-r transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-14 px-4 border-b">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="font-semibold">管理中心</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              Beta
            </Badge>
            <span className="text-xs text-muted-foreground">v1.0.0</span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <div className="flex items-center justify-between h-14 px-4 border-b lg:hidden">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>
          <h1 className="font-semibold">管理中心</h1>
          <div /> {/* Spacer */}
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-4 py-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}