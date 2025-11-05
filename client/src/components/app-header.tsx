import { LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { SidebarTrigger } from './ui/sidebar';
import { ThemeToggle } from './theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useLocation } from 'wouter';
import { useEffect, useState } from 'react';

export function AppHeader() {
  const [, setLocation] = useLocation();
  const [initial, setInitial] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const parsed = JSON.parse(raw) as any;
        const username = parsed?.username || parsed?.user?.username || '';
        if (username && typeof username === 'string') {
          setInitial(username.trim().charAt(0).toUpperCase() || null);
          return;
        }
      }
    } catch (e) {
      // ignore parse errors
    }
    setInitial(null);
  }, []);

  const handleLogout = async () => {
    // Client-side logout: clear stored user and redirect to landing page
    try {
      // If your server exposes a logout endpoint in future, you can call it here.
      localStorage.removeItem('currentUser');
    } catch (e) {
      console.error('Failed to clear localStorage during logout', e);
    }

    // Redirect to landing page
    setLocation('/');
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b bg-background px-4 py-3">
      <div className="flex items-center gap-2">
        <SidebarTrigger data-testid="button-sidebar-toggle" />
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Avatar className="h-8 w-8">
          <AvatarImage src="" alt="User" />
          <AvatarFallback>{initial ?? 'JD'}</AvatarFallback>
        </Avatar>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="gap-2"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}
