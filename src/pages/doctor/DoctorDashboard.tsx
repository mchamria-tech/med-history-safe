import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, Clock, User, FileText, AlertTriangle, LogOut, Loader2 } from "lucide-react";
import carebagLogo from "@/assets/carebag-logo-redesign.png";
import { useDoctorCheck } from "@/hooks/useDoctorCheck";

interface PatientAccess {
  id: string;
  profile_id: string;
  expires_at: string;
  created_at: string;
  is_revoked: boolean;
  profile?: {
    name: string;
    carebag_id: string;
  };
}

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDoctor, isLoading: checkingDoctor, doctor } = useDoctorCheck();
  const [patientAccess, setPatientAccess] = useState<PatientAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!checkingDoctor && isDoctor && doctor) {
      fetchPatientAccess();
    }
  }, [checkingDoctor, isDoctor, doctor]);

  const fetchPatientAccess = async () => {
    try {
      const { data, error } = await supabase
        .from("doctor_access")
        .select(`
          id,
          profile_id,
          expires_at,
          created_at,
          is_revoked
        `)
        .eq("is_revoked", false)
        .gt("expires_at", new Date().toISOString())
        .order("expires_at", { ascending: true });

      if (error) throw error;

      // Fetch profile details for each access
      const accessWithProfiles = await Promise.all(
        (data || []).map(async (access) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, carebag_id")
            .eq("id", access.profile_id)
            .single();
          
          return { ...access, profile };
        })
      );

      setPatientAccess(accessWithProfiles);
    } catch (error: any) {
      console.error("Error fetching patient access:", error);
      toast({
        title: "Error",
        description: "Failed to load patient access records",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    
    if (diffMs <= 0) return "Expired";
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    return `${minutes}m remaining`;
  };

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffMs = expiry.getTime() - now.getTime();
    const hoursRemaining = diffMs / (1000 * 60 * 60);
    return hoursRemaining < 2;
  };

  if (checkingDoctor || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between bg-emerald-600 px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={carebagLogo} alt="CareBag" className="h-6 w-auto" />
          <h1 className="text-lg font-bold text-white">Doctor Portal</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-white hover:bg-emerald-700"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 space-y-6">
        {/* Welcome Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <Stethoscope className="h-7 w-7 text-emerald-600" />
              </div>
              <div>
                <CardTitle>Welcome, {doctor?.name || "Doctor"}</CardTitle>
                <CardDescription>
                  Global ID: {doctor?.global_id || "N/A"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Patient Access Section */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            Active Patient Access
          </h2>

          {patientAccess.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <User className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                <h3 className="font-medium text-foreground mb-1">No Active Access</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have any active patient access records.
                  <br />
                  Patients can grant you time-limited access to their records.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {patientAccess.map((access) => (
                <Card key={access.id} className={isExpiringSoon(access.expires_at) ? "border-amber-500/50" : ""}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{access.profile?.name || "Unknown Patient"}</h4>
                          <p className="text-sm text-muted-foreground">
                            ID: {access.profile?.carebag_id || access.profile_id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`flex items-center gap-1 text-sm ${isExpiringSoon(access.expires_at) ? "text-amber-600" : "text-muted-foreground"}`}>
                          {isExpiringSoon(access.expires_at) && <AlertTriangle className="h-4 w-4" />}
                          <Clock className="h-4 w-4" />
                          <span>{getTimeRemaining(access.expires_at)}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => navigate(`/doctor/patient/${access.profile_id}`)}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Records
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Info Card */}
        <Card className="bg-muted/30">
          <CardContent className="py-4">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Time-Limited Access</p>
                <p className="text-muted-foreground">
                  Your access to patient records is time-limited for security purposes. 
                  Once access expires, you will need a new authorization from the patient.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DoctorDashboard;
