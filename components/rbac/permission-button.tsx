"use client"

import { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { PermissionGuard } from "@/components/auth/role-guard"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface PermissionButtonProps {
  children: ReactNode
  resource: string
  action: string
  disabled?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
  onClick?: () => void
  tooltip?: string
  fallback?: ReactNode
}

/**
 * A button that is automatically disabled when the user lacks permission
 */
export function PermissionButton({
  children,
  resource,
  action,
  disabled = false,
  variant = "default",
  size = "default",
  className,
  onClick,
  tooltip,
  fallback
}: PermissionButtonProps) {
  return (
    <PermissionGuard
      resource={resource}
      action={action}
      fallback={fallback}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={variant}
              size={size}
              className={className}
              disabled={disabled}
              onClick={onClick}
            >
              {children}
            </Button>
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
