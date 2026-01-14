import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@supabase/supabase-js";

interface Doctor {
  id: string;
  user_id: string;
  global_id: string;
  name: string;
  specialty: string | null;
  hospital: string | null;
  email: string;
  phone: string | null;
  is_active: boolean;
}

export const useDoctorCheck = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDoctor, setIsDoctor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [doctor, setDoctor] = useState<Doctor | null>(null);

  useEffect(() => {
    checkDoctorAccess();
  }, []);

  const checkDoctorAccess = async () => {
    try {
      // Get current user
      const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !currentUser) {
        navigate("/doctor/login");
        return;
      }

      setUser(currentUser);

      // Check if user has doctor role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", currentUser.id)
        .eq("role", "doctor");

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have doctor privileges.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/doctor/login");
        return;
      }

      // Fetch doctor details
      const { data: doctorData, error: doctorError } = await supabase
        .from("doctors")
        .select("*")
        .eq("user_id", currentUser.id)
        .single();

      if (doctorError) {
        console.error("Error fetching doctor:", doctorError);
        // Doctor role exists but no doctor record - might be a setup issue
        toast({
          title: "Account Setup Required",
          description: "Your doctor account is not fully configured.",
          variant: "destructive",
        });
        navigate("/doctor/login");
        return;
      }

      if (!doctorData.is_active) {
        toast({
          title: "Account Inactive",
          description: "Your doctor account has been deactivated.",
          variant: "destructive",
        });
        await supabase.auth.signOut();
        navigate("/doctor/login");
        return;
      }

      setDoctor(doctorData);
      setIsDoctor(true);
    } catch (error: any) {
      console.error("Doctor check error:", error);
      toast({
        title: "Error",
        description: "Failed to verify doctor access.",
        variant: "destructive",
      });
      navigate("/doctor/login");
    } finally {
      setIsLoading(false);
    }
  };

  return { isDoctor, isLoading, user, doctor };
};
