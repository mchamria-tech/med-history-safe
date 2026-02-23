import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Activity, Loader2 } from "lucide-react";
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

const PatientLabAnalytics = () => {
  const { profileId } = useParams<{ profileId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profileName, setProfileName] = useState("");
  const [globalId, setGlobalId] = useState("");
  const [parameters, setParameters] = useState<LabParameter[]>([]);
  const [documentName, setDocumentName] = useState("");
  const [documentDate, setDocumentDate] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [showAll, setShowAll] = useState(false);

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
      setProfileName(data.name);
      setGlobalId(data.carebag_id || "N/A");
    }
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-lab-report-user", {
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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex w-full items-center gap-3 bg-primary px-4 py-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
          onClick={() => navigate(`/profile/${profileId}`)}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-primary-foreground truncate">
            {profileName || "Lab Analytics"}
          </h1>
          <p className="text-xs text-primary-foreground/70 font-mono">{globalId}</p>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 space-y-4">
        {/* Analyze Button */}
        <Card className="border">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground">Lab Report Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  AI will extract parameters from your most recent report
                </p>
              </div>
              <Button onClick={handleAnalyze} disabled={isAnalyzing} size="sm">
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
          <Card className="border">
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
                  <Label htmlFor="show-all-patient" className="text-sm text-muted-foreground">
                    Show all
                  </Label>
                  <Switch
                    id="show-all-patient"
                    checked={showAll}
                    onCheckedChange={setShowAll}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {parameters.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No parameters found. Make sure a lab report has been uploaded.
                </p>
              ) : displayed.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  All parameters are within normal range. Toggle "Show all" to see all values.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Parameter</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead>Ref. Range</TableHead>
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
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default PatientLabAnalytics;
