

## Fix: Make the Header Search Bar Functional

### Problem
The "Search client or record..." input in the dashboard header has `readOnly` applied, so it looks like a text field but doesn't accept any typing. It's currently designed as a clickable button that scrolls down to reveal the search section -- but this is confusing because it looks like a regular input.

### Solution
**File:** `src/components/partner/DashboardHeader.tsx`

Convert the header search bar from a read-only clickable trigger into a real input that accepts typing and triggers search navigation:

- Remove the `readOnly` attribute
- Remove the `cursor-pointer` class
- Add local state to capture the typed value
- When the user types and presses Enter, navigate to the search page with their query pre-filled
- Keep the click-to-navigate behavior as a fallback

Alternatively (simpler approach): Make it visually obvious that clicking it opens the search panel by keeping `readOnly` but styling it more like a button, and ensuring the click reliably opens the search section below and auto-focuses the real input.

### Recommended Approach (Simpler)
Keep the header bar as a trigger but improve the UX:

1. In `DashboardHeader.tsx`: Keep `readOnly` but ensure clicking it works reliably
2. In `PartnerDashboard.tsx`: When `onSearchClick` fires, scroll to the search section and auto-focus the actual input field using a ref

This requires:
- Adding a `ref` to the Global ID search input in `PartnerDashboard.tsx`
- After `setShowSearchSection(true)`, use `setTimeout` + `ref.current?.focus()` to auto-focus the real input
- This way clicking the header bar immediately puts the cursor in the working search field

### Technical Details

| File | Change |
|------|--------|
| `src/pages/partner/PartnerDashboard.tsx` | Add a `useRef` for the search input, auto-focus it when search section opens, scroll into view |
| `src/components/partner/DashboardHeader.tsx` | No changes needed (current behavior is fine as a trigger) |

