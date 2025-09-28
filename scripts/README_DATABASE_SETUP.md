-- Database Setup Script for Comic Catalog Manager
-- Run these scripts in order to set up the complete database

-- 1. First, run the original scripts (if not already run):
-- scripts/001_create_users_and_profiles.sql
-- scripts/002_create_comics_tables.sql (if exists)
-- scripts/003_create_shopify_tables.sql (if exists)
-- scripts/004_create_job_queue_tables.sql (if exists)
-- scripts/005_create_indexes_and_functions.sql (if exists)
-- scripts/006_seed_initial_data.sql (if exists)
-- scripts/007_job_processor_setup.sql (if exists)
-- scripts/008_fix_user_creation.sql (if exists)

-- 2. Then run our new scripts:
-- scripts/009_update_roles_and_permissions.sql
-- scripts/010_create_enhanced_comics_schema.sql
-- scripts/011_insert_dummy_comics_data.sql
-- scripts/012_link_creators_and_images.sql

-- Note: Make sure to replace the user_id in the comics data with your actual user ID
-- You can find your user ID by running:
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com';

-- To update the user_id in the comics data, run:
-- UPDATE public.comics SET user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com') WHERE user_id = '00000000-0000-0000-0000-000000000001';
