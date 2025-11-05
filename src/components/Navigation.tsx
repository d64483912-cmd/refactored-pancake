import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { authClient } from '@/lib/auth';
import {
  Home,
  MessageSquare,
  FileText,
  Settings,
  LogOut,
  User,
  Bot,
  Database,
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAuth?: boolean;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/chat', label: 'Chat', icon: MessageSquare, requiresAuth: true },
  { path: '/sessions', label: 'Sessions', icon: Bot, requiresAuth: true },
  { path: '/billing', label: 'Billing', icon: FileText, requiresAuth: true },
  { path: '/admin', label: 'Admin', icon: User, adminOnly: true, requiresAuth: true },
];

export default function Navigation() {
  const location = useLocation();
  const [user, setUser] = useState<{ name?: string; email: string; role?: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userLoading, setUserLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data } = await authClient.getSession();
        const rawUser = data?.user;
        setUser(
          rawUser
            ? { name: rawUser.name, email: rawUser.email, role: rawUser.role || undefined }
            : null
        );
        setIsAdmin(rawUser?.role === 'admin');
      } catch (error) {
        console.error('Failed to get session:', error);
        setUser(null);
        setIsAdmin(false);
      } finally {
        setUserLoading(false);
      }
    };
    checkAuth();
  }, []);

  const visibleRoutes = navItems.filter((r) => {
    if (r.adminOnly && !isAdmin) return false;
    if (r.requiresAuth && !user) return false;
    return true;
  });

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <Database className="h-6 w-6" />
              <span className="font-bold text-lg">Automation Studio</span>
            </Link>
            
            <div className="hidden md:flex space-x-1">
              {visibleRoutes.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {userLoading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <>
                <div className="hidden md:flex items-center space-x-2 text-sm">
                  <span className="text-muted-foreground">Welcome,</span>
                  <span className="font-medium">{user.name || user.email}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSignOut}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden md:inline">Sign Out</span>
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/sign-in">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button size="sm">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}