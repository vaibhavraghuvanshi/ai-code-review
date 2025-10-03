import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import { ThemeToggle } from "./theme-toggle";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { useLocation } from "wouter";

export function AppHeader() {
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    console.log("Logout clicked");
    setLocation("/");
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
          <AvatarFallback>JD</AvatarFallback>
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
