

## Extend AI Lab Report Analytics to Patient Portal

### Overview
Add an "Analyze Report" feature to the patient-facing profile view so patients can run AI-powered lab parameter extraction on their own documents -- free for now, with a future paywall hook.

---

### New Edge Function: `supabase/functions/analyze-lab-report-user/index.ts`

A separate edge function for patient-side analysis (keeps partner and patient auth flows cleanly separated):

- Authenticate the caller via JWT
- Verify the profile belongs to the user (`profiles.user_id = auth.uid()`)
- Accept `profileId` in the request body
- Fetch the most recent document for that profile (owned by the user)
- Download, detect MIME type, base64-encode, and send to Lovable AI Gateway (same logic as the partner version)
- Return structured lab parameters via tool calling

Register in `supabase/config.toml` with `verify_jwt = false`.

### New Page: `src/pages/PatientLabAnalytics.tsx`

A patient-facing analytics page, similar to `PartnerClientAnalytics.tsx` but without the partner layout:

- Header with back button, profile name, and CareBag ID
- "Analyze Report" button that calls the new edge function
- Loading spinner during analysis
- Results table: Parameter, Value, Unit, Reference Range, Status
- Default view shows only out-of-range parameters, with a "Show all" toggle
- Same color coding (red = high, blue = low, green = normal)
- Styled to match the existing patient portal aesthetic (primary header bar, mobile-first)

### Route Addition: `src/App.tsx`

Add `/patient-analytics/:profileId` route pointing to `PatientLabAnalytics`.

### Entry Point: `src/pages/ProfileView.tsx`

Add an "Analyze Lab Report" button in the profile view page (near the documents section) that navigates to `/patient-analytics/:profileId`. Use the Activity icon to match the partner version.

---

### Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/analyze-lab-report-user/index.ts` | New -- patient-authenticated version of lab analysis |
| `supabase/config.toml` | Register new function |
| `src/pages/PatientLabAnalytics.tsx` | New -- patient-facing analytics results page |
| `src/App.tsx` | Add route `/patient-analytics/:profileId` |
| `src/pages/ProfileView.tsx` | Add "Analyze Lab Report" button |

### Technical Details

**Edge function differences from partner version:**
- No partner role check; instead verifies `profiles.user_id = userId`
- Fetches documents where `user_id = userId` (user's own uploads) OR `profile_id = profileId` (partner-uploaded docs visible to user)
- Uses service role client to fetch documents and generate signed URLs
- Same AI prompt, tool calling schema, MIME detection, and error handling as the partner version

**Future paywall note:**
The edge function will include a comment placeholder for a future payment check (e.g., `// TODO: Check payment/credits before proceeding`). No payment logic will be implemented now.
