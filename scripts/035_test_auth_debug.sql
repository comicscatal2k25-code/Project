-- Test the authentication function with debug output
DO $$
DECLARE
    result RECORD;
    admin_user_id UUID;
BEGIN
    -- First, let's check if the admin user exists
    SELECT id INTO admin_user_id 
    FROM auth.users 
    WHERE email = 'admin@local.com';
    
    IF admin_user_id IS NULL THEN
        RAISE NOTICE 'Admin user not found in auth.users';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Admin user ID: %', admin_user_id;
    
    -- Check the profile
    SELECT * INTO result 
    FROM public.profiles 
    WHERE user_id = admin_user_id;
    
    IF result IS NULL THEN
        RAISE NOTICE 'Profile not found for admin user';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Profile found - Username: %, Role: %, Full Name: %', 
        result.username, result.role, result.full_name;
    
    -- Test the authentication function
    SELECT * INTO result 
    FROM authenticate_username_user('admin', 'YWRtaW4=');
    
    IF result IS NULL THEN
        RAISE NOTICE 'Authentication failed - no result';
    ELSE
        RAISE NOTICE 'Authentication successful - User ID: %, Username: %, Role: %', 
            result.user_id, result.username, result.role;
    END IF;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error: %', SQLERRM;
END $$;
