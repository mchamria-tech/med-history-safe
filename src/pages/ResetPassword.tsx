import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import careBagLogo from "@/assets/carebag-logo.png";
import { ArrowLeft } from "lucide-react";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user has a valid session from reset link
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Invalid or expired reset link");
        navigate("/login");
      }
    });
  }, [navigate]);

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

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Compact Header */}
      <header className="flex w-full items-center bg-primary px-4 py-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary-foreground hover:bg-primary/80 mr-2"
          onClick={() => navigate("/login")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary-foreground">Reset Password</h1>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center px-4 py-8">
        {/* Logo - Compact */}
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary bg-white p-3">
          <img
            src={careBagLogo}
            alt="CareBag Logo"
            className="h-full w-full object-contain"
          />
        </div>

        {/* Reset Password Form */}
        <div className="w-full max-w-md space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="h-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-lg font-semibold"
              disabled={loading}
            >
              {loading ? "UPDATING..." : "UPDATE PASSWORD"}
            </Button>
          </form>

          {/* Back to Login */}
          <div className="text-center pt-4">
            <p className="text-sm text-muted-foreground">
              Remember your password?{" "}
              <button
                onClick={() => navigate("/login")}
                className="font-semibold text-primary hover:underline"
              >
                Log in here
              </button>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPassword;
