import { ReactNode } from 'react'
import { Ability, can } from './abilities'
import { useAuthStore } from '@/stores/auth.store'

interface PermissionGateProps {
  ability: Ability
  children: ReactNode
  fallback?: ReactNode
}

export function PermissionGate({ ability, children, fallback = null }: PermissionGateProps) {
  const { user } = useAuthStore()
  if (!user) return <>{fallback}</>
  return can(user.role, ability) ? <>{children}</> : <>{fallback}</>
}
