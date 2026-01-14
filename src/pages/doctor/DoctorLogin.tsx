import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Stethoscope, Loader2 } from "lucide-react";
import carebagLogo from "@/assets/carebag-logo-redesign.png";

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Check if user has doctor role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "doctor");

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        // Sign out since they don't have doctor access
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You don't have doctor privileges. Please use the appropriate login portal.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome, Doctor!",
        description: "You have successfully logged in.",
      });

      navigate("/doctor/dashboard");
    } catch (error: any) {
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
      <header className="flex items-center justify-between bg-emerald-600 px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-emerald-700"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <img src={carebagLogo} alt="CareBag" className="h-6 w-auto" />
          <h1 className="text-lg font-bold text-white">Doctor Portal</h1>
        </div>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4">
              <Stethoscope className="h-8 w-8 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl">Doctor Login</CardTitle>
            <CardDescription>
              Access patient records with time-limited authorization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>

              <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Not a doctor?{" "}
                <button
                  onClick={() => navigate("/")}
                  className="text-primary hover:underline font-medium"
                >
                  Return to home
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DoctorLogin;
