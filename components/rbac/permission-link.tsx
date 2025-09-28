"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { PermissionGuard } from "@/components/auth/role-guard"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface PermissionLinkProps {
  children: ReactNode
  href: string
  resource: string
  action: string
  className?: string
  tooltip?: string
  fallback?: ReactNode
}

/**
 * A link that is automatically hidden when the user lacks permission
 */
export function PermissionLink({
  children,
  href,
  resource,
  action,
  className,
  tooltip,
  fallback
}: PermissionLinkProps) {
  return (
    <PermissionGuard
      resource={resource}
      action={action}
      fallback={fallback}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href} className={cn("hover:opacity-80 transition-opacity", className)}>
              {children}
            </Link>
          </TooltipTrigger>
          {tooltip && (
            <TooltipContent>
              <p>{tooltip}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    </PermissionGuard>
  )
}
