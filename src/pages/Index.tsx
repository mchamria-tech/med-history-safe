import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import careBagLogo from "@/assets/carebag-logo-redesign.png";
import { Users, Search, Shield, ChevronRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Main Content */}
      <main className="flex flex-1 flex-col px-6 pb-40 pt-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center animate-fade-in">
          {/* Logo */}
          <div className="mb-8">
            <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-primary to-primary/80 p-4 shadow-elevated flex items-center justify-center">
              <img
                src={careBagLogo}
                alt="CareBag Logo"
                className="h-16 w-16 object-contain"
              />
            </div>
          </div>

          {/* Brand */}
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-3">
            CareBag
          </h1>

          {/* Headline */}
          <div className="text-center space-y-3 max-w-xs">
            <h2 className="text-xl font-semibold text-foreground leading-snug">
              Your family's health records,
              <br />
              beautifully organized
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Store, access, and manage all your medical documents securely from anywhere.
            </p>
          </div>
        </div>

        {/* Value Props */}
        <div className="mt-12 space-y-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <FeatureCard
            icon={<Users className="h-5 w-5" />}
            title="Family Profiles"
            description="Manage health records for your entire family"
          />
          <FeatureCard
            icon={<Search className="h-5 w-5" />}
            title="Smart Search"
            description="Find any document instantly with intelligent search"
          />
          <FeatureCard
            icon={<Shield className="h-5 w-5" />}
            title="Bank-Level Security"
            description="Your data is encrypted and protected"
          />
        </div>
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 px-6 py-5 pb-8 space-y-3">
        <Button
          size="lg"
          onClick={() => navigate("/register")}
          className="w-full h-14 text-base font-semibold rounded-xl shadow-soft hover:shadow-elevated transition-all"
        >
          Get Started
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="lg"
          onClick={() => navigate("/login")}
          className="w-full h-12 text-base font-medium text-muted-foreground hover:text-foreground"
        >
          I already have an account
        </Button>
      </div>
    </div>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 shadow-soft">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary flex-shrink-0">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <h3 className="font-semibold text-foreground text-sm">{title}</h3>
      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
    </div>
  </div>
);

export default Index;
