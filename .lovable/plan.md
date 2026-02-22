

## Redesign Linked Users as Patient List + AI-Powered Lab Report Analytics

### Overview
Two major changes: (1) Transform the linked users page into a professional patient list table inspired by the reference screenshots, and (2) build an AI-powered analytics page that extracts out-of-range parameters from uploaded lab reports.

---

### Part 1: Patient List Table

**File: `src/pages/partner/PartnerUserSearch.tsx`**

Redesign the "Linked Users" section from simple cards into a proper table with these columns:

| Column | Source |
|--------|--------|
| Name | `profiles.name` |
| Age | Calculated from `profiles.date_of_birth` |
| Global ID | `profiles.carebag_id` |
| Last Report | Latest `documents.document_date` for that profile |
| Status | Derived: "No Follow-up" / "Follow-up Upcoming" / "Follow-up Past Due" based on last report age |
| Actions | "View Analytics" button + existing Upload/Unlink buttons |

**Data fetching changes:**
- Expand the `fetchLinkedUsers` query to also pull `date_of_birth` from profiles
- After fetching linked users, run a second query to get the latest `document_date` from the `documents` table for each linked `profile_id` (filtered by `partner_id`)
- Status logic: No documents = "No Follow-up"; last report within 30 days = "Follow-up Upcoming"; last report older than 30 days = "Follow-up Past Due"

**UI changes:**
- Replace the card-based list with a responsive table using the existing `Table` UI components
- Each row shows avatar initial, name, age, Global ID, last report date, a colored status badge, and action buttons
- Keep the search section at the top unchanged
- Mobile: rows stack into card-like layout on small screens

---

### Part 2: AI-Powered Lab Report Analytics

**New Edge Function: `supabase/functions/analyze-lab-report/index.ts`**

This function will:
1. Authenticate the caller and verify partner role
2. Accept a `profile_id` parameter
3. Fetch all documents uploaded by this partner for that profile from the `documents` table
4. For each document, generate a signed URL and download the file content
5. Send the document content (as base64 image or text) to the Lovable AI Gateway (google/gemini-3-flash-preview) with a prompt asking it to:
   - Extract all lab parameters with their values and reference ranges
   - Identify which parameters are out of range
   - Return structured JSON via tool calling
6. Return the AI-extracted data to the frontend

**Register in `supabase/config.toml`:**
- Add `[functions.analyze-lab-report]` with `verify_jwt = false`

**New Page: `src/pages/partner/PartnerClientAnalytics.tsx`**

This page replaces the mock-data-based `PartnerMemberAnalytics.tsx` with a real, AI-driven view:
- Header with back button, client name, and Global ID
- "Analyze Reports" button that triggers the edge function
- Loading state while AI processes the documents
- Results displayed in a table matching the reference screenshot layout:
  - Parameter name
  - Reference Range
  - Current Value
  - Status (Normal / Out of Range)
- Only out-of-range parameters are shown by default, with a toggle to show all
- Color coding: red for out-of-range high, blue for out-of-range low, green for normal

**Route: Add to `src/App.tsx`**
- `/partner/client-analytics/:profileId` pointing to the new `PartnerClientAnalytics` component

---

### Technical Details

**Edge function prompt strategy:**
The AI will receive the lab report image/PDF and be instructed to extract structured data using tool calling:

```text
function: extract_lab_parameters
parameters:
  parameters: array of {
    name: string,
    value: number,
    unit: string,
    reference_range: string,
    is_out_of_range: boolean,
    status: "normal" | "high" | "low"
  }
```

**File handling in edge function:**
- For PDFs/images, download via signed URL and send as base64 to the Gemini vision model
- Process the most recent document (or allow selecting which report to analyze)

**Files to create/modify:**

| File | Action |
|------|--------|
| `src/pages/partner/PartnerUserSearch.tsx` | Rewrite linked users section as table with age, last report, status |
| `supabase/functions/analyze-lab-report/index.ts` | New -- AI-powered lab report extraction |
| `src/pages/partner/PartnerClientAnalytics.tsx` | New -- analytics results page |
| `src/App.tsx` | Add route for `/partner/client-analytics/:profileId` |
| `supabase/config.toml` | Register `analyze-lab-report` function |

