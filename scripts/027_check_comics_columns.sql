-- Check what columns actually exist in the comics table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'comics'
ORDER BY ordinal_position;
