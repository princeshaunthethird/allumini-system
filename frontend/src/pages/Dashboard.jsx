import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, MessageSquare, Briefcase, Clock, Bell, TrendingUp, ChevronRight, UserCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usersAPI, notificationsAPI, jobsAPI, connectionsAPI } from '../services/api'
import { formatDistanceToNow } from 'date-fns'

function StatCard({ icon: Icon, label, value, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="card p-6 flex items-start gap-4 hover:shadow-md transition-all duration-200 text-left w-full group"
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-3xl font-display font-bold text-slate-900 leading-none mb-1">{value ?? '—'}</p>
        <p className="text-slate-500 text-sm">{label}</p>
      </div>
      <ChevronRight size={16} className="ml-auto text-slate-300 group-hover:text-slate-500 self-center transition-colors" />
    </button>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [recentJobs, setRecentJobs] = useState([])
  const [pendingConns, setPendingConns] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      usersAPI.getDashboard(),
      notificationsAPI.list({ limit: 5 }),
      jobsAPI.listJobs({ limit: 4, active_only: true }),
      connectionsAPI.getPending(),
    ]).then(([s, n, j, p]) => {
      setStats(s.data)
      setNotifications(n.data)
      setRecentJobs(j.data)
      setPendingConns(p.data.slice(0, 3))
    }).finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  if (loading) return (
    <div className="p-8">
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-slate-200 rounded-xl w-64" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-slate-200 rounded-2xl" />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <p className="text-slate-500 text-sm font-medium mb-1">{greeting},</p>
        <h1 className="text-3xl font-display font-bold text-slate-900">
          {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening in your network today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard icon={Users} label="Connections" value={stats?.total_connections}
          color="bg-brand-600" onClick={() => navigate('/network')} />
        <StatCard icon={Clock} label="Pending Requests" value={stats?.pending_requests}
          color="bg-amber-500" onClick={() => navigate('/network')} />
        <StatCard icon={MessageSquare} label="Unread Messages" value={stats?.unread_messages}
          color="bg-emerald-500" onClick={() => navigate('/messages')} />
        <StatCard icon={Briefcase} label="Available Jobs" value={stats?.active_jobs}
          color="bg-violet-500" onClick={() => navigate('/jobs')} />
        <StatCard icon={TrendingUp} label="My Applications" value={stats?.my_applications}
          color="bg-rose-500" onClick={() => navigate('/jobs')} />
        <StatCard icon={Bell} label="Notifications" value={stats?.unread_notifications}
          color="bg-orange-500" onClick={() => {}} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Notifications */}
        <div className="lg:col-span-2">
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Bell size={16} className="text-brand-600" /> Recent Activity
              </h2>
            </div>
            <div className="divide-y divide-slate-50">
              {notifications.length === 0 ? (
                <div className="px-6 py-10 text-center">
                  <Bell size={32} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm">No notifications yet</p>
                </div>
              ) : notifications.map(n => (
                <div key={n.id} className={`flex items-start gap-3 px-6 py-4 hover:bg-slate-50 transition-colors ${!n.is_read ? 'bg-brand-50/50' : ''}`}>
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${!n.is_read ? 'bg-brand-500' : 'bg-transparent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 text-sm leading-snug">{n.message}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Pending connection requests */}
          {pendingConns.length > 0 && (
            <div className="card overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <UserCheck size={15} className="text-brand-600" /> Pending Requests
                </h2>
                <button onClick={() => navigate('/network')} className="text-brand-600 text-xs font-medium hover:text-brand-700">
                  See all
                </button>
              </div>
              <div className="divide-y divide-slate-50">
                {pendingConns.map(conn => (
                  <div key={conn.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm flex-shrink-0">
                      {conn.requester?.name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-800 text-sm font-medium truncate">{conn.requester?.name}</p>
                      <p className="text-slate-400 text-xs">{conn.requester?.course || 'Alumni'}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Jobs */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h2 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Briefcase size={15} className="text-brand-600" /> Latest Jobs
              </h2>
              <button onClick={() => navigate('/jobs')} className="text-brand-600 text-xs font-medium hover:text-brand-700">
                See all
              </button>
            </div>
            <div className="divide-y divide-slate-50">
              {recentJobs.length === 0 ? (
                <p className="text-center text-slate-400 text-sm py-6">No jobs posted yet</p>
              ) : recentJobs.map(job => (
                <div key={job.id} className="px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => navigate('/jobs')}>
                  <p className="text-slate-800 text-sm font-medium truncate">{job.title}</p>
                  <p className="text-slate-500 text-xs">{job.company}</p>
                  <span className={`badge mt-1.5 ${
                    job.job_type === 'full_time' ? 'bg-green-50 text-green-700' :
                    job.job_type === 'internship' ? 'bg-blue-50 text-blue-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {job.job_type.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
