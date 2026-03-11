

## Add AI Lab Report Analysis to Doctor Portal

### Context
The doctor dashboard currently shows patient access cards with a "View Records" button that navigates to `/doctor/patient/:profileId`, but that page doesn't exist yet. This plan adds:
1. A new **DoctorPatientView** page with document list + AI lab analysis (matching the partner/patient experience)
2. A new **edge function** `analyze-lab-report-doctor` that verifies the doctor has active access (time-limited or persistent) before analyzing

### New Files

**1. `supabase/functions/analyze-lab-report-doctor/index.ts`**

A copy of `analyze-lab-report` adapted for doctors:
- Verifies caller has the `doctor` role via `user_roles`
- Looks up the doctor's `id` from the `doctors` table
- Checks `doctor_access` table for an active, non-revoked, non-expired record for the given `profileId` (OR checks `doctor_patients` for persistent access once that table exists)
- Fetches the most recent document for the profile (any uploader, not scoped to doctor) using service role
- Runs the same AI extraction + insights pipeline (identical AI calls)
- Returns parameters, document info, and insights

**2. `src/pages/doctor/DoctorPatientView.tsx`**

A page at `/doctor/patient/:profileId` with:
- Header with back button, patient name, Global ID
- Access countdown timer showing time remaining
- "Lab Report Analysis" card with analyze button (calls `analyze-lab-report-doctor`)
- Results table with out-of-range highlighting, show-all toggle, status badges
- Medical disclaimer alert
- Educational insights section
- Document list showing all accessible documents for the patient

The UI mirrors `PartnerClientAnalytics.tsx` but styled with the emerald doctor theme and includes the access expiry countdown.

### Modified Files

**3. `src/App.tsx`**
- Import `DoctorPatientView`
- Add route: `/doctor/patient/:profileId`

**4. `supabase/config.toml`**
- Register `analyze-lab-report-doctor` with `verify_jwt = false`

### No Database Changes Needed
- The `doctor_access` table already has an RLS policy "Doctors can view their granted access"
- The `documents` table has policies for doctor access via `doctor_has_document_grant`
- The edge function uses the service role client to fetch documents (bypasses RLS), so no new policies are needed

### Files Summary

| File | Action |
|------|--------|
| `supabase/functions/analyze-lab-report-doctor/index.ts` | New -- edge function for doctor lab analysis |
| `src/pages/doctor/DoctorPatientView.tsx` | New -- patient view page with AI analysis |
| `src/App.tsx` | Add `/doctor/patient/:profileId` route |
| `supabase/config.toml` | Register new edge function |

