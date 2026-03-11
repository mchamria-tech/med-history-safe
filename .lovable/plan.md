

## Show Report Type and Upload Date on Analysis Card

### Problem
The label currently says "AI will extract parameters from the most recent uploaded report" -- the user wants it to show the actual document type (e.g. "Blood Report") and upload date instead.

### Approach
Modify `src/pages/partner/PartnerClientAnalytics.tsx`:

1. **Add state** for `latestDocType` and `latestDocDate`
2. **Fetch latest document** on page load (alongside the profile fetch) by querying:
   ```
   documents.select("document_type, document_date, uploaded_at")
     .eq("profile_id", profileId)
     .order("document_date", { ascending: false })
     .limit(1)
   ```
3. **Replace line 167-169** -- the static text -- with dynamic content:
   - If a document exists: show e.g. "Blood Report | Uploaded on 21 Feb 2026"
   - If no document: show "No reports uploaded yet"

### Files
| File | Change |
|------|--------|
| `src/pages/partner/PartnerClientAnalytics.tsx` | Add document fetch on mount, replace static label with dynamic type + date |

No database or edge function changes needed -- the `documents` table already has RLS policies allowing partners to view their uploaded documents.

