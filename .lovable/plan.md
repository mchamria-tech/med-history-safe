

## Plan: Country-Based Global ID for Partners

### Problem
1. The `generate_global_id` database function hardcodes `IND-` as the country prefix for all entities
2. The `create-partner` edge function bypasses `generate_global_id` entirely and generates its own simple code
3. There is no "country" field on the partner form or in the database
4. Partners from different countries (e.g., USA) should get country-appropriate prefixes (e.g., `USA-X3CZ3T` instead of `IND-X3CZ3T`)

### Solution

#### 1. Add Country Field to Partners Table (Database Migration)
- Add a `country` column to the `partners` table (default: `'IND'`)
- Use a 3-letter ISO country code (IND, USA, GBR, etc.)

#### 2. Update `generate_global_id` Database Function
- Accept a new `country_code` parameter (default `'IND'`)
- Replace the hardcoded `IND-` prefix with the provided country code
- Format becomes: `{COUNTRY}-{ROLE_PREFIX}{5_CHARS}` (e.g., `USA-XA3F2B`, `IND-A1GTR3`)

#### 3. Update `create-partner` Edge Function
- Accept `country` in the request body
- Call the `generate_global_id('partner', country)` database function instead of generating a code inline
- Store the country on the partner record

#### 4. Update Partner Form (AdminPartnerForm.tsx)
- Add a Country dropdown (India, USA, UK, etc.) to the form
- Pass the selected country to the edge function
- Default selection: India (IND)

#### 5. Update PartnerNewUser.tsx
- When a partner creates a new user, pass the partner's country to `generate_global_id` so user IDs also reflect the correct country

---

### Technical Details

**Database migration SQL:**
```sql
-- Add country column to partners
ALTER TABLE public.partners 
  ADD COLUMN country text NOT NULL DEFAULT 'IND';

-- Update generate_global_id to accept country_code
CREATE OR REPLACE FUNCTION public.generate_global_id(
  role_type text DEFAULT 'user',
  country_code text DEFAULT 'IND'
)
RETURNS text
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  prefix char;
  new_id text;
  exists_check boolean;
BEGIN
  prefix := CASE role_type
    WHEN 'user' THEN 'A'
    WHEN 'admin' THEN '0'
    WHEN 'doctor' THEN 'D'
    WHEN 'partner' THEN 'X'
    ELSE 'A'
  END;

  LOOP
    new_id := upper(country_code) || '-' || prefix 
              || upper(substr(md5(random()::text), 1, 5));
    IF role_type IN ('user', 'admin') THEN
      SELECT EXISTS(SELECT 1 FROM profiles WHERE carebag_id = new_id) INTO exists_check;
    ELSIF role_type = 'doctor' THEN
      SELECT EXISTS(SELECT 1 FROM doctors WHERE global_id = new_id) INTO exists_check;
    ELSIF role_type = 'partner' THEN
      SELECT EXISTS(SELECT 1 FROM partners WHERE partner_code = new_id) INTO exists_check;
    ELSE
      exists_check := false;
    END IF;
    EXIT WHEN NOT exists_check;
  END LOOP;

  RETURN new_id;
END;
$$;
```

**Supported countries (initial set):**

| Code | Display Name |
|------|-------------|
| IND | India |
| USA | United States |
| GBR | United Kingdom |
| ARE | United Arab Emirates |
| SGP | Singapore |

**Files to modify:**

| File | Change |
|------|--------|
| Database migration | Add `country` column + update `generate_global_id` function |
| `supabase/functions/create-partner/index.ts` | Accept `country`, use `generate_global_id` RPC instead of inline code generation |
| `src/pages/admin/AdminPartnerForm.tsx` | Add Country dropdown field, pass to edge function |
| `src/pages/partner/PartnerNewUser.tsx` | Pass partner's country when generating user global IDs |

**Example IDs after this change:**
- Indian partner: `IND-X8FGH2`
- US partner: `USA-XK9M3P`
- Indian user created by Indian partner: `IND-A7BCD4`
- US user created by US partner: `USA-A2EF5G`

