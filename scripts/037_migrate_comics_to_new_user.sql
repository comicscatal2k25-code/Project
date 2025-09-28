-- Migrate existing comics to the new admin user
-- This script will update all existing comics to belong to the new admin user

DO $$
DECLARE
    admin_user_id UUID;
    comics_count INTEGER;
BEGIN
    -- Get the admin user ID
    SELECT user_id INTO admin_user_id 
    FROM profiles 
    WHERE username = 'admin' AND role = 'admin';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'Admin user not found!';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Admin user ID: %', admin_user_id;
    
    -- Count existing comics
    SELECT COUNT(*) INTO comics_count FROM comics;
    RAISE NOTICE 'Found % comics to migrate', comics_count;
    
    -- Update all comics to belong to the admin user
    UPDATE comics 
    SET user_id = admin_user_id
    WHERE user_id != admin_user_id;
    
    -- Show updated count
    SELECT COUNT(*) INTO comics_count FROM comics WHERE user_id = admin_user_id;
    RAISE NOTICE 'Successfully migrated % comics to admin user', comics_count;
    
    -- Show sample of updated comics
    RAISE NOTICE 'Sample of updated comics:';
    RAISE NOTICE '  Check the comics table to see the migrated data';
    
END $$;
