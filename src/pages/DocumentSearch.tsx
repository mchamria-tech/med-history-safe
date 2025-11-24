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

  const getDocumentUrl = (documentUrl: string) => {
    let filePath = documentUrl;
    
    // Check if it's a full URL (old format) or just a path (new format)
    if (documentUrl.includes('supabase.co')) {
      // Extract the file path from the full URL
      const urlParts = documentUrl.split('/profile-documents/');
      filePath = urlParts[1]; // Gets "user_id/profile_id/filename"
    }
    
    const { data } = supabase.storage
      .from('profile-documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handleViewDocument = (documentUrl: string) => {
    const publicUrl = getDocumentUrl(documentUrl);
    window.open(publicUrl, "_blank");
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

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <h1 className="text-3xl font-bold text-foreground mb-8 text-center">
          Document Search
        </h1>

        <Card className="p-6 mb-8">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">
            Search By:
          </h2>

          <div className="space-y-4">
            <div>
              <Label htmlFor="doctorName">Doctor Name:</Label>
              <Input
                id="doctorName"
                value={searchParams.doctorName}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, doctorName: e.target.value })
                }
                placeholder="Enter doctor name"
              />
            </div>

            <div>
              <Label htmlFor="ailment">Ailment:</Label>
              <Input
                id="ailment"
                value={searchParams.ailment}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, ailment: e.target.value })
                }
                placeholder="Enter ailment"
              />
            </div>

            <div>
              <Label htmlFor="medicine">Medicine:</Label>
              <Input
                id="medicine"
                value={searchParams.medicine}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, medicine: e.target.value })
                }
                placeholder="Enter medicine"
              />
            </div>

            <div>
              <Label htmlFor="other">Other:</Label>
              <Input
                id="other"
                value={searchParams.other}
                onChange={(e) =>
                  setSearchParams({ ...searchParams, other: e.target.value })
                }
                placeholder="Enter other tags"
              />
            </div>
          </div>

          <Button
            onClick={handleSearch}
            disabled={searching}
            className="w-full mt-6 bg-primary hover:bg-primary/90"
          >
            {searching ? "Searching..." : "Search Documents"}
          </Button>
        </Card>

        {hasSearched && results.length === 0 && (
          <Card className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg text-muted-foreground">
              No documents found with those search parameters
            </p>
          </Card>
        )}

        {hasSearched && results.length > 0 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Search Results</h2>
              <Button
                variant="outline"
                onClick={handleClearSearch}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear Search
              </Button>
            </div>
            {groupedResults.fourMatches.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  All 4 Search Terms Matched ({groupedResults.fourMatches.length})
                </h3>
                <div className="space-y-3">
                  {groupedResults.fourMatches.map((result) => (
                    <Card key={result.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-foreground">
                            {result.profile_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Document Type: {result.document_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(result.document_date), 'dd MMMM, yyyy')}
                          </p>
                          <p className="text-sm text-foreground mt-2">
                            <span className="font-medium">Keywords:</span> {result.matchedTags.join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(result.document_url)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {groupedResults.threeMatches.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  3 Search Terms Matched ({groupedResults.threeMatches.length})
                </h3>
                <div className="space-y-3">
                  {groupedResults.threeMatches.map((result) => (
                    <Card key={result.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-foreground">
                            {result.profile_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Document Type: {result.document_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(result.document_date), 'dd MMMM, yyyy')}
                          </p>
                          <p className="text-sm text-foreground mt-2">
                            <span className="font-medium">Keywords:</span> {result.matchedTags.join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(result.document_url)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {groupedResults.twoMatches.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  2 Search Terms Matched ({groupedResults.twoMatches.length})
                </h3>
                <div className="space-y-3">
                  {groupedResults.twoMatches.map((result) => (
                    <Card key={result.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-foreground">
                            {result.profile_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Document Type: {result.document_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(result.document_date), 'dd MMMM, yyyy')}
                          </p>
                          <p className="text-sm text-foreground mt-2">
                            <span className="font-medium">Keywords:</span> {result.matchedTags.join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(result.document_url)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {groupedResults.oneMatch.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  1 Search Term Matched ({groupedResults.oneMatch.length})
                </h3>
                <div className="space-y-3">
                  {groupedResults.oneMatch.map((result) => (
                    <Card key={result.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 space-y-1">
                          <p className="font-semibold text-foreground">
                            {result.profile_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Document Type: {result.document_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Date: {format(new Date(result.document_date), 'dd MMMM, yyyy')}
                          </p>
                          <p className="text-sm text-foreground mt-2">
                            <span className="font-medium">Keywords:</span> {result.matchedTags.join(', ')}
                          </p>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDocument(result.document_url)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteClick(result.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              document.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DocumentSearch;
