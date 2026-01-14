import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Handshake, ArrowLeft, Mail, CheckCircle } from "lucide-react";
import carebagLogo from "@/assets/carebag-logo-redesign.png";

const PartnerLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Forgot password states
  const [showForgotDialog, setShowForgotDialog] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign in with email and password
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Verify partner role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "partner");

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        throw new Error("You don't have partner access");
      }

      // Verify partner code matches
      const { data: partner, error: partnerError } = await supabase
        .from("partners")
        .select("id, partner_code, is_active")
        .eq("user_id", authData.user.id)
        .single();

      if (partnerError || !partner) {
        await supabase.auth.signOut();
        throw new Error("Partner account not found");
      }

      if (partner.partner_code !== partnerCode.toUpperCase()) {
        await supabase.auth.signOut();
        throw new Error("Invalid partner code");
      }

      if (!partner.is_active) {
        await supabase.auth.signOut();
        throw new Error("Your partner account has been deactivated");
      }

      toast({
        title: "Welcome back!",
        description: "Successfully logged in to partner portal",
      });

      navigate("/partner/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!forgotEmail.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setIsSendingReset(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setResetSent(true);
    } catch (error: any) {
      console.error("Password reset error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  const closeForgotDialog = () => {
    setShowForgotDialog(false);
    setForgotEmail("");
    setResetSent(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between bg-primary px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-primary-foreground hover:bg-primary/80"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <img src={carebagLogo} alt="CareBag" className="h-6 w-auto" />
          <h1 className="text-lg font-bold text-primary-foreground">Partner Portal</h1>
        </div>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Handshake className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Partner Login</CardTitle>
            <CardDescription>
              Sign in to access your partner dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@company.com"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button
                    type="button"
                    onClick={() => setShowForgotDialog(true)}
                    className="text-sm text-accent hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partnerCode">Partner Code</Label>
                <Input
                  id="partnerCode"
                  type="text"
                  value={partnerCode}
                  onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                  placeholder="X3CZ3T"
                  required
                  maxLength={6}
                  className="bg-muted uppercase tracking-widest"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>

      {/* Forgot Password Dialog */}
      <Dialog open={showForgotDialog} onOpenChange={closeForgotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {resetSent ? "Check Your Email" : "Forgot Password"}
            </DialogTitle>
            <DialogDescription>
              {resetSent
                ? "We've sent a password reset link to your email address."
                : "Enter your email address and we'll send you a link to reset your password."}
            </DialogDescription>
          </DialogHeader>

          {resetSent ? (
            <div className="py-6 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-center text-muted-foreground">
                A password reset email has been sent to <strong>{forgotEmail}</strong>. 
                Please check your inbox and follow the instructions to reset your password.
              </p>
              <Button onClick={closeForgotDialog} className="w-full">
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="py-4">
                <Label htmlFor="forgotEmail">Email Address</Label>
                <div className="relative mt-2">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="forgotEmail"
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="partner@company.com"
                    className="pl-9"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={closeForgotDialog}>
                  Cancel
                </Button>
                <Button
                  onClick={handleForgotPassword}
                  disabled={isSendingReset || !forgotEmail.includes("@")}
                >
                  {isSendingReset ? "Sending..." : "Send Reset Link"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartnerLogin;
