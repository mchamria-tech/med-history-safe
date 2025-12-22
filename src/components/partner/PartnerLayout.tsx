import { ReactNode, useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerCheck } from "@/hooks/usePartnerCheck";
import { getSignedUrl } from "@/hooks/useSignedUrl";
import {
  LayoutDashboard,
  Users,
  Upload,
  LogOut,
  Menu,
  X,
} from "lucide-react";

interface PartnerLayoutProps {
  children: ReactNode;
}

const PartnerLayout = ({ children }: PartnerLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoading, partner } = usePartnerCheck();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadLogo = async () => {
      if (partner?.logo_url) {
        const { url } = await getSignedUrl('profile-photos', partner.logo_url);
        if (url) setLogoUrl(url);
      }
    };
    loadLogo();
  }, [partner?.logo_url]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/partner/login");
  };

  const navItems = [
    { path: "/partner/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/partner/users", label: "Linked Users", icon: Users },
    { path: "/partner/upload", label: "Upload Document", icon: Upload },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between bg-primary px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary/80"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2">
          {logoUrl && (
            <img src={logoUrl} alt={partner?.name} className="h-8 w-8 rounded-full object-cover" />
          )}
          <h1 className="text-lg font-bold text-primary-foreground">
            {partner?.name || "Partner Portal"}
          </h1>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transition-transform duration-200 lg:transition-none`}
        >
          {/* Partner Branding */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img src={logoUrl} alt={partner?.name} className="h-10 w-10 rounded-full object-cover" />
              ) : (
                <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <span className="text-accent font-bold text-lg">
                    {partner?.name?.charAt(0) || "P"}
                  </span>
                </div>
              )}
              <div>
                <h2 className="font-semibold text-foreground">{partner?.name}</h2>
                <p className="text-xs text-muted-foreground">Partner Portal</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path === "/partner/upload" && location.pathname.startsWith("/partner/upload"));
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Logout
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-0">
          {/* Desktop Header */}
          <header className="hidden lg:flex items-center justify-between bg-card border-b border-border px-6 py-4">
            <div className="flex items-center gap-3">
              {logoUrl && (
                <img src={logoUrl} alt={partner?.name} className="h-10 w-10 rounded-full object-cover" />
              )}
              <div>
                <h1 className="text-xl font-bold text-foreground">{partner?.name}</h1>
                <p className="text-sm text-muted-foreground">Partner Dashboard</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Logout
            </Button>
          </header>
          
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default PartnerLayout;
