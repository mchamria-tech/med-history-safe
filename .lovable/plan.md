

## Fix: Partner Document Upload Blocked by Storage RLS

### Problem
When a partner tries to upload a document for a linked client, the storage bucket's RLS policy blocks the upload because the partner is not the owner of that storage path (`{user_id}/{profile_id}/...`). The `documents` table insert may also fail for the same reason since `user_id` won't match `auth.uid()` for partner uploads.

### Solution
Create a new backend function `partner-upload-document` that:
1. Accepts the file (as base64) and metadata from the frontend
2. Validates the partner is authenticated and the profile is linked to them with consent
3. Uploads the file to storage using service role (bypasses storage RLS)
4. Inserts the document record using service role (bypasses documents table RLS for partner-uploaded docs)
5. Returns success/failure

### Changes

**1. New file: `supabase/functions/partner-upload-document/index.ts`**
- Receives: base64 file data, file name, profile ID, and all document metadata (name, date, type, doctor, ailment, medicine, tags)
- Validates: caller has partner role, profile is linked with consent in `partner_users`
- Uploads file to `profile-documents` bucket at path `{user_id}/{profile_id}/{timestamp}.{ext}`
- Inserts into `documents` table with `partner_id` and `partner_source_name` set
- Returns the created document ID on success

**2. Update: `supabase/config.toml`**
- Register `[functions.partner-upload-document]` with `verify_jwt = false` (validate in code)

**3. Update: `src/pages/partner/PartnerDocumentUpload.tsx`**
- Replace the direct `supabase.storage.upload()` + `supabase.from("documents").insert()` calls in `handleUpload` with a single call to `supabase.functions.invoke('partner-upload-document', ...)`
- Convert the selected file to base64 before sending
- Remove the intermediate `profiles` query for `user_id` (the function handles that server-side)

### Technical Details

| File | Action |
|------|--------|
| `supabase/functions/partner-upload-document/index.ts` | Create -- secure upload handler |
| `supabase/config.toml` | Add function registration |
| `src/pages/partner/PartnerDocumentUpload.tsx` | Update `handleUpload` to call edge function |

### Security
- Function verifies JWT token and partner role before proceeding
- Confirms the target profile is linked to the calling partner with `consent_given = true`
- Uses service role only for storage and document insertion -- no broader access
- File size validated server-side (max 10MB)
- No changes to existing RLS policies needed

