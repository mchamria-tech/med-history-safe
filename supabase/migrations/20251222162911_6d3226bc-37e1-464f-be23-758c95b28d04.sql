-- Delete documents for profiles owned by user mukund@taggedinfotech.com
DELETE FROM public.documents 
WHERE user_id = '5b29dfba-6314-494b-9bdf-72f186b9eca9';

-- Delete profiles for that user
DELETE FROM public.profiles 
WHERE user_id = '5b29dfba-6314-494b-9bdf-72f186b9eca9';

-- Note: The super_admin role in user_roles is preserved