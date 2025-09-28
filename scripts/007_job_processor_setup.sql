-- Job Processor Setup Script
-- This script creates functions and indexes for the job queue system

-- Create function to automatically retry failed jobs
CREATE OR REPLACE FUNCTION public.retry_failed_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Retry jobs that failed less than 24 hours ago and haven't exceeded max attempts
  UPDATE public.job_queue
  SET 
    status = 'pending',
    scheduled_at = NOW() + INTERVAL '5 minutes',
    error_message = NULL
  WHERE 
    status = 'failed'
    AND attempts < max_attempts
    AND completed_at > NOW() - INTERVAL '24 hours';
END;
$$;

-- Create function to clean up old completed jobs
CREATE OR REPLACE FUNCTION public.cleanup_old_jobs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete completed jobs older than 30 days
  DELETE FROM public.job_queue
  WHERE 
    status IN ('completed', 'failed', 'cancelled')
    AND completed_at < NOW() - INTERVAL '30 days';
    
  -- Delete old import sessions
  DELETE FROM public.import_sessions
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Create indexes for job processing performance
CREATE INDEX IF NOT EXISTS idx_job_queue_processing 
ON public.job_queue(status, priority DESC, created_at) 
WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_job_queue_user_status 
ON public.job_queue(user_id, status);

CREATE INDEX IF NOT EXISTS idx_job_queue_scheduled 
ON public.job_queue(scheduled_at) 
WHERE status = 'pending';

-- Create function to get job statistics
CREATE OR REPLACE FUNCTION public.get_job_stats(p_user_id UUID)
RETURNS TABLE(
  pending_count BIGINT,
  processing_count BIGINT,
  completed_today BIGINT,
  failed_today BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM public.job_queue WHERE user_id = p_user_id AND status = 'pending'),
    (SELECT COUNT(*) FROM public.job_queue WHERE user_id = p_user_id AND status = 'processing'),
    (SELECT COUNT(*) FROM public.job_queue WHERE user_id = p_user_id AND status = 'completed' AND completed_at > CURRENT_DATE),
    (SELECT COUNT(*) FROM public.job_queue WHERE user_id = p_user_id AND status = 'failed' AND completed_at > CURRENT_DATE);
END;
$$;
