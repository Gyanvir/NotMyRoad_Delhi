import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Home, PlusCircle, LayoutDashboard, Globe, LogOut, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "../ui/button";

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Globe, label: "Feed", path: "/feed" },
    { icon: PlusCircle, label: "Report", path: "/report", primary: true },
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 flex flex-col relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      {/* Top Navbar (Desktop + Logo) */}
      <header className="sticky top-0 z-40 w-full glass-panel border-t-0 border-x-0 border-b border-white/5 px-4 h-16 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group cursor-pointer">
            <div className="w-11 h-8 rounded-lg bg-primary/20 border border-primary flex items-center justify-center group-hover:neon-glow transition-all">
              <span className="text-primary font-display font-bold text-lg leading-none">NMR</span>
            </div>
            <span className="font-display font-bold text-xl tracking-tight hidden sm:block">
              NotMy<span className="text-primary">Road</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path} className={item.primary ? "" : "group"}>
                {item.primary ? (
                  <Button size="sm" className="gap-2">
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Button>
                ) : (
                  <span className={`text-sm font-medium transition-colors flex items-center gap-2 ${location === item.path ? "text-primary text-glow" : "text-muted-foreground hover:text-foreground"}`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                )}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-4 ml-4 pl-4 border-l border-border">
                <span className="text-sm text-muted-foreground">Hi, {user.name}</span>
                <Link href="/profile">
                  <Button variant="ghost" size="icon" title="Profile">
                    <UserCircle className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-4 pl-4 border-l border-border">
                <Link href="/login">
                  <Button variant="ghost" size="sm">Login</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="sm">Register</Button>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 z-10 relative">
        {children}
      </main>

      {/* Bottom Navbar (Mobile) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-b-0 border-x-0 border-t border-white/5 h-20 px-4 flex items-center justify-between pb-safe">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path} className="flex flex-col items-center gap-1">
              <div className={`p-2 rounded-xl transition-all duration-300 ${isActive && !item.primary ? 'bg-primary/20 text-primary' : ''} ${item.primary ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 -translate-y-4' : 'text-muted-foreground'}`}>
                <item.icon className={`w-6 h-6 ${item.primary ? 'w-8 h-8' : ''}`} />
              </div>
              {!item.primary && (
                <span className={`text-[10px] font-medium ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
        {user ? (
          <Link href="/profile" className={`flex flex-col items-center gap-1 ${location === '/profile' ? 'text-primary' : 'text-muted-foreground'}`}>
            <div className={`p-2 rounded-xl transition-all duration-300 ${location === '/profile' ? 'bg-primary/20 text-primary' : ''}`}>
              <UserCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium">Profile</span>
          </Link>
        ) : (
          <Link href="/login" className="flex flex-col items-center gap-1 text-muted-foreground">
            <div className="p-2 rounded-xl transition-all duration-300">
              <UserCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-medium">Sign In</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
