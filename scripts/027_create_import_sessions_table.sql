-- Create import_sessions table for tracking import operations
CREATE TABLE IF NOT EXISTS public.import_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_size BIGINT,
    total_records INTEGER NOT NULL DEFAULT 0,
    imported_records INTEGER NOT NULL DEFAULT 0,
    error_records INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'completed_with_errors', 'failed')),
    errors TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_import_sessions_user_id ON public.import_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_import_sessions_created_at ON public.import_sessions(created_at);

-- Enable RLS
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own import sessions" ON public.import_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own import sessions" ON public.import_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own import sessions" ON public.import_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_import_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_import_sessions_updated_at
    BEFORE UPDATE ON public.import_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_import_sessions_updated_at();

-- Insert some sample import session data for testing
INSERT INTO public.import_sessions (
    user_id,
    filename,
    file_size,
    total_records,
    imported_records,
    error_records,
    status,
    created_at
) VALUES (
    (SELECT id FROM auth.users LIMIT 1),
    'sample-comics.csv',
    1024,
    10,
    10,
    0,
    'completed',
    NOW() - INTERVAL '1 day'
) ON CONFLICT DO NOTHING;
