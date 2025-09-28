import { createClient } from "@/lib/supabase/server"

export interface AuditLogEntry {
  actor_user_id?: string
  target_user_id?: string
  action: string
  resource: string
  outcome: 'success' | 'failure' | 'denied'
  ip?: string
  user_agent?: string
  metadata?: Record<string, any>
}

/**
 * Log an audit event to the database
 */
export async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  try {
    const supabase = await createClient()
    
    await supabase.rpc('log_audit_event', {
      p_actor_user_id: entry.actor_user_id || null,
      p_target_user_id: entry.target_user_id || null,
      p_action: entry.action,
      p_resource: entry.resource,
      p_outcome: entry.outcome,
      p_ip: entry.ip || null,
      p_user_agent: entry.user_agent || null,
      p_metadata: entry.metadata || null
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Log user creation event
 */
export async function logUserCreation(
  actorUserId: string,
  targetUserId: string,
  role: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action: 'create_user',
    resource: 'users',
    outcome: 'success',
    ip,
    user_agent: userAgent,
    metadata: { role }
  })
}

/**
 * Log role change event
 */
export async function logRoleChange(
  actorUserId: string,
  targetUserId: string,
  oldRole: string,
  newRole: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    actor_user_id: actorUserId,
    target_user_id: targetUserId,
    action: 'change_role',
    resource: 'users',
    outcome: 'success',
    ip,
    user_agent: userAgent,
    metadata: { old_role: oldRole, new_role: newRole }
  })
}

/**
 * Log access denied event
 */
export async function logAccessDenied(
  actorUserId: string,
  resource: string,
  action: string,
  reason: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  await logAuditEvent({
    actor_user_id: actorUserId,
    action: 'access_denied',
    resource,
    outcome: 'denied',
    ip,
    user_agent: userAgent,
    metadata: { attempted_action: action, reason }
  })
}

/**
 * Log authentication events
 */
export async function logAuthEvent(
  userId: string,
  action: 'login' | 'logout' | 'login_failed',
  ip?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    actor_user_id: userId,
    action,
    resource: 'auth',
    outcome: action === 'login_failed' ? 'failure' : 'success',
    ip,
    user_agent: userAgent,
    metadata
  })
}

/**
 * Log comic management events
 */
export async function logComicEvent(
  userId: string,
  action: 'create' | 'update' | 'delete',
  comicId: string,
  outcome: 'success' | 'failure',
  ip?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    actor_user_id: userId,
    action: `${action}_comic`,
    resource: 'comics',
    outcome,
    ip,
    user_agent: userAgent,
    metadata: { comic_id: comicId, ...metadata }
  })
}

/**
 * Log import/export events
 */
export async function logImportExportEvent(
  userId: string,
  action: 'import' | 'export',
  outcome: 'success' | 'failure',
  ip?: string,
  userAgent?: string,
  metadata?: Record<string, any>
): Promise<void> {
  await logAuditEvent({
    actor_user_id: userId,
    action: `${action}_data`,
    resource: action,
    outcome,
    ip,
    user_agent: userAgent,
    metadata
  })
}

/**
 * Get audit logs with filtering
 */
export async function getAuditLogs(
  filters: {
    actor_user_id?: string
    target_user_id?: string
    action?: string
    resource?: string
    outcome?: string
    start_date?: string
    end_date?: string
    limit?: number
    offset?: number
  } = {}
): Promise<{
  data: any[]
  count: number
  error?: string
}> {
  try {
    const supabase = await createClient()
    
    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('timestamp', { ascending: false })

    // Apply filters
    if (filters.actor_user_id) {
      query = query.eq('actor_user_id', filters.actor_user_id)
    }
    if (filters.target_user_id) {
      query = query.eq('target_user_id', filters.target_user_id)
    }
    if (filters.action) {
      query = query.eq('action', filters.action)
    }
    if (filters.resource) {
      query = query.eq('resource', filters.resource)
    }
    if (filters.outcome) {
      query = query.eq('outcome', filters.outcome)
    }
    if (filters.start_date) {
      query = query.gte('timestamp', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('timestamp', filters.end_date)
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1)
    }

    const { data, count, error } = await query

    if (error) {
      return { data: [], count: 0, error: error.message }
    }

    return { data: data || [], count: count || 0 }
  } catch (error) {
    return { 
      data: [], 
      count: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
