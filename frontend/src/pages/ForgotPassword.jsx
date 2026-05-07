import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { GraduationCap, ArrowLeft, Mail } from 'lucide-react'
import { authAPI } from '../services/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [resetToken, setResetToken] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await authAPI.forgotPassword(email)
      setSent(true)
      setResetToken(res.data.reset_token || '')
      toast.success('Reset instructions sent!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="card p-8">
          <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center mb-6">
            <GraduationCap size={24} className="text-white" />
          </div>

          {!sent ? (
            <>
              <h1 className="text-2xl font-display font-bold text-slate-900 mb-2">Reset your password</h1>
              <p className="text-slate-500 mb-6">Enter your email and we'll send you a reset link.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <input className="input" type="email" placeholder="you@example.com"
                    value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Mail size={18} /> Send Reset Link</>}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail size={28} className="text-green-600" />
              </div>
              <h2 className="text-xl font-display font-bold text-slate-900 mb-2">Check your email</h2>
              <p className="text-slate-500 text-sm mb-4">
                A password reset link has been sent to <strong>{email}</strong>
              </p>
              {resetToken && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-left mb-4">
                  <p className="text-amber-700 text-xs font-medium mb-1">Dev Mode — Reset Token:</p>
                  <code className="text-amber-800 text-xs break-all font-mono">{resetToken}</code>
                </div>
              )}
            </div>
          )}

          <Link to="/login" className="flex items-center gap-2 text-slate-500 hover:text-slate-700 text-sm mt-6 font-medium">
            <ArrowLeft size={16} /> Back to login
          </Link>
        </div>
      </div>
    </div>
  )
}
