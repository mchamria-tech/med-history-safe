

## Plan: Fix Slow Admin Dashboard Loading

### Problem
The admin dashboard takes ~70+ seconds to load after login due to:
1. Redundant auth verification (edge function already verified, then `useSuperAdminCheck` re-checks)
2. Sequential database queries in `fetchStats` (4 separate count queries run one after another)
3. No loading optimization or parallelization

### Solution

#### 1. Parallelize Dashboard Queries
Run all 5 database queries simultaneously using `Promise.all` instead of sequentially in `AdminDashboard.tsx`.

**Before (sequential):**
```
profiles count → wait → partners count → wait → active partners count → wait → documents count → wait → recent partners
```

**After (parallel):**
```
All 5 queries start at once → all resolve together
```

#### 2. Optimize `useSuperAdminCheck` Hook
- Cache the admin check result in session storage so repeated navigations between admin pages don't re-verify
- Add a timeout fallback to prevent indefinite loading states

#### 3. Reduce Redundant Auth Calls
After the Global ID login flow, the edge function already verifies the user is a super admin. The dashboard then re-checks this unnecessarily. Streamline by passing a flag or caching the verification result.

---

### Technical Details

**Files to modify:**

| File | Change |
|------|--------|
| `src/pages/admin/AdminDashboard.tsx` | Wrap all 5 queries in `Promise.all` to run in parallel |
| `src/hooks/useSuperAdminCheck.ts` | Add session-level caching of admin status to avoid redundant DB calls on every page navigation |

**AdminDashboard.tsx - Parallel queries:**
```typescript
const fetchStats = async () => {
  try {
    const [usersResult, partnersResult, activePartnersResult, documentsResult] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("partners").select("*", { count: "exact", head: true }),
      supabase.from("partners").select("*", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("documents").select("*", { count: "exact", head: true }),
    ]);

    setStats({
      totalUsers: usersResult.count || 0,
      totalPartners: partnersResult.count || 0,
      totalDocuments: documentsResult.count || 0,
      activePartners: activePartnersResult.count || 0,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
  }
};
```

**useSuperAdminCheck.ts - Session caching:**
```typescript
const checkSuperAdminAccess = async () => {
  // Check session cache first
  const cached = sessionStorage.getItem("isSuperAdmin");
  if (cached === "true") {
    setIsSuperAdmin(true);
    setIsLoading(false);
    return;
  }

  // ... existing check logic ...

  // Cache result on success
  sessionStorage.setItem("isSuperAdmin", "true");
};
```

Also clear the cache on sign-out to prevent stale state.

### Expected Impact
- Dashboard load time reduced from ~70s to under 5s
- Subsequent admin page navigations will skip redundant role checks
- All stat queries run in parallel instead of waiting for each other

