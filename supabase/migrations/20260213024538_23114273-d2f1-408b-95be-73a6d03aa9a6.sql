
-- Delete orphaned auth accounts (no roles, no profiles), keeping only super admin
DELETE FROM auth.users WHERE id IN (
  '972fe698-ba5a-4e4e-ac47-630701d32849',
  'd660818d-a9a5-4d11-849a-fdcf7ae776c7',
  '3dfd960e-5f3f-4e65-b907-6bed82414532',
  'a662a04a-8cd1-4e6d-a371-2edba182329b',
  '0245facd-8500-4ac4-b604-fb5845c702f3',
  '9c68b023-a1f6-4c34-a2c0-7834abb67577',
  'a6e232eb-4355-4c75-9350-6365ba21346b',
  '0bc7ed0f-332a-4609-816b-afdab5ea3a6c',
  '5624ca0b-a409-4746-a874-c1c91793231a'
);
