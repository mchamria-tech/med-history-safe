

## Plan: Improve Error Messages Across Edge Functions and Client Code

### Problem
When backend functions return HTTP 400/500 errors, the Supabase client library wraps them in a `FunctionsHttpError` object. The actual error message (e.g., "This email address is already registered") is hidden inside the response body and not properly extracted on the client side. Users see generic or unhelpful error messages.

### Solution Overview
Two changes are needed:
1. **Client-side**: Properly extract error messages from edge function responses by reading the response body from `FunctionsHttpError`
2. **Edge function**: Ensure all error responses include clear, actionable messages with proper error codes

---

### Changes

#### 1. AdminPartnerForm.tsx - Extract meaningful error from edge function responses

Update the partner creation error handling (around lines 192-228) to properly parse the error body from `FunctionsHttpError`:

```typescript
// After supabase.functions.invoke("create-partner", ...)
if (error) {
  // Extract the actual error message from the response body
  const errorBody = await error.context?.json?.();
  const message = errorBody?.error || error.message || "Failed to create partner";
  throw new Error(message);
}
```

This same pattern should be applied to all other `supabase.functions.invoke` calls across:
- `src/pages/admin/AdminPartners.tsx` (password reset)
- `src/pages/admin/AdminUsers.tsx` (delete user, password reset)
- `src/pages/partner/PartnerDashboard.tsx` (send OTP)
- `src/pages/partner/PartnerUserSearch.tsx` (send OTP)
- `src/pages/ProfileView.tsx` (document metadata)

#### 2. Create a shared utility for edge function error extraction

Add a helper in `src/lib/utils.ts` to standardize error extraction:

```typescript
export async function getEdgeFunctionError(error: any): Promise<string> {
  try {
    if (error?.context?.json) {
      const body = await error.context.json();
      return body?.error || error.message || "An unexpected error occurred";
    }
  } catch {}
  return error?.message || "An unexpected error occurred";
}
```

#### 3. Improve edge function error messages in create-partner

Update `supabase/functions/create-partner/index.ts` to return more specific, actionable error messages:

| Current Message | Improved Message |
|----------------|-----------------|
| `"This email address is already registered..."` | `"This email address is already registered. If this partner already has an account, search for them in the Partners list instead."` |
| `"Name, email, and password are required"` | `"Please provide all required fields: Business Name, Email, and Password."` |
| `"Only super admins can create partners"` | `"You do not have permission to create partners. Only Super Admins can perform this action."` |
| `"Missing authorization header"` | `"Your session has expired. Please log in again."` |

---

### Files to Modify

| File | Change |
|------|--------|
| `src/lib/utils.ts` | Add `getEdgeFunctionError` helper |
| `src/pages/admin/AdminPartnerForm.tsx` | Use helper to extract real error messages |
| `src/pages/admin/AdminPartners.tsx` | Same pattern for password reset calls |
| `src/pages/admin/AdminUsers.tsx` | Same pattern for delete-user and password reset |
| `src/pages/partner/PartnerDashboard.tsx` | Same pattern for send-partner-otp |
| `src/pages/partner/PartnerUserSearch.tsx` | Same pattern for send-partner-otp |
| `src/pages/ProfileView.tsx` | Same pattern for extract-document-metadata |
| `supabase/functions/create-partner/index.ts` | Improve error message wording |

