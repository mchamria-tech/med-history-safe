import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useDoctorCheck } from "@/hooks/useDoctorCheck";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Activity,
  Loader2,
  Info,
  Lightbulb,
  Clock,
  FileText,
  AlertTriangle,
  Stethoscope,
  Heart,
  Eye,
} from "lucide-react";
import { getSignedUrl } from "@/hooks/useSignedUrl";
import carebagLogo from "@/assets/carebag-logo-redesign.png";

interface LabParameter {
  name: string;
  value: string;
  unit: string;
  reference_range: string;
  is_out_of_range: boolean;
  status: "normal" | "high" | "low";
}

interface DocumentRow {
  id: string;
  document_name: string;
  document_date: string;
  document_type: string | null;
  document_url: string;
}

const DoctorPatientView = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isDoctor, isLoading: checkingDoctor, doctor } = useDoctorCheck();

  const [patientName, setPatientName] = useState("");
  const [globalId, setGlobalId] = useState("");
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isPersistentAccess, setIsPersistentAccess] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");

  const [parameters, setParameters] = useState<LabParameter[]>([]);
  const [documentName, setDocumentName] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [insights, setInsights] = useState("");

  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [openingDocId, setOpeningDocId] = useState<string | null>(null);

  useEffect(() => {
    if (!checkingDoctor && isDoctor && doctor && profileId) {
      fetchPatientInfo();
      fetchAccessExpiry();
      fetchDocuments();
    }
  }, [checkingDoctor, isDoctor, doctor, profileId]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diffMs = expiry.getTime() - now.getTime();
      if (diffMs <= 0) {
        setTimeRemaining("Expired");
        clearInterval(interval);
        return;
      }
      const h = Math.floor(diffMs / (1000 * 60 * 60));
      const m = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diffMs % (1000 * 60)) / 1000);
      setTimeRemaining(h > 0 ? `${h}h ${m}m ${s}s` : `${m}m ${s}s`);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const fetchPatientInfo = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("name, carebag_id")
      .eq("id", profileId!)
      .maybeSingle();
    if (data) {
      setPatientName(data.name);
      setGlobalId(data.carebag_id || "N/A");
    }
  };

  const fetchAccessExpiry = async () => {
    const { data } = await supabase
      .from("doctor_access")
      .select("expires_at")
      .eq("profile_id", profileId!)
      .eq("is_revoked", false)
      .gt("expires_at", new Date().toISOString())
      .order("expires_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setExpiresAt(data.expires_at);
      return;
    }

    try {
      const { data: persistent } = await supabase
        .from("doctor_patients")
        .select("id")
        .eq("profile_id", profileId!)
        .eq("is_active", true)
        .maybeSingle();
      if (persistent) {
        setIsPersistentAccess(true);
      }
    } catch {
      // Table might not exist yet
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data } = await supabase
        .from("documents")
        .select("id, document_name, document_date, document_type, document_url")
        .eq("profile_id", profileId!)
        .order("document_date", { ascending: false });
      setDocuments(data || []);
    } catch {
      // Might not have RLS access to all docs
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleViewDocument = async (doc: DocumentRow) => {
    setOpeningDocId(doc.id);
    try {
      const newWindow = window.open("", "_blank");
      const { url, error } = await getSignedUrl("profile-documents", doc.document_url);
      if (url && !error && newWindow) {
        newWindow.location.href = url;
      } else {
        newWindow?.close();
        toast({
          title: "Error",
          description: "Failed to open document",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Failed to open document",
        variant: "destructive",
      });
    } finally {
      setOpeningDocId(null);
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-lab-report-doctor", {
        body: { profileId },
      });

      if (error) throw error;

      if (data?.error && !data?.parameters) {
        toast({
          title: "Analysis Issue",
          description: data.error,
          variant: "destructive",
        });
        setHasAnalyzed(true);
        return;
      }

      setParameters(data.parameters || []);
      setDocumentName(data.document_name || "");
      setDocumentDate(data.document_date || "");
      setInsights(data.insights || "");
      setHasAnalyzed(true);

      if (data.parameters?.length > 0) {
        const outOfRange = data.parameters.filter((p: LabParameter) => p.is_out_of_range);
        toast({
          title: "Analysis Complete",
          description: `Found ${data.parameters.length} parameters, ${outOfRange.length} out of range`,
        });
      }
    } catch (err: any) {
      console.error("Analysis error:", err);
      let errorMsg = "Failed to analyze lab report";
      try {
        if (err?.context?.body) {
          const body = await err.context.body.json?.() || JSON.parse(await err.context.body.text?.());
          if (body?.error) errorMsg = body.error;
        } else if (err?.message) {
          errorMsg = err.message;
        }
      } catch { /* use default */ }
      toast({
        title: "Analysis Failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const displayed = showAll ? parameters : parameters.filter((p) => p.is_out_of_range);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high": return "text-red-600 font-semibold";
      case "low": return "text-blue-600 font-semibold";
      default: return "text-emerald-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "high": return "bg-red-100 text-red-700 border-red-200";
      case "low": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  if (checkingDoctor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const isExpired = !isPersistentAccess && timeRemaining === "Expired";
  const hasAccess = isPersistentAccess || (expiresAt && !isExpired);

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
          onClick={() => navigate("/doctor/dashboard")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </header>

      <main className="flex-1 p-4 space-y-6 max-w-4xl mx-auto w-full">
        {/* Patient Header */}
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{patientName || "Patient"}</h2>
                  <p className="text-sm text-muted-foreground font-mono">{globalId}</p>
                </div>
              </div>
              {isPersistentAccess ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                  <Heart className="h-4 w-4" />
                  Care Team
                </div>
              ) : expiresAt ? (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium ${
                  isExpired
                    ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                }`}>
                  {isExpired ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  {isExpired ? "Access Expired" : timeRemaining}
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {isExpired ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-400 mb-4" />
              <h3 className="font-medium text-foreground mb-1">Access Expired</h3>
              <p className="text-sm text-muted-foreground">
                Your access to this patient's records has expired. Please request new access from the patient.
              </p>
              <Button className="mt-4" onClick={() => navigate("/doctor/dashboard")}>
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Document List - Now shown first with View buttons */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Patient Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingDocs ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    No documents available for this patient.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.document_name}</TableCell>
                          <TableCell className="text-muted-foreground">{doc.document_type || "—"}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(doc.document_date).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              disabled={openingDocId === doc.id}
                              onClick={() => handleViewDocument(doc)}
                            >
                              {openingDocId === doc.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <Eye className="h-3 w-3 mr-1" />
                                  View
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* AI Analysis Card */}
            <Card className="shadow-soft">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-foreground">AI Lab Report Analysis</h3>
                    <p className="text-sm text-muted-foreground">
                      Analyze the most recent lab report with AI to highlight out-of-range parameters
                    </p>
                  </div>
                  <Button onClick={handleAnalyze} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Analyze
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {hasAnalyzed && (
              <>
                <Card className="shadow-soft">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">Lab Parameters</CardTitle>
                        {documentName && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Source: {documentName}
                            {documentDate && ` (${documentDate})`}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="show-all" className="text-sm text-muted-foreground">
                          Show all
                        </Label>
                        <Switch id="show-all" checked={showAll} onCheckedChange={setShowAll} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {parameters.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No parameters found. Make sure a lab report has been uploaded for this patient.
                      </p>
                    ) : displayed.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        All parameters are within normal range. Toggle "Show all" to see all values.
                      </p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Parameter</TableHead>
                            <TableHead>Value</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead>Reference Range</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {displayed.map((param, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{param.name}</TableCell>
                              <TableCell className={getStatusColor(param.status)}>{param.value}</TableCell>
                              <TableCell className="text-muted-foreground">{param.unit}</TableCell>
                              <TableCell className="text-muted-foreground">{param.reference_range}</TableCell>
                              <TableCell>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(param.status)}`}>
                                  {param.status === "normal" ? "Normal" : param.status === "high" ? "High" : "Low"}
                                </span>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                {/* Medical Disclaimer */}
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                  <Info className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-amber-800 dark:text-amber-300">Medical Disclaimer</AlertTitle>
                  <AlertDescription className="text-amber-700 dark:text-amber-400 text-sm">
                    This analysis is generated by AI for <strong>educational purposes only</strong>. It is not a medical diagnosis, and should not be used as a substitute for professional medical advice, diagnosis, or treatment. Always consult a qualified healthcare provider for interpretation of lab results and any health concerns.
                  </AlertDescription>
                </Alert>

                {/* AI Insights */}
                {insights && (
                  <Card className="shadow-soft">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-amber-500" />
                        Educational Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                        {insights}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default DoctorPatientView;
