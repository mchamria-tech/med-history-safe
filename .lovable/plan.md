

## Add Partner Label and Editable Search Tags to Documents

### What Changes

**1. Enhanced partner badge on document cards (`src/pages/ViewDocuments.tsx`)**
- Replace the subtle accent badge with a more visible "Uploaded by [Partner Name]" label styled distinctly (e.g., blue/indigo badge with a building icon) so patients clearly see which documents came from a partner

**2. Add "Edit Tags" option to the document dropdown menu**
- Add a new "Edit Tags" menu item (with a pencil/tag icon) in the existing dropdown for each document
- Opens a dialog where the patient can edit: `document_type`, `ailment`, `medicine`, and `other_tags`
- On save, updates the document record via `supabase.from('documents').update()`
- This works because the RLS policy "Users can view documents pushed to their profile" allows SELECT, but UPDATE requires `user_id = auth.uid()`. Since partner-uploaded docs have the partner's context in `user_id`, we need to check whether the existing "Users can manage self-uploaded documents" policy covers this or if an update will need to go through the profile ownership path.

**3. RLS consideration**
- The current RLS lets users UPDATE only documents where `user_id = auth.uid()`. Partner-uploaded documents set `user_id` to the profile's `user_id` (the patient), so the patient CAN update their own partner-uploaded docs directly -- no edge function needed.

### Files to Modify

**`src/pages/ViewDocuments.tsx`**
- Expand the `Document` interface to include `ailment`, `medicine`, `other_tags`, `doctor_name`
- Add state for edit dialog: `editDoc` (the document being edited), and form fields for the four tag fields
- Add `handleEditTags` to open the edit dialog pre-filled with existing values
- Add `handleSaveEdit` to update the document record in the database
- Add an "Edit Tags" item in the dropdown menu (with `Tag` or `Edit` icon)
- Improve the partner source badge: use a more prominent style with a building icon and "Uploaded by" prefix
- Add the edit dialog UI with four input fields (Search Keywords, Ailment, Medicine, Other Tags)

### Technical Details

| Component | Change |
|-----------|--------|
| Document interface | Add `ailment`, `medicine`, `other_tags`, `doctor_name` fields |
| Partner badge | Restyle with building icon + "Uploaded by" prefix, more visible color |
| Dropdown menu | Add "Edit Tags" item between View and Download |
| Edit dialog | Dialog with 4 input fields, Save/Cancel buttons |
| Database update | Direct `supabase.from('documents').update()` -- allowed by existing RLS |

