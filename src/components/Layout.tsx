import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "./ui/button";
import { ChefHat, CalendarDays, Heart, Home, LogOut } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session && location.pathname !== "/auth") {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, location.pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const navLinks = [
    { to: "/", icon: Home, label: "Recipes" },
    { to: "/meal-planner", icon: CalendarDays, label: "Meal Planner" },
    { to: "/favorites", icon: Heart, label: "Favorites" },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-[var(--gradient-primary)] rounded-xl flex items-center justify-center transition-transform group-hover:scale-110">
              <ChefHat className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-[var(--gradient-primary)]">
              Smart Chief
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  location.pathname === link.to
                    ? "bg-primary text-primary-foreground shadow-[var(--shadow-card)]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}
          </nav>

          {user && (
            <Button variant="outline" size="sm" onClick={handleSignOut} className="gap-2">
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          )}
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t">
          <nav className="container mx-auto px-4 py-2 flex justify-around">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${
                  location.pathname === link.to
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                <link.icon className="w-5 h-5" />
                <span className="text-xs">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t bg-card py-6">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          <p>© 2025 Smart Chief. Plan smarter, eat better.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
