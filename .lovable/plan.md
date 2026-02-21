

## Fix: Partner Client Search Blocked by Security Policies

### Problem
When a partner searches for an existing user by Global ID or email/phone, the database security policies only allow partners to see profiles they **already own or have linked**. This creates a catch-22: you can't find a user to link them, because you can only see users already linked.

Both the "Search by Global ID" and "Search by Phone/Email" flows are affected.

### Solution
Create a secure backend function that performs the search with elevated privileges, returning only the minimal information needed (name, Global ID, profile ID) -- never exposing sensitive data like full email or phone.

### Changes

**1. New backend function: `partner-search-user`**
- Accepts a search query (Global ID, email, or phone) and the partner ID
- Validates that the caller is an authenticated partner
- Searches the profiles table using service role (bypasses security restrictions)
- Returns only: `id`, `name`, `carebag_id`, and a masked email (e.g., `m***@me.com`)
- Does NOT expose full email, phone, or other personal data

**2. Update `src/pages/partner/PartnerDashboard.tsx`**
- Replace the direct database query in `handleSearchByCode` with a call to the new backend function
- Replace the direct database query in `handleSendForgotCodeOtp` with the same backend function
- The rest of the flow (OTP, linking) remains unchanged

**3. Register the function in `supabase/config.toml`**
- Add `[functions.partner-search-user]` with `verify_jwt = true`

### How It Works (After Fix)

```text
Partner types Global ID or email
        |
        v
Frontend calls partner-search-user function
        |
        v
Function validates partner auth --> searches ALL profiles
        |
        v
Returns minimal info (name, masked email, profile ID)
        |
        v
Partner sees result --> clicks "Add Client" --> OTP flow begins
```

### Security Considerations
- The function only returns minimal, non-sensitive fields
- Email is masked (first letter + *** + domain)
- Phone is masked (last 4 digits only)
- The function verifies the caller has a valid partner role before searching
- No changes to existing database security policies needed

