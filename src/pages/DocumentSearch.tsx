import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Trash2, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { getSignedUrl } from "@/hooks/useSignedUrl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SearchResult {
  id: string;
  document_name: string;
  document_url: string;
  document_date: string;
  profile_id: string;
  profile_name: string;
  doctor_name: string | null;
  ailment: string | null;
  medicine: string | null;
  other_tags: string | null;
  matchCount: number;
  matchedTags: string[];
}

const DocumentSearch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useState({
    doctorName: "",
    ailment: "",
    medicine: "",
    other: "",
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);

  const handleSearch = async () => {
    setSearching(true);
    setHasSearched(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      // Get all documents for the user with profile information
      const { data: documents, error } = await supabase
        .from("documents")
        .select(`
          *,
          profiles!inner(name)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      // Filter and score documents based on search parameters
      const searchTerms = {
        doctorName: searchParams.doctorName.toLowerCase().trim(),
        ailment: searchParams.ailment.toLowerCase().trim(),
        medicine: searchParams.medicine.toLowerCase().trim(),
        other: searchParams.other.toLowerCase().trim(),
      };

      const activeSearchTerms = Object.entries(searchTerms).filter(
        ([_, value]) => value !== ""
      );

      if (activeSearchTerms.length === 0) {
        toast({
          title: "No search terms",
          description: "Please enter at least one search term",
          variant: "destructive",
        });
        setSearching(false);
        return;
      }

      const scoredResults: SearchResult[] = (documents || [])
        .map((doc: any) => {
          let matchCount = 0;
          const matchedTags: string[] = [];

          if (
            searchTerms.doctorName &&
            doc.doctor_name?.toLowerCase().includes(searchTerms.doctorName)
          ) {
            matchCount++;
            matchedTags.push(`Doctor: ${doc.doctor_name}`);
          }

          if (
            searchTerms.ailment &&
            doc.ailment?.toLowerCase().includes(searchTerms.ailment)
          ) {
            matchCount++;
            matchedTags.push(`Ailment: ${doc.ailment}`);
          }

          if (
            searchTerms.medicine &&
            doc.medicine?.toLowerCase().includes(searchTerms.medicine)
          ) {
            matchCount++;
            matchedTags.push(`Medicine: ${doc.medicine}`);
          }

          if (
            searchTerms.other &&
            doc.other_tags?.toLowerCase().includes(searchTerms.other)
          ) {
            matchCount++;
            matchedTags.push(`Other: ${doc.other_tags}`);
          }

          return {
            id: doc.id,
            document_name: doc.document_name,
            document_url: doc.document_url,
            document_date: doc.document_date,
            profile_id: doc.profile_id,
            profile_name: doc.profiles.name,
            doctor_name: doc.doctor_name,
            ailment: doc.ailment,
            medicine: doc.medicine,
            other_tags: doc.other_tags,
            matchCount,
            matchedTags,
          };
        })
        .filter((result) => result.matchCount > 0)
        .sort((a, b) => b.matchCount - a.matchCount);

      setResults(scoredResults);
    } catch (error: any) {
      console.error("Error searching documents:", error);
      toast({
        title: "Error",
        description: "Failed to search documents",
        variant: "destructive",
      });
    } finally {
      setSearching(false);
    }
  };

  const handleViewDocument = async (documentUrl: string) => {
    try {
      const { url, error } = await getSignedUrl('profile-documents', documentUrl);
      if (error || !url) throw new Error(error || 'Failed to get URL');
      window.open(url, "_blank");
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Failed to view document",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (documentId: string) => {
    setDocumentToDelete(documentId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!documentToDelete) return;

    try {
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", documentToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      // Remove from results
      setResults(results.filter((r) => r.id !== documentToDelete));
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    }
  };

  const handleClearSearch = () => {
    setResults([]);
    setHasSearched(false);
    setSearchParams({
      doctorName: "",
      ailment: "",
      medicine: "",
      other: "",
    });
  };

  const groupedResults = {
    fourMatches: results.filter((r) => r.matchCount === 4),
    threeMatches: results.filter((r) => r.matchCount === 3),
    twoMatches: results.filter((r) => r.matchCount === 2),
    oneMatch: results.filter((r) => r.matchCount === 1),
  };

  const ResultCard = ({ result }: { result: SearchResult }) => (
    <Card className="p-3">
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <p className="font-semibold text-foreground text-sm truncate">
            {result.profile_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">
            Doc: {result.document_name}
          </p>
          <p className="text-xs text-muted-foreground">
            Date: {format(new Date(result.document_date), 'dd MMM yyyy')}
          </p>
          <p className="text-xs text-foreground">
            <span className="font-medium">Keywords:</span> {result.matchedTags.join(', ')}
          </p>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button
            size="sm"
            variant="outline"
            className="h-8 w-8 p-0"
            onClick={() => handleViewDocument(result.document_url)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="h-8 w-8 p-0"
            onClick={() => handleDeleteClick(result.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="flex w-full items-center bg-primary px-4 py-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary-foreground hover:bg-primary/80 mr-2"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary-foreground">Document Search</h1>
      </header>

      <div className="p-4 max-w-4xl mx-auto">
        <Card className="p-4 mb-4">
          <h2 className="text-lg font-semibold text-foreground mb-4 text-center">
            Search By:
          </h2>

          <div className="space-y-3">
            <div>
              <Label htmlFor="doctorName" className="text-sm">Doctor Name:</Label>
              <Input
                id="doctorName"
                value={searchParams.doctorName}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, doctorName: e.target.value })
                }
                placeholder="Enter doctor name"
                className="h-10"
              />
            </div>

            <div>
              <Label htmlFor="ailment" className="text-sm">Ailment:</Label>
              <Input
                id="ailment"
                value={searchParams.ailment}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, ailment: e.target.value })
                }
                placeholder="Enter ailment"
                className="h-10"
              />
            </div>

            <div>
              <Label htmlFor="medicine" className="text-sm">Medicine:</Label>
              <Input
                id="medicine"
                value={searchParams.medicine}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, medicine: e.target.value })
                }
                placeholder="Enter medicine"
                className="h-10"
              />
            </div>

            <div>
              <Label htmlFor="other" className="text-sm">Other:</Label>
              <Input
                id="other"
                value={searchParams.other}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, other: e.target.value })
                }
                placeholder="Enter other tags"
                className="h-10"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={searching}
            className="w-full mt-4 h-12"
          >
            {searching ? "Searching..." : "Search Documents"}
          </Button>
        </Card>

        {hasSearched && results.length === 0 && (
          <Card className="p-6 text-center">
            <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No documents found with those search parameters
            </p>
          </Card>
        )}

        {hasSearched && results.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-foreground">Results</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearSearch}
                className="flex items-center gap-1"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
            </div>
            
            {groupedResults.fourMatches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  All 4 Terms Matched ({groupedResults.fourMatches.length})
                </h3>
                <div className="space-y-2">
                  {groupedResults.fourMatches.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))}
                </div>
              </div>
            )}

            {groupedResults.threeMatches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  3 Terms Matched ({groupedResults.threeMatches.length})
                </h3>
                <div className="space-y-2">
                  {groupedResults.threeMatches.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))}
                </div>
              </div>
            )}

            {groupedResults.twoMatches.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  2 Terms Matched ({groupedResults.twoMatches.length})
                </h3>
                <div className="space-y-2">
                  {groupedResults.twoMatches.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))}
                </div>
              </div>
            )}

            {groupedResults.oneMatch.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  1 Term Matched ({groupedResults.oneMatch.length})
                </h3>
                <div className="space-y-2">
                  {groupedResults.oneMatch.map((result) => (
                    <ResultCard key={result.id} result={result} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentSearch;
