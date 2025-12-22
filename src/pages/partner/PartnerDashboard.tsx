import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerCheck } from "@/hooks/usePartnerCheck";
import { useToast } from "@/hooks/use-toast";
import PartnerLayout from "@/components/partner/PartnerLayout";
import { 
  Search, 
  UserPlus, 
  Users, 
  FileText, 
  Upload, 
  HelpCircle,
  Phone,
  Mail,
  Send,
  CheckCircle,
  XCircle
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SearchResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  carebag_id: string | null;
}

const PartnerDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { partner } = usePartnerCheck();
  const [stats, setStats] = useState({
    linkedUsers: 0,
    totalDocuments: 0,
    documentsThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Search states
  const [searchCode, setSearchCode] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [searchNotFound, setSearchNotFound] = useState(false);
  const [isLinking, setIsLinking] = useState(false);

  // Forgot Code states
  const [forgotCodeTab, setForgotCodeTab] = useState<"phone" | "email">("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [userNotFound, setUserNotFound] = useState(false);

  // OTP Dialog states
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);

  // Linked users for checking
  const [linkedUserIds, setLinkedUserIds] = useState<string[]>([]);

  useEffect(() => {
    if (partner?.id) {
      fetchStats();
      fetchLinkedUserIds();
    }
  }, [partner?.id]);

  const fetchStats = async () => {
    try {
      const { count: usersCount } = await supabase
        .from("partner_users")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", partner!.id);

      const { count: docsCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", partner!.id);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyDocsCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", partner!.id)
        .gte("created_at", startOfMonth.toISOString());

      setStats({
        linkedUsers: usersCount || 0,
        totalDocuments: docsCount || 0,
        documentsThisMonth: monthlyDocsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLinkedUserIds = async () => {
    try {
      const { data } = await supabase
        .from("partner_users")
        .select("profile_id")
        .eq("partner_id", partner!.id);

      setLinkedUserIds(data?.map(u => u.profile_id) || []);
    } catch (error) {
      console.error("Error fetching linked users:", error);
    }
  };

  const handleSearchByCode = async () => {
    if (!searchCode.trim()) return;

    setIsSearching(true);
    setSearchResult(null);
    setSearchNotFound(false);

    try {
      const code = searchCode.trim().toUpperCase();
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, phone, carebag_id")
        .eq("carebag_id", code)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (linkedUserIds.includes(data.id)) {
          toast({
            title: "Already Linked",
            description: "This user is already linked to your account",
          });
        } else {
          setSearchResult(data);
        }
      } else {
        setSearchNotFound(true);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestLink = async (profileId: string) => {
    try {
      setIsLinking(true);

      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const { error } = await supabase.from("partner_otp_requests").insert({
        partner_id: partner!.id,
        profile_id: profileId,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      toast({
        title: "OTP Sent",
        description: `Demo OTP: ${otp} (In production, this would be sent to the user)`,
      });

      setPendingProfileId(profileId);
      setShowOtpDialog(true);
    } catch (error: any) {
      console.error("Error requesting link:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleSendForgotCodeOtp = async () => {
    setIsSendingOtp(true);
    setOtpSent(false);
    setUserNotFound(false);

    try {
      let searchValue = "";
      if (forgotCodeTab === "phone") {
        if (phoneNumber.length !== 10) {
          toast({
            title: "Invalid Phone",
            description: "Please enter a valid 10-digit mobile number",
            variant: "destructive",
          });
          setIsSendingOtp(false);
          return;
        }
        searchValue = `+91${phoneNumber}`;
      } else {
        if (!emailAddress.includes("@")) {
          toast({
            title: "Invalid Email",
            description: "Please enter a valid email address",
            variant: "destructive",
          });
          setIsSendingOtp(false);
          return;
        }
        searchValue = emailAddress.trim().toLowerCase();
      }

      // Search for user
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, phone, carebag_id")
        .or(forgotCodeTab === "phone" 
          ? `phone.eq.${searchValue},phone.eq.${phoneNumber}` 
          : `email.ilike.${searchValue}`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        setUserNotFound(true);
        return;
      }

      // User found - generate OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      const { error: otpError } = await supabase.from("partner_otp_requests").insert({
        partner_id: partner!.id,
        profile_id: data.id,
        otp_code: otp,
        expires_at: expiresAt.toISOString(),
      });

      if (otpError) throw otpError;

      setOtpSent(true);
      setPendingProfileId(data.id);
      setSearchResult(data);

      toast({
        title: "OTP Sent",
        description: `Demo OTP: ${otp} (Sent to ${forgotCodeTab === "phone" ? "phone" : "email"})`,
      });

      setShowOtpDialog(true);
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || !pendingProfileId) return;

    try {
      const { data: otpRequest, error: otpError } = await supabase
        .from("partner_otp_requests")
        .select("*")
        .eq("partner_id", partner!.id)
        .eq("profile_id", pendingProfileId)
        .eq("otp_code", otpCode)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (otpError) throw otpError;

      if (!otpRequest) {
        toast({
          title: "Invalid OTP",
          description: "The OTP is invalid or has expired",
          variant: "destructive",
        });
        return;
      }

      await supabase
        .from("partner_otp_requests")
        .update({ verified: true })
        .eq("id", otpRequest.id);

      const { error: linkError } = await supabase.from("partner_users").insert({
        partner_id: partner!.id,
        profile_id: pendingProfileId,
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
      });

      if (linkError) throw linkError;

      toast({
        title: "User Linked",
        description: "User has been successfully linked to your account",
      });

      resetAllStates();
      fetchStats();
      fetchLinkedUserIds();
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetAllStates = () => {
    setShowOtpDialog(false);
    setOtpCode("");
    setPendingProfileId(null);
    setSearchResult(null);
    setSearchCode("");
    setSearchNotFound(false);
    setPhoneNumber("");
    setEmailAddress("");
    setOtpSent(false);
    setUserNotFound(false);
  };

  const statCards = [
    { title: "Linked Users", value: stats.linkedUsers, icon: Users, color: "text-blue-500", bgColor: "bg-blue-500/10" },
    { title: "Total Documents", value: stats.totalDocuments, icon: FileText, color: "text-green-500", bgColor: "bg-green-500/10" },
    { title: "Uploads This Month", value: stats.documentsThisMonth, icon: Upload, color: "text-accent", bgColor: "bg-accent/10" },
  ];

  return (
    <PartnerLayout>
      <div className="space-y-6">
        {/* Header with Partner Info Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Manage your linked users and documents</p>
          </div>
          
          {/* Partner Info Panel */}
          <div className="flex items-center gap-3 px-4 py-2 bg-muted/50 rounded-lg border border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Code:</span>
              <Badge variant="secondary" className="font-mono">{partner?.partner_code}</Badge>
            </div>
            <div className="h-4 w-px bg-border" />
            <Badge className={partner?.is_active ? "bg-green-500" : "bg-red-500"}>
              {partner?.is_active ? "Active" : "Inactive"}
            </Badge>
            <div className="h-4 w-px bg-border hidden sm:block" />
            <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[150px]">
              {partner?.email}
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-soft">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {isLoading ? "..." : stat.value}
                      </p>
                    </div>
                    <div className={`p-2.5 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Action: Search or Add User */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search User by Code
            </CardTitle>
            <CardDescription>
              Enter the user's CareBag ID to find and link them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Input
                placeholder="Enter CareBag ID (e.g., 1ABC12)"
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(e.target.value.toUpperCase());
                  setSearchNotFound(false);
                  setSearchResult(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleSearchByCode()}
                className="font-mono uppercase"
              />
              <Button onClick={handleSearchByCode} disabled={isSearching || !searchCode.trim()}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {/* Search Result - Found */}
            {searchResult && (
              <div className="p-4 border border-green-500/30 bg-green-500/5 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="font-medium text-green-600">User Found!</span>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{searchResult.name}</p>
                    <p className="text-sm text-muted-foreground">
                      CareBag ID: {searchResult.carebag_id}
                    </p>
                  </div>
                  <Button onClick={() => handleRequestLink(searchResult.id)} disabled={isLinking}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isLinking ? "Sending OTP..." : "Add User"}
                  </Button>
                </div>
              </div>
            )}

            {/* Search Result - Not Found */}
            {searchNotFound && (
              <div className="p-4 border border-orange-500/30 bg-orange-500/5 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-orange-500" />
                  <span className="font-medium text-orange-600">User Not Found</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  No user exists with this CareBag ID. Would you like to create a new user?
                </p>
                <Button variant="outline" onClick={() => navigate("/partner/new-user")}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create New User
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Forgot Code Section */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              Forgot CareBag Code?
            </CardTitle>
            <CardDescription>
              Send an OTP to the user's phone or email to verify and link them
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={forgotCodeTab} onValueChange={(v) => setForgotCodeTab(v as "phone" | "email")}>
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </TabsTrigger>
              </TabsList>

              <TabsContent value="phone" className="mt-4">
                <div className="flex gap-2">
                  <div className="flex items-center gap-1 px-3 bg-muted rounded-l-md border border-r-0 border-input">
                    <span className="text-sm text-muted-foreground">🇮🇳</span>
                    <span className="text-sm font-medium">+91</span>
                  </div>
                  <Input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhoneNumber(value);
                      setUserNotFound(false);
                    }}
                    className="rounded-l-none flex-1"
                    maxLength={10}
                  />
                  <Button 
                    onClick={handleSendForgotCodeOtp} 
                    disabled={isSendingOtp || phoneNumber.length !== 10}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSendingOtp ? "Sending..." : "Send OTP"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="email" className="mt-4">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={emailAddress}
                    onChange={(e) => {
                      setEmailAddress(e.target.value);
                      setUserNotFound(false);
                    }}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendForgotCodeOtp} 
                    disabled={isSendingOtp || !emailAddress.includes("@")}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isSendingOtp ? "Sending..." : "Send OTP"}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            {/* User Not Found - Suggest Creating New */}
            {userNotFound && (
              <div className="p-4 border border-orange-500/30 bg-orange-500/5 rounded-lg animate-fade-in">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="h-5 w-5 text-orange-500" />
                  <span className="font-medium text-orange-600">User Not Found</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  This {forgotCodeTab === "phone" ? "phone number" : "email"} is not registered with CareBag. 
                  This user needs to be created as a new member.
                </p>
                <Button variant="outline" onClick={() => navigate("/partner/new-user")}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create New User
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <button
                onClick={() => navigate("/partner/users")}
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
              >
                <Users className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Manage Users</p>
                  <p className="text-sm text-muted-foreground">
                    View all linked profiles
                  </p>
                </div>
              </button>
              <button
                onClick={() => navigate("/partner/upload")}
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors text-left"
              >
                <Upload className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Upload Document</p>
                  <p className="text-sm text-muted-foreground">
                    Upload documents for users
                  </p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OTP Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Verification Code</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP to verify and link the user.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="otp">OTP Code</Label>
            <Input
              id="otp"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="123456"
              maxLength={6}
              className="mt-2 text-center text-2xl tracking-widest font-mono"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOtpDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyOtp} disabled={otpCode.length !== 6}>
              Verify & Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PartnerLayout>
  );
};

export default PartnerDashboard;
