import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useSWRConfig } from 'swr'
import * as liveApi from '../api'
import * as demoApi from '../demo/demoApi'
import { DEMO_USERS, HAS_BACKEND } from '../config'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [mode, setMode] = useState(HAS_BACKEND ? 'live' : 'demo')
  const [role, setRole] = useState('admin')
  const { mutate } = useSWRConfig()

  const refreshAll = useCallback(() => mutate(() => true), [mutate])

  const handleSetRole = useCallback((newRole) => {
    setRole(newRole)
    const user = DEMO_USERS[newRole]
    if (user && liveApi.setDemoUser) {
      liveApi.setDemoUser(user.id)
    }
  }, [])

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isDemo: mode === 'demo',
      api: mode === 'demo' ? demoApi : liveApi,
      role,
      setRole: handleSetRole,
      user: DEMO_USERS[role],
      refreshAll,
    }),
    [mode, role, handleSetRole, refreshAll],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
