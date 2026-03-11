

## Add Document Selector & Metadata Labels to Doctor and User Panels

### Problem
1. The **user panel** (`PatientLabAnalytics.tsx`) shows generic text "AI will extract parameters from your most recent report" instead of the document type + date format used in the partner portal.
2. The **doctor panel** (`DoctorPatientView.tsx`) also shows generic text "Analyze the most recent lab report with AI to highlight out-of-range parameters".
3. Neither panel allows the user/doctor to **choose which document** to analyze -- they always analyze the most recent one.

### Solution
Mirror the partner portal pattern: fetch documents list, show a document selector dropdown, and display the selected document's type + date as the label. Pass the selected `documentId` to the edge function. Update the edge functions to accept an optional `documentId`.

### Changes

**1. `src/pages/PatientLabAnalytics.tsx`** (User Panel)
- Add state for `documents` list, `selectedDocId`, and fetch all documents for the profile
- Add a `<Select>` dropdown to choose which document to analyze (default: most recent)
- Replace "AI will extract parameters from your most recent report" with `"{docType} | Uploaded on {date}"` based on selected document
- Pass `documentId` alongside `profileId` when invoking `analyze-lab-report-user`

**2. `src/pages/doctor/DoctorPatientView.tsx`** (Doctor Panel)
- Add state for `selectedDocId` (default: first document)
- Add a `<Select>` dropdown in the AI Analysis card to choose which document to analyze
- Replace generic description with `"{docType} | Uploaded on {date}"` based on selected document
- Pass `documentId` alongside `profileId` when invoking `analyze-lab-report-doctor`

**3. `supabase/functions/analyze-lab-report-user/index.ts`**
- Accept optional `documentId` in the request body
- If provided, fetch that specific document (still verify it belongs to the profile); if not, fall back to most recent

**4. `supabase/functions/analyze-lab-report-doctor/index.ts`**
- Accept optional `documentId` in the request body
- If provided, fetch that specific document; if not, fall back to most recent

**5. `supabase/functions/analyze-lab-report/index.ts`** (Partner -- for consistency)
- Accept optional `documentId` in the request body (same pattern)

### Files

| File | Action |
|------|--------|
| `src/pages/PatientLabAnalytics.tsx` | Add document list, selector dropdown, metadata label |
| `src/pages/doctor/DoctorPatientView.tsx` | Add selector dropdown + metadata label in AI card |
| `supabase/functions/analyze-lab-report-user/index.ts` | Accept optional `documentId` |
| `supabase/functions/analyze-lab-report-doctor/index.ts` | Accept optional `documentId` |
| `supabase/functions/analyze-lab-report/index.ts` | Accept optional `documentId` |

