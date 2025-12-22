import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, ArrowLeft } from "lucide-react";

const PartnerLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [partnerCode, setPartnerCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
        <h1 className="text-lg font-bold text-primary-foreground">Partner Portal</h1>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="h-8 w-8 text-accent" />
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
                <Label htmlFor="password">Password</Label>
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
    </div>
  );
};

export default PartnerLogin;
