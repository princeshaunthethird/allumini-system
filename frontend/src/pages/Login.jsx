import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { GraduationCap, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const DEMO_ACCOUNTS = [
  { label: 'Master Admin',    email: 'demo@alumni.com',  role: 'Full Access · All Features' },
  { label: 'Priya — Google',  email: 'priya@alumni.com', role: 'Data Scientist' },
  { label: 'Rahul — Startup', email: 'rahul@alumni.com', role: 'Startup Founder' },
  { label: 'Sneha — FinEdge', email: 'sneha@alumni.com', role: 'Product Manager' },
  { label: 'Arjun — Tata',   email: 'arjun@alumni.com', role: 'Mechanical Engineer' },
]

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(form.email, form.password)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (email) => {
    setForm({ email, password: 'demo1234' })
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-800/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-700/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="text-white font-display font-semibold text-xl">AlumniConnect</span>
          </div>
        </div>

        <div className="relative z-10">
          <h2 className="text-white font-display text-4xl font-bold leading-tight mb-4">
            Reconnect with your<br />alma mater community
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed">
            Build meaningful professional relationships, discover opportunities,
            and stay connected with fellow alumni.
          </p>
        </div>

        <div className="relative z-10 flex gap-8">
          {[['10K+', 'Alumni'], ['500+', 'Companies'], ['2K+', 'Jobs Posted']].map(([num, label]) => (
            <div key={label}>
              <p className="text-white font-display text-2xl font-bold">{num}</p>
              <p className="text-slate-400 text-sm">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-md animate-slide-up">

          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-display font-semibold text-slate-800">AlumniConnect</span>
          </div>

          <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Sign in</h1>
          <p className="text-slate-500 mb-8">Welcome back. Enter your credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">Password</label>
                <Link to="/forgot-password" className="text-sm text-brand-600 hover:text-brand-700 font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  className="input pr-12"
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">
              Create one
            </Link>
          </p>

          {/* ── Demo Credentials Panel ── */}
          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 overflow-hidden">
            <div className="px-4 py-3 bg-amber-100 border-b border-amber-200 flex items-center justify-between">
              <p className="text-amber-800 font-semibold text-sm flex items-center gap-1.5">
                🎓 Demo Accounts
              </p>
              <span className="text-amber-600 text-xs font-mono bg-white border border-amber-200 rounded-lg px-2 py-0.5">
                password: demo1234
              </span>
            </div>
            <div className="p-2 space-y-1">
              {DEMO_ACCOUNTS.map(({ label, email, role }) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => fillDemo(email)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all text-left group
                    ${form.email === email
                      ? 'bg-brand-600 border-brand-600 text-white'
                      : 'bg-white hover:bg-amber-50 border-amber-100 hover:border-amber-300'
                    }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0
                      ${form.email === email ? 'bg-white/20 text-white' : 'bg-brand-100 text-brand-700'}`}>
                      {label.charAt(0)}
                    </div>
                    <div>
                      <p className={`text-xs font-semibold leading-tight ${form.email === email ? 'text-white' : 'text-slate-700'}`}>
                        {label}
                      </p>
                      <p className={`text-xs leading-tight ${form.email === email ? 'text-white/70' : 'text-slate-400'}`}>
                        {role}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-mono flex-shrink-0 ml-2 ${form.email === email ? 'text-white/80' : 'text-slate-400 group-hover:text-brand-600'}`}>
                    ↵ click to fill
                  </span>
                </button>
              ))}
            </div>
            <p className="text-center text-amber-600 text-xs pb-3 px-4">
              Click any account above to auto-fill credentials, then hit <strong>Sign in</strong>
            </p>
          </div>

        </div>
      </div>
    </div>
  )
}
