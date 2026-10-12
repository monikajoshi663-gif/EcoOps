import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Leaf, LogIn, UserPlus, AlertCircle, CheckCircle2, Shield, Wrench, GraduationCap } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

export default function AuthPage() {
  const [searchParams] = useSearchParams()
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  const [tab, setTab] = useState(initialMode)
  const navigate = useNavigate()
  const { login, signup, user, isCustomAuth, logout } = useApp()
  const toast = useToast()

  // Form states
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [team, setTeam] = useState('HVAC')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (tab === 'login') {
        await login({ email, password })
        toast?.success?.('Welcome back! Signed in successfully.')
      } else {
        await signup({ name, email, password, role, team: role === 'staff' ? team : null })
        toast?.success?.('Account created successfully!')
      }
      navigate('/')
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setError(null)
    setLoading(true)
    try {
      await login({ email: demoEmail, password: demoPassword })
      toast?.success?.(`Signed in as ${demoEmail}!`)
      navigate('/')
    } catch (err) {
      setError(err.message || 'Quick login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center py-6">
      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center">
        <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-fg shadow-lg shadow-primary/20">
          <Leaf className="size-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-fg">EcoOps Portal</h1>
        <p className="mt-1 text-sm text-muted">Intelligent Campus Sustainability & Resource Management</p>
      </div>

      {/* Active User Card (if logged in) */}
      {isCustomAuth && (
        <div className="mb-6 flex w-full items-center justify-between rounded-xl border border-primary/30 bg-primary/10 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="size-5 text-primary" />
            <div className="text-left">
              <p className="text-sm font-semibold text-fg">Logged in as {user.name}</p>
              <p className="text-xs text-muted capitalize">{user.role} &bull; {user.email || user.id}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              toast?.success?.('Logged out')
            }}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium text-fg hover:bg-surface-2"
          >
            Log out
          </button>
        </div>
      )}

      {/* Main Card */}
      <div className="w-full rounded-2xl border border-line bg-surface p-6 shadow-xl">
        {/* Tab switch */}
        <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-line bg-surface-2 p-1">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(null) }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === 'login' ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            <LogIn className="size-4" />
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(null) }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === 'signup' ? 'bg-primary text-primary-fg shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            <UserPlus className="size-4" />
            Sign Up
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 flex items-start gap-2.5 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {tab === 'signup' && (
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-fg">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-fg">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@campus.edu"
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-fg">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-muted focus:border-primary focus:outline-none"
            />
          </div>

          {tab === 'signup' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-fg">Campus Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg focus:border-primary focus:outline-none"
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff Technician</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              {role === 'staff' && (
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-fg">Facility Team</label>
                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full rounded-lg border border-line bg-surface-2 px-3 py-2 text-sm text-fg focus:border-primary focus:outline-none"
                  >
                    <option value="HVAC">HVAC</option>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="General">General</option>
                  </select>
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-fg shadow-md transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : tab === 'login' ? (
              <>
                <LogIn className="size-4" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="size-4" /> Create Account
              </>
            )}
          </button>
        </form>

        {/* 1-Click Quick Demo Login for Judges */}
        <div className="mt-6 border-t border-line pt-5">
          <p className="mb-3 text-center text-xs font-medium text-muted">1-Click Quick Demo Sign In</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleQuickLogin('sustainability@campus.edu', 'demo123')}
              className="flex flex-col items-center gap-1 rounded-xl border border-line bg-surface-2 p-2.5 text-center text-xs text-fg transition hover:border-primary hover:bg-primary/5"
            >
              <Shield className="size-4 text-primary" />
              <span className="font-medium">Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('facilities@campus.edu', 'demo123')}
              className="flex flex-col items-center gap-1 rounded-xl border border-line bg-surface-2 p-2.5 text-center text-xs text-fg transition hover:border-primary hover:bg-primary/5"
            >
              <Wrench className="size-4 text-warn" />
              <span className="font-medium">Staff</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickLogin('aarav@campus.edu', 'demo123')}
              className="flex flex-col items-center gap-1 rounded-xl border border-line bg-surface-2 p-2.5 text-center text-xs text-fg transition hover:border-primary hover:bg-primary/5"
            >
              <GraduationCap className="size-4 text-info" />
              <span className="font-medium">Student</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
