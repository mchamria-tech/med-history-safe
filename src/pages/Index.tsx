import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeSelector } from "@/components/ThemeSelector";
import careBagLogo from "@/assets/carebag-logo.png";
import { Users, Search, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Compact Header */}
      <header className="flex w-full items-center justify-between bg-primary px-4 py-3">
        <h1 className="text-xl font-bold text-primary-foreground">CareBag</h1>
        <ThemeSelector />
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center px-4 pb-32 pt-6">
        {/* Hero Section */}
        <div className="flex flex-col items-center space-y-4 animate-fade-in">
          {/* Logo - Compact for mobile */}
          <div className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-primary bg-white p-4">
            <img
              src={careBagLogo}
              alt="CareBag Logo"
              className="h-full w-full object-contain"
            />
          </div>

          {/* Punchy Headline */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-foreground leading-tight">
              Your Family's Health,
              <br />
              One Tap Away
            </h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              Store and access all your medical records securely from anywhere
            </p>
          </div>
        </div>

        {/* Value Props Strip */}
        <div className="flex w-full max-w-sm justify-around pt-6 pb-2">
          <div className="flex flex-col items-center space-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Family</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Smart Search</span>
          </div>
          <div className="flex flex-col items-center space-y-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <span className="text-xs font-medium text-muted-foreground">Secure</span>
          </div>
        </div>
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-4 pb-6 space-y-3">
        <Button
          variant="default"
          size="lg"
          onClick={() => navigate("/register")}
          className="w-full h-14 text-lg font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
        >
          GET STARTED
        </Button>
        <Button
          variant="outline"
          size="lg"
          onClick={() => navigate("/login")}
          className="w-full h-14 text-lg font-semibold"
        >
          I HAVE AN ACCOUNT
        </Button>
      </div>
    </div>
  );
};

export default Index;
