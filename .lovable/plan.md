

## Bypass OTP Verification for Testing

### What Changes
Temporarily skip the email OTP step so that when a partner finds a user and clicks "Add Client", the user is linked directly without sending or verifying an OTP code.

### Files to Modify

**`src/pages/partner/PartnerDashboard.tsx`**

1. **`handleRequestLink` (line 231-270)**: Instead of calling `send-partner-otp` and opening the OTP dialog, directly insert into `partner_users` to link the client immediately. Show a success toast and refresh stats.

2. **`handleSendForgotCodeOtp` (line 272-363)**: After finding the user via `partner-search-user`, instead of calling `send-partner-otp` and opening the OTP dialog, directly link the user the same way.

3. **Button labels**: Change "Sending OTP..." to "Linking..." and "Send OTP" to "Add Client" in the phone/email search section to reflect the simplified flow.

4. The OTP dialog, OTP state variables, and `handleVerifyOtp` function will remain in the code (unused) so they can be re-enabled easily later when the Resend API key is sorted out.

### What Stays the Same
- The search flow (Global ID and phone/email search via `partner-search-user`) is unchanged
- The `send-partner-otp` edge function is untouched (ready for when email is fixed)
- All OTP-related code stays in the file, just temporarily bypassed

