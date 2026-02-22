

## Fix: MIME Type Detection from File Content Instead of Filename

### Root Cause
The document is named `"dummy_lab"` (no file extension). The current code splits on `.` to get the extension, resulting in `ext = "dummy_lab"`, which doesn't match any known type and defaults to `image/jpeg`. The actual file is likely a PDF, so Gemini rejects it with "Unable to process input image".

### Solution

**File: `supabase/functions/analyze-lab-report/index.ts`**

1. **Detect MIME type from the HTTP response Content-Type header** when downloading the file via signed URL (primary method)
2. **Fall back to magic bytes detection** -- check the first few bytes of the file buffer:
   - `%PDF` (hex `25 50 44 46`) = PDF
   - `\xFF\xD8\xFF` = JPEG
   - `\x89PNG` = PNG
   - `RIFF...WEBP` = WebP
3. **Fall back to filename extension** as last resort
4. **Use `image_url` with data URI for ALL types** (including PDFs) since the Lovable AI Gateway translates `data:application/pdf;base64,...` to the native Gemini format. Remove the `type: "file"` block which may not be supported.
5. **Also fix the frontend** (`PartnerClientAnalytics.tsx`) to properly surface error messages from the edge function response body instead of showing the generic "Edge Function returned a non-2xx status code".

### Changes

| File | Change |
|------|--------|
| `supabase/functions/analyze-lab-report/index.ts` | Use Content-Type header + magic bytes for MIME detection; use `image_url` for all file types |
| `src/pages/partner/PartnerClientAnalytics.tsx` | Extract and display the actual error message from the response body |

### Technical Details

**MIME detection priority:**
1. Response `Content-Type` header from the signed URL download
2. File magic bytes (first 4-8 bytes of the buffer)
3. Filename extension (existing logic, as fallback)

**Content block format (unified for all types):**
```text
{
  type: "image_url",
  image_url: {
    url: "data:<detected-mime>;base64,<content>"
  }
}
```

**Frontend error handling fix:**
The `supabase.functions.invoke()` call throws a `FunctionsHttpError` on non-2xx responses. The fix will read the response body from the error context to extract the actual error message (e.g., "The document format could not be processed...") instead of showing the generic HTTP error.
