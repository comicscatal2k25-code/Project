"use client"

import { ReactNode } from "react"
import { PermissionGuard } from "@/components/auth/role-guard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Lock } from "lucide-react"

interface PermissionSectionProps {
  children: ReactNode
  resource: string
  action: string
  title?: string
  description?: string
  fallback?: ReactNode
  showCard?: boolean
}

/**
 * A section that is automatically hidden when the user lacks permission
 * Can optionally wrap content in a card with title and description
 */
export function PermissionSection({
  children,
  resource,
  action,
  title,
  description,
  fallback,
  showCard = false
}: PermissionSectionProps) {
  const defaultFallback = (
    <Alert>
      <Lock className="h-4 w-4" />
      <AlertDescription>
        You don't have permission to access this feature.
      </AlertDescription>
    </Alert>
  )

  const content = showCard ? (
    <Card>
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>
        {children}
      </CardContent>
    </Card>
  ) : children

  return (
    <PermissionGuard
      resource={resource}
      action={action}
      fallback={fallback || defaultFallback}
    >
      {content}
    </PermissionGuard>
  )
}
