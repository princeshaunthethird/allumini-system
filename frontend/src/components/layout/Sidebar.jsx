import React, { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, User, Briefcase, MessageSquare,
  Users, LogOut, Bell, GraduationCap, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { notificationsAPI } from '../../services/api'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/network', icon: Users, label: 'Network' },
  { to: '/messages', icon: MessageSquare, label: 'Messages' },
  { to: '/jobs', icon: Briefcase, label: 'Jobs' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMsgs, setUnreadMsgs] = useState(0)

  useEffect(() => {
    notificationsAPI.list({ unread_only: true, limit: 1 })
      .then(res => setUnreadCount(res.data.length > 0 ? res.data.length : 0))
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const avatarUrl = user?.profile_pic
    ? (user.profile_pic.startsWith('http') ? user.profile_pic : user.profile_pic)
    : null

  return (
    <aside
      className={`
        relative flex flex-col h-screen
        bg-gradient-to-b from-slate-900 to-slate-950
        border-r border-white/5
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-20' : 'w-64'}
      `}
    >
      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-8 z-10 w-6 h-6 rounded-full bg-slate-800 border border-white/10
                   flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg"
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/5">
        <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-brand-600/20">
          <GraduationCap size={18} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in overflow-hidden">
            <p className="text-white font-display font-semibold text-base leading-tight">AlumniConnect</p>
            <p className="text-slate-500 text-xs">Your Network</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-link group relative ${isActive ? 'active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <div className="relative">
              <Icon size={20} className="flex-shrink-0" />
              {label === 'Messages' && unreadMsgs > 0 && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-brand-500 rounded-full" />
              )}
            </div>
            {!collapsed && <span className="animate-fade-in">{label}</span>}

            {/* Tooltip when collapsed */}
            {collapsed && (
              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-sm rounded-lg
                              opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap
                              border border-white/10 shadow-xl z-50">
                {label}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-3 pb-4 space-y-1 border-t border-white/5 pt-3">
        {/* Notifications */}
        <button
          onClick={() => navigate('/dashboard')}
          className="sidebar-link w-full group relative"
          title={collapsed ? 'Notifications' : undefined}
        >
          <div className="relative">
            <Bell size={20} className="flex-shrink-0" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse-slow" />
            )}
          </div>
          {!collapsed && <span>Notifications</span>}
          {!collapsed && unreadCount > 0 && (
            <span className="ml-auto bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User card */}
        <div
          className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer hover:bg-white/5 transition-colors`}
          onClick={() => navigate('/profile')}
        >
          <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-brand-600 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-sm font-semibold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0 animate-fade-in">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-slate-500 text-xs truncate">{user?.course || 'Alumni'}</p>
            </div>
          )}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-500/10 group relative"
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span className="animate-fade-in">Logout</span>}
        </button>
      </div>
    </aside>
  )
}
