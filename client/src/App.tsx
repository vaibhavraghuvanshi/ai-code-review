import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";
import { ThemeProvider } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import ReviewHistory from "@/pages/review-history";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import SubscriptionPlansPage from "@/pages/subscription-plans";

function AppLayout({ children }: { children: React.ReactNode }) {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/auth" component={Auth} />
      <Route path="/dashboard">
        <AppLayout>
          <Dashboard />
        </AppLayout>
      </Route>
      <Route path="/review-history">
        <AppLayout>
          <ReviewHistory />
        </AppLayout>
      </Route>
      <Route path="/profile">
        <AppLayout>
          <Profile />
        </AppLayout>
      </Route>
      <Route path="/settings">
        <AppLayout>
          <Settings />
        </AppLayout>
      </Route>
      <Route path="/subscription-plans">
        <AppLayout>
          <SubscriptionPlansPage />
        </AppLayout>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
