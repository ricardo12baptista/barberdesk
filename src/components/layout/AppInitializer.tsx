import { useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { useAppStore } from '@/stores/app.store'
import { useEmployees, useLocations } from '@/hooks'

export function AppInitializer() {
  const { user, organization } = useAuthStore()
  const { activeLocation, setActiveLocation } = useUIStore()
  const { setTotals } = useAppStore()

  const { data: locations = [] } = useLocations()

  useEffect(() => {
    if (!organization || locations.length === 0) return

    // Validate stored activeLocation — reset if stale/invalid
    // Cases that require reset:
    //   • belongs to a different org (user switched accounts)
    //   • location id no longer exists (seed data was updated)
    if (activeLocation) {
      const stillValid =
        activeLocation.organizationId === organization.id &&
        locations.some(l => l.id === activeLocation.id)

      if (!stillValid) {
        setActiveLocation(null)
        return
      }
    }

    // For manager/employee: pin activeLocation to their assigned location
    if (user?.role !== 'super_admin' && user?.locationId) {
      const userLoc = locations.find(l => l.id === user.locationId)
      if (userLoc && activeLocation?.id !== userLoc.id) {
        setActiveLocation(userLoc)
      }
    }
    // super_admin: stays at whatever they last selected (or null = all locations)
  }, [organization?.id, locations.length, user?.role, user?.locationId])

  // Employee count for isSoloOwner
  const countLocationId =
    activeLocation?.id ??
    user?.locationId ??
    (user?.role === 'super_admin' ? locations[0]?.id : undefined)

  const { data: employees = [] } = useEmployees(countLocationId)

  useEffect(() => {
    setTotals(employees.length, locations.length)
  }, [employees.length, locations.length, setTotals])

  return null
}
