-- Create initial admin user for username-based authentication
-- Run this after the username auth migration

-- Create the initial admin user
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- Generate a new UUID for the admin user
    admin_user_id := gen_random_uuid();
    
    -- First, create the user in auth.users table
    INSERT INTO auth.users (
        id,
        instance_id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        admin_user_id,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        'admin@local.com',
        crypt('admin', gen_salt('bf')), -- Hash the password properly
        now(),
        now(),
        now(),
        '',
        '',
        '',
        ''
    );
    
    -- Update the profile created by the trigger
    UPDATE public.profiles 
    SET 
        username = 'admin',
        password_hash = 'YWRtaW4=', -- Base64 encoded 'admin' password
        full_name = 'System Administrator',
        role = 'admin'
    WHERE id = admin_user_id;
    
    RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
    RAISE NOTICE 'Username: admin';
    RAISE NOTICE 'Password: admin';
    RAISE NOTICE 'Role: admin';
    
END $$;

-- Verify the admin user was created
SELECT 
    id,
    username,
    full_name,
    role,
    created_at
FROM public.profiles 
WHERE username = 'admin';

-- Show total user count
SELECT COUNT(*) as total_users FROM public.profiles WHERE username IS NOT NULL;
