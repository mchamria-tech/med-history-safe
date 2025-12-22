import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MoreVertical, Download, Trash2, ArrowLeft, Eye, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getSignedUrl, extractFilePath } from "@/hooks/useSignedUrl";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Document {
  id: string;
  document_name: string;
  document_url: string;
  document_date: string;
  document_type: string | null;
  uploaded_at: string;
  partner_source_name: string | null;
}

const ViewDocuments = () => {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const { toast } = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);

  useEffect(() => {
    if (profileId) {
      fetchDocuments();
    }
  }, [profileId]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('profile_id', profileId)
        .order('document_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
      toast({
        title: "Error",
        description: "Failed to load documents",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = async (documentUrl: string) => {
    try {
      const { url, error } = await getSignedUrl('profile-documents', documentUrl);
      if (error || !url) throw new Error(error || 'Failed to get URL');
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast({
        title: "Error",
        description: "Failed to view document",
        variant: "destructive",
      });
    }
  };

  const handleDownload = async (documentUrl: string, documentName: string) => {
    try {
      const { url, error } = await getSignedUrl('profile-documents', documentUrl);
      if (error || !url) throw new Error(error || 'Failed to get URL');
      
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = documentName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({
        title: "Error",
        description: "Failed to download document",
        variant: "destructive",
      });
    }
  };

  const handlePrint = async (documentUrl: string) => {
    try {
      const { url, error } = await getSignedUrl('profile-documents', documentUrl);
      if (error || !url) throw new Error(error || 'Failed to get URL');
      
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('Error printing document:', error);
      toast({
        title: "Error",
        description: "Failed to print document",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (documentUrl: string, documentName: string) => {
    try {
      const { url, error } = await getSignedUrl('profile-documents', documentUrl, 86400); // 24h for sharing
      if (error || !url) throw new Error(error || 'Failed to get URL');
      
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: documentName,
          text: `Check out this document: ${documentName}`,
          url: url,
        });
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(url);
        toast({
          title: "Link Copied",
          description: "Document link copied to clipboard (valid for 24 hours).",
        });
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing document:', error);
        toast({
          title: "Error",
          description: "Failed to share document",
          variant: "destructive",
        });
      }
    }
  };

  const handleDelete = async () => {
    if (!deleteDocId) return;

    try {
      // Get document details before deleting
      const doc = documents.find(d => d.id === deleteDocId);
      if (!doc) return;

      // Extract file path using utility
      const filePath = extractFilePath(doc.document_url, 'profile-documents');
      
      // Delete from storage
      await supabase.storage
        .from('profile-documents')
        .remove([filePath]);

      // Delete from database
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', deleteDocId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Document deleted successfully",
      });

      fetchDocuments();
      setDeleteDocId(null);
    } catch (error: any) {
      console.error('Error deleting document:', error);
      toast({
        title: "Error",
        description: "Failed to delete document",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="flex w-full items-center justify-between bg-primary px-4 py-3">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground hover:bg-primary/80 mr-2"
            onClick={() => navigate(`/profile/${profileId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-primary-foreground">Documents</h1>
        </div>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="p-4 space-y-3 max-w-4xl mx-auto pb-24">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No documents uploaded yet</p>
          </div>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="border">
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground text-sm truncate">{doc.document_name}</h3>
                      {doc.partner_source_name && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent/20 text-accent shrink-0">
                          {doc.partner_source_name}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-3 mt-1 text-xs text-muted-foreground">
                      <span>Date: {format(new Date(doc.document_date), 'PP')}</span>
                      {doc.document_type && <span>Type: {doc.document_type}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Uploaded: {format(new Date(doc.uploaded_at), 'PP')}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 bg-background z-50">
                      <DropdownMenuItem onClick={() => handleView(doc.document_url)}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(doc.document_url, doc.document_name)}>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePrint(doc.document_url)}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(doc.document_url, doc.document_name)}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setDeleteDocId(doc.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Sticky Back Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 pb-6">
        <Button
          onClick={() => navigate(`/profile/${profileId}`)}
          variant="outline"
          className="w-full h-12"
        >
          Back to Profile
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ViewDocuments;
