import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Partner {
  id: string;
  partner_code: string;
  name: string;
  logo_url: string | null;
  email: string;
  is_active: boolean;
}

export const usePartnerCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isPartner, setIsPartner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [partner, setPartner] = useState<Partner | null>(null);

  useEffect(() => {
    checkPartnerAccess();
  }, []);

  const checkPartnerAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/partner/login");
        return;
      }

      setUser(user);

      // Check if user has partner role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "partner");

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have partner privileges",
          variant: "destructive",
        });
        navigate("/partner/login");
        return;
      }

      // Fetch partner details
      const { data: partnerData, error: partnerError } = await supabase
        .from("partners")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (partnerError) throw partnerError;

      if (!partnerData?.is_active) {
        toast({
          title: "Account Inactive",
          description: "Your partner account has been deactivated",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/partner/login");
        return;
      }

      setPartner(partnerData);
      setIsPartner(true);
    } catch (error) {
      console.error("Error checking partner access:", error);
      navigate("/partner/login");
    } finally {
      setIsLoading(false);
    }
  };

  return { isPartner, isLoading, user, partner };
};
