import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useSWRConfig } from 'swr'
import * as liveApi from '../api'
import * as demoApi from '../demo/demoApi'
import { DEMO_USERS, HAS_BACKEND } from '../config'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [mode, setMode] = useState(HAS_BACKEND ? 'live' : 'demo')

  const [storedUser, setStoredUser] = useState(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const item = window.localStorage.getItem('ecoops_user')
        return item ? JSON.parse(item) : null
      } catch {
        return null
      }
    }
    return null
  })

  const [role, setRoleState] = useState(() => {
    if (storedUser?.role) return storedUser.role
    return 'admin'
  })

  const { mutate } = useSWRConfig()
  const refreshAll = useCallback(() => mutate(() => true), [mutate])

  const handleSetRole = useCallback((newRole) => {
    setRoleState(newRole)
    const user = DEMO_USERS[newRole]
    if (user && liveApi.setDemoUser) {
      liveApi.setDemoUser(user.id)
    }
  }, [])

  const login = useCallback(
    async (credentials) => {
      const data = await liveApi.loginUser(credentials)
      if (data?.token && data?.user) {
        localStorage.setItem('ecoops_token', data.token)
        localStorage.setItem('ecoops_user', JSON.stringify(data.user))
        setStoredUser(data.user)
        if (data.user.role) setRoleState(data.user.role)
        if (liveApi.setDemoUser) liveApi.setDemoUser(data.user.id)
        refreshAll()
      }
      return data
    },
    [refreshAll],
  )

  const signup = useCallback(
    async (userData) => {
      const data = await liveApi.registerUser(userData)
      if (data?.token && data?.user) {
        localStorage.setItem('ecoops_token', data.token)
        localStorage.setItem('ecoops_user', JSON.stringify(data.user))
        setStoredUser(data.user)
        if (data.user.role) setRoleState(data.user.role)
        if (liveApi.setDemoUser) liveApi.setDemoUser(data.user.id)
        refreshAll()
      }
      return data
    },
    [refreshAll],
  )

  const logout = useCallback(() => {
    localStorage.removeItem('ecoops_token')
    localStorage.removeItem('ecoops_user')
    setStoredUser(null)
    setRoleState('student')
    if (liveApi.setDemoUser) liveApi.setDemoUser('demo-student')
    refreshAll()
  }, [refreshAll])

  const user = useMemo(() => {
    if (storedUser) return storedUser
    return DEMO_USERS[role] || DEMO_USERS.admin
  }, [storedUser, role])

  const value = useMemo(
    () => ({
      mode,
      setMode,
      isDemo: mode === 'demo',
      api: mode === 'demo' ? demoApi : liveApi,
      role,
      setRole: handleSetRole,
      user,
      isCustomAuth: !!storedUser,
      login,
      signup,
      logout,
      refreshAll,
    }),
    [mode, role, handleSetRole, user, storedUser, login, signup, logout, refreshAll],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
