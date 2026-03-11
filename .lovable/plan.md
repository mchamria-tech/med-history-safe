

## Update Project Documentation

The current `.lovable/plan.md` is outdated (only covers the Partner Portal enhancements plan) and `README.md` is the default Lovable template. Both need to reflect the full current state of the system including the Doctor Portal, hybrid access model, and AI lab analysis features.

### Changes

**1. `.lovable/plan.md`** -- Replace with comprehensive system architecture document covering:

- **System Overview**: CareBag -- a mobile-first health records platform with B2C user app, B2B partner portal, doctor portal, and super admin panel
- **User Roles**: `user`, `partner`, `doctor`, `admin`, `super_admin` (stored in `user_roles` table)
- **Database Tables**: All 10+ tables with their purpose (profiles, documents, partners, doctors, doctor_access, doctor_patients, partner_users, document_access_grants, etc.)
- **Edge Functions**: All 16 functions with brief descriptions
- **Route Map**: All routes organized by portal (User, Admin, Partner, Doctor)
- **Doctor Access Model (Hybrid)**:
  - Time-limited access (1 hour) via `doctor_access` table
  - Persistent care team via `doctor_patients` table (independent doctors only)
  - Patient grants access via "Share with Doctor" dialog using doctor's Global ID
  - `grant-doctor-access` edge function handles both modes
- **AI Lab Report Analysis**: Available to users, partners, and doctors via separate edge functions (`analyze-lab-report-user`, `analyze-lab-report`, `analyze-lab-report-doctor`)
- **Global ID System**: Format `{COUNTRY}-{PREFIX}{5chars}` (e.g., `IND-A1B2C3` for users, `IND-D1A2B3` for doctors)
- **RLS Policy Summary**: Key access patterns per table
- **Storage Buckets**: `profile-photos`, `profile-documents`, `partner-logos`

**2. `README.md`** -- Update the project description section to reflect CareBag's actual purpose and features, while keeping the dev setup instructions.

### Files

| File | Action |
|------|--------|
| `.lovable/plan.md` | Rewrite -- full system architecture |
| `README.md` | Update -- add project description |

