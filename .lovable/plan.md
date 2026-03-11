

## Update Global ID & Fix Architecture Flaw

### Part 1: Immediate Data Fix

Update the profile for `mchamria@me.com` (profile ID `ac1d80fa-fcd9-4c23-ac2f-6dd6f4ab4929`) to change `carebag_id` from `IND-AEDEFA` to `IND-A3AE5F`. No need to "return" `IND-AEDEFA` to a pool -- Global IDs are generated randomly and checked for collisions, so unused IDs are simply never referenced again.

**Tool:** Database insert/update tool with:
```sql
UPDATE profiles SET carebag_id = 'IND-A3AE5F' WHERE id = 'ac1d80fa-fcd9-4c23-ac2f-6dd6f4ab4929';
```

### Part 2: Architecture Fix -- Global ID at Account Level

**The Problem:** Currently, Global IDs are generated per *profile* (in `NewProfile.tsx`), not per *user account*. Each user can have multiple profiles (Self + family members), and each gets a separate Global ID. When a profile is deleted, the Global ID and all partner/doctor associations are lost forever.

**The Solution:** Assign one permanent Global ID per user account at registration time, stored on the "Self" profile and never regenerated. Family member profiles continue to get their own IDs but the primary account holder's ID is immutable.

#### Changes

**1. Database: `handle_new_user()` trigger function** (migration)
- Update to generate a Global ID immediately when a user registers, storing it on the auto-created profile.
- This means the "Self" profile created by `handle_new_user()` will already have a `carebag_id` before the user ever visits NewProfile.

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_global_id text;
BEGIN
  -- Generate a permanent Global ID for this user account
  new_global_id := generate_global_id('user', 'IND');
  
  INSERT INTO public.profiles (user_id, email, name, relation, carebag_id, country)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Unknown'),
    'Self',
    new_global_id,
    'IND'
  );
  RETURN new;
END;
$$;
```

**2. `src/pages/NewProfile.tsx`**
- When creating a new profile with `relation = "Self"`, check if a Self profile already exists (it should from the trigger). If editing it, preserve the existing `carebag_id`.
- For non-Self (family) profiles, continue generating new Global IDs as today.
- Skip Global ID generation if the profile already has one assigned.

**3. `src/pages/Profiles_Main.tsx`**
- Prevent deletion of the "Self" profile entirely. Hide or disable the delete option for profiles where `relation = 'Self'`.
- This protects the primary Global ID and its associations from accidental deletion.
- Users can still "Delete My Account" which is a separate flow.

**4. `src/pages/NewProfile.tsx` -- Edit flow**
- When editing a Self profile, make the `relation` field read-only (locked to "Self") to prevent users from changing it and circumventing the protection.

### Files

| File | Action |
|------|--------|
| Database | UPDATE query to reassign Global ID |
| Database | Migration to update `handle_new_user()` trigger |
| `src/pages/NewProfile.tsx` | Skip Global ID generation for Self profiles that already have one |
| `src/pages/Profiles_Main.tsx` | Prevent deletion of Self profiles |

