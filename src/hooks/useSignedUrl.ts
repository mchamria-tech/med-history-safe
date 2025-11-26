import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SignedUrlOptions {
  bucket: 'profile-documents' | 'profile-photos';
  path: string | null | undefined;
  expiresIn?: number; // seconds, default 1 hour
}

interface SignedUrlResult {
  url: string | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Extract file path from a storage URL or return the path as-is
 */
export const extractFilePath = (urlOrPath: string, bucket: string): string => {
  if (!urlOrPath) return urlOrPath;
  
  // If it's a full URL (old format), extract the path
  if (urlOrPath.includes('supabase.co')) {
    const bucketPattern = `/${bucket}/`;
    const parts = urlOrPath.split(bucketPattern);
    return parts[1] || urlOrPath;
  }
  
  // If it's a data URL (base64), return as-is (for preview)
  if (urlOrPath.startsWith('data:')) {
    return urlOrPath;
  }
  
  // Already a path
  return urlOrPath;
};

/**
 * Generate a signed URL for a file in Supabase storage
 */
export const getSignedUrl = async (
  bucket: 'profile-documents' | 'profile-photos',
  path: string,
  expiresIn: number = 3600
): Promise<{ url: string | null; error: string | null }> => {
  if (!path) {
    return { url: null, error: 'No path provided' };
  }

  // Handle data URLs (for preview)
  if (path.startsWith('data:')) {
    return { url: path, error: null };
  }

  const filePath = extractFilePath(path, bucket);

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(filePath, expiresIn);

  if (error) {
    console.error('Error creating signed URL:', error);
    return { url: null, error: error.message };
  }

  return { url: data.signedUrl, error: null };
};

/**
 * Hook to get a signed URL for a file
 */
export const useSignedUrl = ({
  bucket,
  path,
  expiresIn = 3600,
}: SignedUrlOptions): SignedUrlResult => {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      setIsLoading(false);
      return;
    }

    // Handle data URLs directly (for preview)
    if (path.startsWith('data:')) {
      setUrl(path);
      setIsLoading(false);
      return;
    }

    const fetchSignedUrl = async () => {
      setIsLoading(true);
      setError(null);

      const result = await getSignedUrl(bucket, path, expiresIn);
      
      setUrl(result.url);
      setError(result.error);
      setIsLoading(false);
    };

    fetchSignedUrl();
  }, [bucket, path, expiresIn]);

  return { url, isLoading, error };
};

export default useSignedUrl;
