

## Fix: Partner Login Code Field for New Global ID Format

### Problem
The Partner Code input field on the login page is restricted to 6 characters (`maxLength={6}`) and shows an old-format placeholder (`X3CZ3T`). The new Global ID format is `IND-X38484` (10 characters), so partners cannot enter their full code.

### Solution
**File:** `src/pages/partner/PartnerLogin.tsx`

- Remove `maxLength={6}` from the Partner Code input (line 218)
- Update the placeholder from `"X3CZ3T"` to `"IND-X38484"` (line 217)
- Adjust `tracking-widest` to `tracking-wide` for better readability with longer codes

One small, focused change -- no other files affected.

