import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { GraduationCap, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const COURSES = [
  'Computer Science', 'Information Technology', 'Electronics Engineering',
  'Mechanical Engineering', 'Civil Engineering', 'Business Administration',
  'Data Science', 'Artificial Intelligence', 'Other'
]

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', graduation_year: '', course: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const update = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register({
        ...form,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : undefined,
      })
      toast.success('Account created! Welcome aboard 🎉')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 50 }, (_, i) => currentYear - i)

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-slate-900 via-slate-800 to-brand-900 flex-col justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-brand-800/20 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <GraduationCap size={20} className="text-white" />
            </div>
            <span className="text-white font-display font-semibold text-xl">AlumniConnect</span>
          </div>
          <h2 className="text-white font-display text-3xl font-bold leading-tight mb-4">
            Join the largest alumni network
          </h2>
          <p className="text-slate-400">
            Connect, collaborate, and grow with thousands of alumni worldwide.
          </p>

          <div className="mt-8 space-y-4">
            {['Find job opportunities from alumni companies', 'Connect with batchmates & seniors', 'Share knowledge and mentor juniors'].map(item => (
              <div key={item} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-600 flex items-center justify-center mt-0.5 flex-shrink-0">
                  <span className="text-white text-xs">✓</span>
                </div>
                <p className="text-slate-300 text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-10 bg-white">
        <div className="w-full max-w-md animate-slide-up">
          <div className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-display font-semibold text-slate-800">AlumniConnect</span>
          </div>

          <h1 className="text-3xl font-display font-bold text-slate-900 mb-2">Create account</h1>
          <p className="text-slate-500 mb-6">Join the alumni community in seconds.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input" placeholder="Jane Doe" value={form.name}
                onChange={e => update('name', e.target.value)} required />
            </div>

            <div>
              <label className="label">Email Address</label>
              <input className="input" type="email" placeholder="jane@example.com" value={form.email}
                onChange={e => update('email', e.target.value)} required />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input className="input pr-12" type={showPass ? 'text' : 'password'}
                  placeholder="Min. 6 characters" value={form.password}
                  onChange={e => update('password', e.target.value)} required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Graduation Year</label>
                <select className="input" value={form.graduation_year}
                  onChange={e => update('graduation_year', e.target.value)}>
                  <option value="">Select year</option>
                  {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Course / Major</label>
                <select className="input" value={form.course}
                  onChange={e => update('course', e.target.value)}>
                  <option value="">Select course</option>
                  {COURSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-base mt-2">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Create Account <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          <p className="text-center text-slate-500 mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 hover:text-brand-700 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
