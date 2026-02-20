import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useSuperAdminCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkSuperAdminAccess();
  }, []);

  const checkSuperAdminAccess = async () => {
    try {
      // Check session cache first
      const cached = sessionStorage.getItem("isSuperAdmin");
      const cachedUserId = sessionStorage.getItem("superAdminUserId");
      
      if (cached === "true" && cachedUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user && user.id === cachedUserId) {
          setUser(user);
          setIsSuperAdmin(true);
          setIsLoading(false);
          return;
        }
        // Cache is stale, clear it
        sessionStorage.removeItem("isSuperAdmin");
        sessionStorage.removeItem("superAdminUserId");
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/admin/login");
        return;
      }

      setUser(user);

      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin");

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have super admin privileges",
          variant: "destructive",
        });
        navigate("/dashboard");
        return;
      }

      setIsSuperAdmin(true);
      sessionStorage.setItem("isSuperAdmin", "true");
      sessionStorage.setItem("superAdminUserId", user.id);
    } catch (error) {
      console.error("Error checking super admin access:", error);
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  return { isSuperAdmin, isLoading, user };
};
