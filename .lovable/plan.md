

## Enhance Profile Delete Confirmation UX

### Problem
The current delete confirmation dialog is too easy to click through accidentally. It uses a simple "Delete" button that doesn't require any deliberate action.

### Solution
Upgrade the profile deletion confirmation dialog with a **type-to-confirm** pattern showing the profile name, plus clearer warnings about what gets deleted.

### Changes

**`src/pages/Profiles_Main.tsx`**

1. Add state for `deleteConfirmText` to track what the user types
2. Update the delete confirmation dialog to:
   - Display the profile name being deleted prominently
   - Show exactly what will be removed (profile data, linked documents, access grants)
   - Require the user to type the profile name (e.g., "Delete Mohit") to enable the delete button
   - Keep the delete button disabled until the typed text matches
3. Reset `deleteConfirmText` when dialog closes

The delete account dialog already has a strong warning -- no changes needed there.

### Files

| File | Action |
|------|--------|
| `src/pages/Profiles_Main.tsx` | Enhance delete profile confirmation with type-to-confirm |

### Recovery Note
The deleted profile for `mchamria@me.com` cannot be recovered as it was a hard delete. The user's login credentials are intact -- they can log in and recreate the profile.

