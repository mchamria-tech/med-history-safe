

## Plan: Fix Slow Admin Page Navigation

### Problem
Every admin page takes a long time to load because:
- The admin role check still makes a network call even when cached (uses `getUser()` instead of the local `getSession()`)
- The Feedback page has its own separate admin check that bypasses the cache entirely
- Users page runs 3 database queries one after another instead of simultaneously
- Analytics page runs queries one after another, including a loop that queries the database once per partner

### Solution

#### 1. Fix useSuperAdminCheck - Use Local Session Instead of Network Call
When the cache says you're already verified, use `getSession()` (instant, no network) instead of `getUser()` (network round-trip). This alone will cut the loading delay on every page navigation.

#### 2. Fix AdminFeedback - Use Shared Hook
Replace the duplicate admin check in `AdminFeedback.tsx` with the shared `useSuperAdminCheck` hook so it benefits from caching too.

#### 3. Fix AdminUsers - Parallelize Queries
Run the profiles, user_roles, and partners queries simultaneously using `Promise.all`.

#### 4. Fix AdminAnalytics - Parallelize and Remove Loop
Run document types, profiles, and partners queries simultaneously. Remove the per-partner loop that queries documents individually -- instead, fetch all documents with partner_id in a single query and count client-side.

---

### Technical Details

**Files to modify:**

| File | Change |
|------|--------|
| `src/hooks/useSuperAdminCheck.ts` | Use `getSession()` (local/instant) instead of `getUser()` (network) in the cached path |
| `src/pages/AdminFeedback.tsx` | Replace custom admin check with `useSuperAdminCheck` hook + use `AdminLayout` wrapper |
| `src/pages/admin/AdminUsers.tsx` | Wrap profiles, user_roles, and partners queries in `Promise.all` |
| `src/pages/admin/AdminAnalytics.tsx` | Wrap queries in `Promise.all`; replace per-partner document loop with single query |

**useSuperAdminCheck.ts - Key change:**
```typescript
// BEFORE (slow - network call even when cached):
const { data: { user } } = await supabase.auth.getUser();

// AFTER (fast - local session, no network):
const { data: { session } } = await supabase.auth.getSession();
if (session?.user && session.user.id === cachedUserId) {
  setUser(session.user);
  setIsSuperAdmin(true);
  setIsLoading(false);
  return;
}
```

**AdminUsers.tsx - Parallel queries:**
```typescript
const [profilesResult, rolesResult, partnersResult] = await Promise.all([
  supabase.from("profiles").select("id, user_id, name, email, phone, carebag_id, created_at, relation").order("created_at", { ascending: false }),
  supabase.from("user_roles").select("user_id, role"),
  supabase.from("partners").select("user_id"),
]);
```

**AdminAnalytics.tsx - Remove per-partner loop:**
```typescript
// BEFORE (N+1 queries - one per partner):
for (const partner of partners) {
  const { count } = await supabase.from("documents").select("*", { count: "exact", head: true }).eq("partner_id", partner.id);
}

// AFTER (single query):
const { data: partnerDocs } = await supabase.from("documents").select("partner_id");
// Count client-side by grouping
```

### Expected Impact
- Page navigation between admin sections: under 1-2 seconds (down from 10+ seconds)
- Cached admin check: instant (no network call)
- Analytics page: 1 parallel batch instead of N+1 sequential queries
