
## Fix: AI Lab Report Analysis Failing

### Root Cause
The edge function logs show Google Gemini returning a **400 error**: `"Unable to process input image"`. This happens because:

1. The document is likely a **PDF file**, but the code sends it as an `image_url` content type to the AI model. Gemini's `image_url` only supports JPEG, PNG, and WebP -- not PDFs.
2. For PDFs, the Gemini API requires using an `inline_data` block with the correct MIME type instead of `image_url`.

### Fix

**File: `supabase/functions/analyze-lab-report/index.ts`**

Change how the document content is sent to the AI model:

- For **images** (JPEG, PNG, WebP): continue using `image_url` with base64 data URI
- For **PDFs**: use `inline_data` with `mime_type: "application/pdf"` and base64 content, which is the correct Gemini API format for PDF files

Replace the single `image_url` message content block with conditional logic:

```text
If PDF:
  { type: "file", file: { filename: "report.pdf", file_data: "data:application/pdf;base64,..." } }
  -- OR use inline_data format depending on gateway support

If Image:
  { type: "image_url", image_url: { url: "data:image/jpeg;base64,..." } }
```

Additionally, add better error handling to surface the actual AI gateway error message to the frontend instead of a generic "AI analysis failed" message.

### Changes

| File | Change |
|------|--------|
| `supabase/functions/analyze-lab-report/index.ts` | Fix content format for PDFs vs images; improve error messages |

### Technical Details

The OpenAI-compatible API format used by the Lovable AI Gateway supports sending PDFs to Gemini models using the `image_url` type with a `data:application/pdf;base64,...` data URI. The fix will:

1. Keep the existing base64 encoding and MIME type detection
2. Always use `image_url` with the correct MIME type (including `application/pdf`) since the gateway translates this to the native Gemini format
3. Add a fallback: if the AI returns a 400 error for image processing, return a user-friendly message suggesting the document format may not be supported
4. Surface the actual error detail from the AI gateway in the response so the frontend can display it
5. Add logging of the document extension and MIME type for debugging
