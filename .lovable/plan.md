

## Plan: Backfill Global IDs for Existing Profiles

### Problem
Ashok Kumar's profile was created before the Global ID system was implemented. Their `carebag_id` field is `NULL` in the database, so nothing displays on the dashboard.

### Solution
Two changes to ensure all users always have a Global ID:

#### 1. Backfill existing profiles via SQL migration
Run a database migration that assigns a Global ID to every profile where `carebag_id IS NULL`, using each profile's `country` field (defaulting to `'IND'`).

```sql
-- For each profile missing a carebag_id, generate one
UPDATE profiles
SET carebag_id = generate_global_id('user', COALESCE(country, 'IND'))
WHERE carebag_id IS NULL;
```

This will immediately fix Ashok Kumar and any other existing users.

#### 2. Add auto-assignment on the dashboard as a safety net
In `src/pages/Profiles_Main.tsx`, after fetching profiles, check if any have a `NULL` carebag_id. If so, generate and assign one on-the-fly so the user sees it immediately without waiting for a migration.

This is a lightweight fallback -- it calls `generate_global_id` and updates the profile row only when needed.

---

### Technical Details

| Area | File | Change |
|------|------|--------|
| DB Migration | New migration SQL | `UPDATE profiles SET carebag_id = generate_global_id(...)  WHERE carebag_id IS NULL` |
| Safety net | `src/pages/Profiles_Main.tsx` | After fetching profiles, auto-assign Global ID to any profile missing one |

### Impact
- Ashok Kumar and all existing users will get a Global ID immediately
- Future edge cases (if any profile somehow gets created without an ID) are covered by the dashboard fallback
