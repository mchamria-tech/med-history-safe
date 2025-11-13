import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Menu, MoreVertical, Download, Trash2, ArrowLeft, Eye, Printer, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

interface Document {
  id: string;
  document_name: string;
  document_url: string;
  document_date: string;
  document_type: string | null;
  uploaded_at: string;
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

  const getSignedUrl = async (documentUrl: string) => {
    try {
      // documentUrl is already the file path (user_id/profile_id/filename)
      const { data, error } = await supabase.storage
        .from('profile-documents')
        .createSignedUrl(documentUrl, 3600); // 1 hour expiry

      if (error) throw error;
      return data.signedUrl;
    } catch (error) {
      console.error('Error getting signed URL:', error);
      throw error;
    }
  };

  const handleView = async (documentUrl: string) => {
    try {
      const signedUrl = await getSignedUrl(documentUrl);
      window.open(signedUrl, '_blank');
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
      const signedUrl = await getSignedUrl(documentUrl);
      const response = await fetch(signedUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = documentName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
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
      const signedUrl = await getSignedUrl(documentUrl);
      const printWindow = window.open(signedUrl, '_blank');
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
      const signedUrl = await getSignedUrl(documentUrl);
      
      // Check if Web Share API is available
      if (navigator.share) {
        await navigator.share({
          title: documentName,
          text: `Check out this document: ${documentName}`,
          url: signedUrl,
        });
      } else {
        // Fallback: Copy link to clipboard
        await navigator.clipboard.writeText(signedUrl);
        toast({
          title: "Link Copied",
          description: "Document link copied to clipboard. You can now share it via email or WhatsApp.",
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

      // Delete from storage
      const urlParts = doc.document_url.split('/');
      const fileName = urlParts.slice(-3).join('/'); // user_id/profile_id/filename
      
      await supabase.storage
        .from('profile-documents')
        .remove([fileName]);

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
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary-foreground hover:bg-primary/80"
          onClick={() => navigate(`/profile/${profileId}`)}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">Documents</h1>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
          <MoreVertical className="h-6 w-6" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="p-6 space-y-4 max-w-4xl mx-auto">
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
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{doc.document_name}</h3>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Date: {format(new Date(doc.document_date), 'PPP')}</span>
                      {doc.document_type && <span>Type: {doc.document_type}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Uploaded: {format(new Date(doc.uploaded_at), 'PPP')}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleView(doc.document_url)}
                      title="View"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDownload(doc.document_url, doc.document_name)}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePrint(doc.document_url)}
                      title="Print"
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleShare(doc.document_url, doc.document_name)}
                      title="Share"
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setDeleteDocId(doc.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Back Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => navigate(`/profile/${profileId}`)}
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            Back to Profile
          </Button>
        </div>
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
