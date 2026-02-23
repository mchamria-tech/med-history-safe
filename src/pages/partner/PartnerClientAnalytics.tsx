import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerCheck } from "@/hooks/usePartnerCheck";
import { useToast } from "@/hooks/use-toast";
import PartnerLayout from "@/components/partner/PartnerLayout";
import { ArrowLeft, Activity, Loader2, Info, Lightbulb } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LabParameter {
  name: string;
  value: string;
  unit: string;
  reference_range: string;
  is_out_of_range: boolean;
  status: "normal" | "high" | "low";
}

const PartnerClientAnalytics = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { partner } = usePartnerCheck();

  const [clientName, setClientName] = useState("");
  const [globalId, setGlobalId] = useState("");
  const [parameters, setParameters] = useState<LabParameter[]>([]);
  const [documentName, setDocumentName] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [insights, setInsights] = useState("");

  useEffect(() => {
    if (profileId) {
      fetchProfile();
    }
  }, [profileId]);

  const fetchProfile = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("name, carebag_id")
      .eq("id", profileId!)
      .maybeSingle();

    if (data) {
      setClientName(data.name);
      setGlobalId(data.carebag_id || "N/A");
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-lab-report", {
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
      // Extract detailed error from edge function response body
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

  const displayed = showAll
    ? parameters
    : parameters.filter((p) => p.is_out_of_range);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "high":
        return "text-red-600 font-semibold";
      case "low":
        return "text-blue-600 font-semibold";
      default:
        return "text-emerald-600";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "low":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
    }
  };

  return (
    <PartnerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/partner/users")}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{clientName || "Patient"}</h1>
            <p className="text-sm text-muted-foreground font-mono">{globalId}</p>
          </div>
        </div>

        {/* Analyze Button */}
        <Card className="shadow-soft">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-foreground">Lab Report Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  AI will extract parameters from the most recent uploaded report
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
                    Analyze Reports
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
                  <Switch
                    id="show-all"
                    checked={showAll}
                    onCheckedChange={setShowAll}
                  />
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
                        <TableCell className={getStatusColor(param.status)}>
                          {param.value}
                        </TableCell>
                        <TableCell className="text-muted-foreground">{param.unit}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {param.reference_range}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(param.status)}`}
                          >
                            {param.status === "normal"
                              ? "Normal"
                              : param.status === "high"
                              ? "High"
                              : "Low"}
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
      </div>
    </PartnerLayout>
  );
};

export default PartnerClientAnalytics;
