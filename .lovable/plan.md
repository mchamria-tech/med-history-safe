

## Plan: Global ID System, Gender Dropdown, Country Selection, and Uniqueness Checks

### Overview
Five areas of changes: gender dropdown, country selection with Global ID assignment for patients, Global ID display everywhere, admin panel enhancements, and uniqueness verification for both patient and partner IDs.

---

### Change 1: Gender Dropdown
**File:** `src/pages/NewProfile.tsx`
- Replace free-text gender input with a `<Select>` dropdown: Male, Female, Other

---

### Change 2: Country Selection + Global ID for Patients
**File:** `src/pages/NewProfile.tsx`

Add a searchable "Country of Origin" dropdown containing ALL countries worldwide (using a comprehensive ISO 3166-1 alpha-3 list -- approximately 249 countries). The dropdown will support type-to-search filtering so users can quickly find their country.

Country list includes all recognized ISO countries, for example: Afghanistan (AFG), Albania (ALB), ... India (IND), ... United States (USA), ... Zimbabwe (ZWE) -- the full set.

On save, call `generate_global_id('user', selectedCountry)` instead of the old `generate_carebag_id`.

**Database migration:**
- `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'IND';`

---

### Change 3: Uniqueness Verification

The `generate_global_id` DB function already loops to ensure uniqueness. However, uniqueness is scoped by the full ID string (e.g., `IND-A30012` and `USA-A30012` are two different IDs and both can exist). The DB function already guarantees this since it checks the full string including the country prefix.

An additional application-level verification will be added as defense-in-depth:

**File:** `src/pages/NewProfile.tsx`
- After generating, query `profiles` for the exact `carebag_id`. If found (extremely unlikely race condition), regenerate once.

**File:** `supabase/functions/create-partner/index.ts`
- After generating, query `partners` for the exact `partner_code`. If found, regenerate once.

---

### Change 4: Display Global ID Alongside Username

**File:** `src/pages/Profiles_Main.tsx`
- Show `carebag_id` below profile name in each card, styled in small monospace text

**File:** `src/pages/ProfileView.tsx`
- Show `carebag_id` below profile name in header
- Add `carebag_id` to the Profile interface

---

### Change 5: Admin Panel Enhancements

**File:** `src/pages/admin/AdminUsers.tsx`
- Display Global ID and country per user row
- Allow super-admin to edit `carebag_id` and `country` inline

**File:** `src/pages/admin/AdminUserAnalytics.tsx`
- Display country alongside Global ID
- Add edit controls for super-admin

---

### Change 6: Partner Global ID Uniqueness in Edge Function

**File:** `supabase/functions/create-partner/index.ts`
- After `generate_global_id('partner', country)` returns, verify the code does not exist in the `partners` table before inserting. If collision, regenerate once.

---

### Technical Details

| Area | File(s) | Change |
|------|---------|--------|
| DB Migration | new migration | `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country text DEFAULT 'IND';` |
| Gender dropdown | `NewProfile.tsx` | Replace Input with Select (Male/Female/Other) |
| Country dropdown | `NewProfile.tsx` | Full ISO 3166-1 alpha-3 country list (~249 countries) with search filtering |
| Global ID generation | `NewProfile.tsx` | Replace `generate_carebag_id` with `generate_global_id('user', country)` + uniqueness check |
| Partner ID uniqueness | `create-partner/index.ts` | Post-generation uniqueness check before insert |
| ID display - dashboard | `Profiles_Main.tsx` | Show carebag_id under profile name |
| ID display - profile view | `ProfileView.tsx` | Show carebag_id under profile name |
| Admin users list | `AdminUsers.tsx` | Show Global ID + country; inline edit for super-admin |
| Admin user analytics | `AdminUserAnalytics.tsx` | Show country; edit controls |

### Uniqueness Model
- `IND-A30012` and `USA-A30012` are distinct valid IDs (different country prefix = different ID)
- The DB function checks the complete string including prefix, so cross-country collisions are not collisions
- App-level checks query by exact full ID string, preserving this behavior

### Country Dropdown Implementation
- Uses the existing `cmdk` (Command) component already installed in the project for searchable selection
- Full list of ~249 ISO 3166-1 alpha-3 countries stored as a constant array
- User types to filter (e.g., typing "Ind" shows "India (IND)")
- Default selection: India (IND)

