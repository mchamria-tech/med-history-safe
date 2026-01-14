import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Shield, Loader2, Mail, Hash } from "lucide-react";
import carebagLogo from "@/assets/carebag-logo-redesign.png";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [globalId, setGlobalId] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState<"email" | "globalId">("email");

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Sign in with email
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Check if user has super_admin role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "super_admin");

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You don't have super admin privileges. Please use the regular login.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome, Admin!",
        description: "You have successfully logged in.",
      });

      navigate("/admin");
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

  const handleGlobalIdLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate Global ID format (IND-0XXXXX for admin)
      const globalIdPattern = /^IND-0[A-Z0-9]{5}$/i;
      if (!globalIdPattern.test(globalId)) {
        throw new Error("Invalid Admin Global ID format. Expected: IND-0XXXXX");
      }

      // Look up admin profile by global_id using RPC (bypasses RLS for auth)
      const { data: profile, error: profileError } = await supabase
        .rpc('get_email_by_global_id', { global_id: globalId.toUpperCase() })
        .single();

      if (profileError || !profile) {
        throw new Error("Admin ID not found");
      }

      if (!profile.email) {
        throw new Error("No email associated with this Admin ID");
      }

      // Sign in with the email found
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: profile.email,
        password,
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("Authentication failed");
      }

      // Check if user has super_admin role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", authData.user.id)
        .eq("role", "super_admin");

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "This ID is not associated with super admin privileges.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Welcome, Admin!",
        description: "You have successfully logged in.",
      });

      navigate("/admin");
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
          <h1 className="text-lg font-bold text-primary-foreground">System Administration</h1>
        </div>
        <div className="w-10" />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-accent" />
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Sign in with your super admin credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={loginMethod} onValueChange={(v) => setLoginMethod(v as "email" | "globalId")}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="globalId" className="flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  Global ID
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email">
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="admin@example.com"
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

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In as Admin"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="globalId">
                <form onSubmit={handleGlobalIdLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="globalId">Admin Global ID</Label>
                    <Input
                      id="globalId"
                      type="text"
                      placeholder="IND-0XXXXX"
                      value={globalId}
                      onChange={(e) => setGlobalId(e.target.value.toUpperCase())}
                      required
                      disabled={isLoading}
                      className="font-mono"
                    />
                    <p className="text-xs text-muted-foreground">
                      Format: IND-0 followed by 5 characters
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password-global">Password</Label>
                    <Input
                      id="password-global"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In with Global ID"
                    )}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Not an admin?{" "}
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

export default AdminLogin;
