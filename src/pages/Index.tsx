import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import careBagLogo from "@/assets/carebag-logo-redesign.png";
import { Heart, Handshake, Stethoscope, ChevronRight, Settings, UserPlus, Mail, Building2, Link2 } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const [showOnboarding, setShowOnboarding] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Main Content */}
      <main className="flex flex-1 flex-col px-6 pb-32 pt-8">
        {/* Hero Section */}
        <div className="flex flex-col items-center animate-fade-in">
          {/* Logo */}
          <div className="mb-6 animate-scale-in">
            <img
              src={careBagLogo}
              alt="CareBag Logo"
              className="h-16 w-auto object-contain"
            />
          </div>

          {/* Brand */}
          <h1 className="text-2xl font-bold text-accent tracking-tighter mb-2">
            CareBag
          </h1>

          {/* Headline */}
          <div className="text-center space-y-2 max-w-xs">
            <h2 className="text-xl font-bold text-foreground leading-snug tracking-tight">
              Your family's health records,
              <br />
              beautifully organized
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Access your health portal below
            </p>
          </div>
        </div>

        {/* Portal Cards */}
        <div className="mt-10 space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {/* User Portal */}
          <PortalCard
            icon={<Heart className="h-6 w-6" />}
            title="Patient Portal"
            description="Access and manage your personal health records"
            primaryAction={{ label: "Login", onClick: () => navigate("/login") }}
            secondaryAction={{ label: "Create Account", onClick: () => navigate("/register") }}
            gradient="from-rose-500/10 to-pink-500/10"
            iconBg="bg-rose-500/15 text-rose-600"
          />

          {/* Partner Portal */}
          <PortalCard
            icon={<Handshake className="h-6 w-6" />}
            title="Partner Portal"
            description="Healthcare providers and institutions"
            primaryAction={{ label: "Login", onClick: () => navigate("/partner/login") }}
            secondaryAction={{ label: "Learn More", onClick: () => setShowOnboarding(true) }}
            gradient="from-blue-500/10 to-cyan-500/10"
            iconBg="bg-blue-500/15 text-blue-600"
          />

          {/* Doctor Portal */}
          <PortalCard
            icon={<Stethoscope className="h-6 w-6" />}
            title="Doctor Portal"
            description="Time-limited access to patient records"
            primaryAction={{ label: "Login", onClick: () => navigate("/doctor/login") }}
            gradient="from-emerald-500/10 to-teal-500/10"
            iconBg="bg-emerald-500/15 text-emerald-600"
          />
        </div>
      </main>

      {/* Footer with Hidden Admin Link */}
      <footer className="fixed bottom-0 left-0 right-0 glass px-6 py-4 flex items-center justify-center">
        <button
          onClick={() => navigate("/admin/login")}
          className="flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors"
        >
          <Settings className="h-3 w-3" />
          <span>System Administration</span>
        </button>
      </footer>

      {/* Partner Onboarding Modal */}
      <PartnerOnboardingModal 
        open={showOnboarding} 
        onOpenChange={setShowOnboarding}
        onGetStarted={() => {
          setShowOnboarding(false);
          navigate("/partner/login");
        }}
      />
    </div>
  );
};

interface PortalCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  gradient: string;
  iconBg: string;
}

const PortalCard = ({ 
  icon, 
  title, 
  description,
  primaryAction,
  secondaryAction,
  gradient,
  iconBg
}: PortalCardProps) => (
  <div className={`p-5 rounded-3xl bg-gradient-to-br ${gradient} border border-border/40 shadow-soft transition-all duration-150 hover:shadow-elevated`}>
    <div className="flex items-start gap-4">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconBg} flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-foreground text-base tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-0.5 mb-3">{description}</p>
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={primaryAction.onClick}
            className="flex-1 h-9 text-sm font-medium"
          >
            {primaryAction.label}
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
          {secondaryAction && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={secondaryAction.onClick}
              className="flex-1 h-9 text-sm font-medium"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  </div>
);

interface PartnerOnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGetStarted: () => void;
}

const PartnerOnboardingModal = ({ open, onOpenChange, onGetStarted }: PartnerOnboardingModalProps) => {
  const steps = [
    {
      icon: <UserPlus className="h-5 w-5" />,
      title: "Register",
      description: "Create your partner account"
    },
    {
      icon: <Mail className="h-5 w-5" />,
      title: "Verify",
      description: "Confirm your email address"
    },
    {
      icon: <Building2 className="h-5 w-5" />,
      title: "Configure",
      description: "Set up organization details"
    },
    {
      icon: <Link2 className="h-5 w-5" />,
      title: "Connect",
      description: "Start linking patients"
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Partner Onboarding</DialogTitle>
          <DialogDescription className="text-center">
            Join CareBag as a healthcare partner in 4 simple steps
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6">
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary flex-shrink-0">
                  {step.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground">Step {index + 1}</span>
                  </div>
                  <h4 className="font-medium text-foreground">{step.title}</h4>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute left-9 mt-14 h-4 w-px bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onGetStarted} className="flex-1">
            Get Started
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default Index;
