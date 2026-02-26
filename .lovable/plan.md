

## Partner Portal Enhancements: Settings, Empanelled Doctors, Analytics

### Overview
Three major additions to the partner sidebar navigation:
1. **Settings** -- make the existing page actually persist changes to the database
2. **Empanelled Doctors** -- manage doctors attached to the partner (link existing + create new)
3. **Analytics** -- real-time analytics using actual database data

---

### 1. Settings Page (Persist to Database)

**File: `src/pages/partner/PartnerSettings.tsx`** -- Modify existing

- Update `handleSave` to call `supabase.from("partners").update({...}).eq("id", partner.id)` with the form fields (name, email, address, gst_number)
- Add loading state on save button
- Show success/error toast based on result
- No schema changes needed -- the `partners` table already has an RLS policy "Partners can view their own record" for SELECT but no UPDATE policy for partners themselves

**Database migration needed:**
```sql
CREATE POLICY "Partners can update their own record"
ON public.partners
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());
```

---

### 2. Empanelled Doctors Page

**New file: `src/pages/partner/PartnerDoctors.tsx`**

A page where the partner can:
- **View** all doctors attached to their organization (query `doctors` table where `partner_id = partner.id`)
- **Search & Link** existing independent doctors by Global ID or email
- **Create new** doctor accounts (calls a new edge function)
- **Revoke access** (set doctor's `partner_id` to null / deactivate)

**UI layout:**
- Header: "Empanelled Doctors" with "Add Doctor" button
- Table/list of attached doctors showing: Name, Specialty, Hospital, Global ID, Status, Actions (Revoke)
- "Add Doctor" dialog with two tabs:
  - "Link Existing" -- search by Global ID or email
  - "Create New" -- form with name, email, password, specialty, hospital, phone

**New edge function: `supabase/functions/create-doctor/index.ts`**

Called by the partner to create a new doctor account:
- Verify the caller has the `partner` role
- Create auth user via `admin.createUser`
- Generate doctor Global ID via `generate_global_id('doctor', country)`
- Insert into `doctors` table with `partner_id` set to the calling partner's ID
- Insert `doctor` role into `user_roles`
- Return doctor data

**Database migration needed:**

The `doctors` table currently only allows super_admins to insert/update. Partners need policies to manage their attached doctors:

```sql
-- Partners can view their attached doctors
CREATE POLICY "Partners can view attached doctors"
ON public.doctors
FOR SELECT
TO authenticated
USING (partner_id = get_partner_id(auth.uid()));

-- Partners can update their attached doctors
CREATE POLICY "Partners can update attached doctors"
ON public.doctors
FOR UPDATE
TO authenticated
USING (partner_id = get_partner_id(auth.uid()));
```

---

### 3. Analytics Page (Real Data)

**New file: `src/pages/partner/PartnerAnalyticsReal.tsx`** (replaces the mock PartnerAnalytics)

Panels pulling real data from the database:

1. **Overview Stats Row** -- Linked Clients, Total Documents, Documents This Month, Pending Consents (same queries as dashboard but displayed as stat cards)
2. **Client Growth Chart** -- Monthly new client linkages over the past 6 months (query `partner_users` grouped by month)
3. **Document Upload Trends** -- Monthly document uploads over the past 6 months (query `documents` grouped by month)
4. **Top Clients by Documents** -- Bar chart showing clients with most documents
5. **Document Type Distribution** -- Donut chart showing breakdown by `document_type`
6. **Consent Status** -- Pie chart of consent_given true vs false from `partner_users`

Uses `recharts` (already installed) for charts. All data fetched via standard Supabase client queries -- no edge functions needed since existing RLS policies already scope data to the partner.

---

### 4. Navigation Updates

**File: `src/components/partner/PartnerLayout.tsx`**

Add two new nav items to the `navItems` array:
```typescript
{ path: "/partner/doctors", label: "Empanelled Doctors", icon: Stethoscope },
{ path: "/partner/analytics", label: "Analytics", icon: BarChart3 },
```

Order: Dashboard, Linked Users, Upload Document, **Analytics**, **Empanelled Doctors**, Settings

---

### 5. Route Registration

**File: `src/App.tsx`**

Add three new routes:
```
/partner/settings → PartnerSettings (already exists but not routed)
/partner/doctors → PartnerDoctors
/partner/analytics → PartnerAnalyticsReal
```

---

### Files Summary

| File | Action |
|------|--------|
| `src/pages/partner/PartnerSettings.tsx` | Modify -- add real save to database |
| `src/pages/partner/PartnerDoctors.tsx` | **New** -- empanelled doctors management |
| `src/pages/partner/PartnerAnalytics.tsx` | **Rewrite** -- replace mock data with real database queries |
| `supabase/functions/create-doctor/index.ts` | **New** -- edge function for partner to create doctor accounts |
| `src/components/partner/PartnerLayout.tsx` | Modify -- add Analytics + Empanelled Doctors nav items |
| `src/App.tsx` | Modify -- add `/partner/doctors`, `/partner/analytics`, `/partner/settings` routes |
| Database migration | Add RLS policies for partners to update own record + view/update attached doctors |
| `supabase/config.toml` | Register `create-doctor` function |

### Technical Details

**Edge function `create-doctor`:**
- Authenticates caller via JWT, verifies partner role
- Uses service role client to: create auth user, generate global ID, insert doctor record with `partner_id`, insert user_role
- Rolls back (deletes auth user) on any failure
- Same CORS pattern as `create-partner`

**RLS policies added (3 total):**
1. `Partners can update their own record` on `partners` (UPDATE)
2. `Partners can view attached doctors` on `doctors` (SELECT)
3. `Partners can update attached doctors` on `doctors` (UPDATE)

**Analytics data queries:**
- All use the existing Supabase client with partner-scoped RLS
- Monthly grouping done client-side after fetching records with date filters (last 6 months)
- No new tables or functions needed -- leverages existing `partner_users` and `documents` tables

