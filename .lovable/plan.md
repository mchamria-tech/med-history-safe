

## Fix: Update Partner Dashboard Search to Use New Global ID Format

### Problem
The "Search by CareBag ID" section on the partner dashboard still shows the old ID format placeholder (`1ABC12`). The search functionality itself works correctly (it queries `carebag_id` in the database), but the placeholder text needs to match the new Global ID format (`IND-A38484`).

### Solution
**File:** `src/pages/partner/PartnerDashboard.tsx`

- Update the search input placeholder from `"Enter CareBag ID (e.g., 1ABC12)"` to `"Enter Global ID (e.g., IND-A38484)"` (line 557)
- Update the section heading from `"Search by CareBag ID"` to `"Search by Global ID"` (line 539)
- Update the "Don't have CareBag ID?" fallback text to `"Don't have Global ID? Search by Phone or Email"` (line 756)
- Update "not found" message from `"No client exists with this CareBag ID"` to `"No client exists with this Global ID"` (line 602)

**File:** `src/pages/partner/PartnerUserSearch.tsx`

- Update the search placeholder from `"Enter CareBag ID, email, or phone..."` to `"Enter Global ID, email, or phone..."` (line 316)
- Update the page description text accordingly (line 300)
- Update "CareBag ID:" labels to "Global ID:" in search results and linked user cards

All changes are text/label updates only -- no logic changes needed since the underlying query already searches the correct `carebag_id` column.

