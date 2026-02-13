import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import careBagLogo from "@/assets/carebag-logo-redesign.png";
import { ArrowLeft, Mail, Lock, User } from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (!consentGiven) {
      toast.error("Please accept the Privacy Policy and Terms of Service to continue");
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;

      toast.success("Account created successfully!");
      sessionStorage.setItem("showSplash", "true");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Failed to create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center px-4 py-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-xl"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col px-6 pt-2 pb-8 animate-fade-in">
        {/* Logo & Welcome */}
        <div className="mb-8">
          <img
            src={careBagLogo}
            alt="CareBag Logo"
            className="h-16 w-auto object-contain mb-6"
          />
          <h1 className="text-2xl font-bold text-foreground mb-2 tracking-tight">
            Create your account
          </h1>
          <p className="text-muted-foreground text-sm">
            Start managing your health records today
          </p>
        </div>

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="Your full name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="h-12 pl-11 rounded-xl border-border bg-muted/50 focus:bg-background transition-all duration-150"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-12 pl-11 rounded-xl border-border bg-muted/50 focus:bg-background transition-all duration-150"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12 pl-11 rounded-xl border-border bg-muted/50 focus:bg-background transition-all duration-150"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12 pl-11 rounded-xl border-border bg-muted/50 focus:bg-background transition-all duration-150"
              />
            </div>
          </div>

          {/* Consent Checkbox */}
          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="consent"
              checked={consentGiven}
              onCheckedChange={(checked) => setConsentGiven(checked === true)}
              className="mt-0.5"
            />
            <Label htmlFor="consent" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
              I agree to the{" "}
              <button
                type="button"
                onClick={() => navigate("/privacy-policy")}
                className="text-primary font-medium underline hover:no-underline"
              >
                Privacy Policy
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => navigate("/terms-of-service")}
                className="text-primary font-medium underline hover:no-underline"
              >
                Terms of Service
              </button>
              . I consent to the collection and processing of my personal and health data as described.
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold rounded-xl mt-2"
            disabled={loading || !consentGiven}
          >
            {loading ? "Creating account..." : "Create Account"}
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="font-semibold text-primary hover:underline transition-all duration-150"
            >
              Sign in
            </button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default Register;
