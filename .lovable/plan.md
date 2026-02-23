

## Fix: Document "View" Opens Blank Page

### Root Cause
The `window.open(url, '_blank')` call happens **after** an `await getSignedUrl(...)`. Browsers block popups that aren't triggered directly by a user gesture. Since the async call breaks the gesture chain, the popup is either blocked or opens blank.

This affects two places:
1. The "View" button click handler (line 690-714 in ProfileView.tsx)
2. The "Yes, Allow" popup permission handler (line 964-976 in ProfileView.tsx)
3. The `handleView` function in ViewDocuments.tsx (line 126-135)

### Solution

Open the window **synchronously** with `window.open('', '_blank')` first (preserving the user gesture context), then set `newWindow.location.href = signedUrl` after the async signed URL fetch completes. If the fetch fails, close the window.

### Changes

| File | Change |
|------|--------|
| `src/pages/ProfileView.tsx` | Fix the View button handler (lines 690-714) and the popup permission handler (lines 964-976) to open window first, then set URL |
| `src/pages/ViewDocuments.tsx` | Fix `handleView` (lines 126-135) to open window first, then set URL |

### Technical Details

Pattern to apply in all three locations:

```text
// Before (broken):
const { url } = await getSignedUrl(...);
window.open(url, '_blank');

// After (fixed):
const newWindow = window.open('', '_blank');
const { url, error } = await getSignedUrl(...);
if (url && !error && newWindow) {
  newWindow.location.href = url;
} else {
  newWindow?.close();
  // show error toast
}
```

This ensures the popup opens immediately on click (within the user gesture), and then navigates to the signed URL once it's ready.
