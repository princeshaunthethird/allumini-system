import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Search, UserPlus, UserCheck, UserX, MessageSquare, Users, Clock } from 'lucide-react'
import { connectionsAPI, usersAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

function AlumniCard({ person, onConnect, onAccept, onReject, onMessage }) {
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setLoading(true)
    try { await onConnect(person.id) }
    finally { setLoading(false) }
  }

  const statusBadge = {
    accepted: <span className="badge bg-green-50 text-green-700 flex items-center gap-1"><UserCheck size={11} /> Connected</span>,
    pending: <span className="badge bg-amber-50 text-amber-700 flex items-center gap-1"><Clock size={11} /> Pending</span>,
  }

  return (
    <div className="card p-5 flex flex-col gap-3 hover:shadow-md transition-all duration-200 animate-slide-up">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-display font-bold text-lg flex-shrink-0 overflow-hidden">
          {person.profile_pic
            ? <img src={person.profile_pic} alt={person.name} className="w-full h-full object-cover" />
            : person.name?.charAt(0)?.toUpperCase()
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 truncate">{person.name}</p>
          <p className="text-slate-500 text-xs truncate">{person.course || 'Alumni'}{person.graduation_year ? ` · ${person.graduation_year}` : ''}</p>
          {person.college && <p className="text-slate-400 text-xs truncate">{person.college}</p>}
        </div>
        {statusBadge[person.connection_status]}
      </div>

      {person.skills && (
        <div className="flex flex-wrap gap-1">
          {person.skills.split(',').map(s => s.trim()).filter(Boolean).slice(0, 3).map(skill => (
            <span key={skill} className="badge bg-slate-100 text-slate-600 text-xs">{skill}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        {person.connection_status === 'none' && (
          <button onClick={handleConnect} disabled={loading}
            className="btn-primary text-xs flex items-center gap-1.5 py-2">
            {loading ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={13} />}
            Connect
          </button>
        )}
        {person.connection_status === 'accepted' && (
          <button onClick={() => onMessage(person.id)} className="btn-secondary text-xs flex items-center gap-1.5 py-2">
            <MessageSquare size={13} /> Message
          </button>
        )}
        <button onClick={() => onMessage(person.id, true)} className="btn-ghost text-xs py-2">
          View Profile
        </button>
      </div>
    </div>
  )
}

function PendingCard({ conn, onAccept, onReject }) {
  const [loading, setLoading] = useState(null)

  return (
    <div className="card p-4 flex items-center gap-3">
      <div className="w-11 h-11 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold overflow-hidden flex-shrink-0">
        {conn.requester?.profile_pic
          ? <img src={conn.requester.profile_pic} alt={conn.requester.name} className="w-full h-full object-cover" />
          : conn.requester?.name?.charAt(0)?.toUpperCase()
        }
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 text-sm">{conn.requester?.name}</p>
        <p className="text-slate-500 text-xs">{conn.requester?.course || 'Alumni'}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={async () => { setLoading('accept'); await onAccept(conn.id); setLoading(null) }}
          disabled={loading === 'accept'}
          className="w-8 h-8 bg-brand-600 hover:bg-brand-700 text-white rounded-lg flex items-center justify-center transition-colors">
          {loading === 'accept' ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserCheck size={15} />}
        </button>
        <button onClick={async () => { setLoading('reject'); await onReject(conn.id); setLoading(null) }}
          disabled={loading === 'reject'}
          className="w-8 h-8 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center justify-center transition-colors">
          {loading === 'reject' ? <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" /> : <UserX size={15} />}
        </button>
      </div>
    </div>
  )
}

export default function Network() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('discover')
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [connections, setConnections] = useState([])
  const [pending, setPending] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    connectionsAPI.getMyConnections().then(res => setConnections(res.data)).catch(() => {})
    connectionsAPI.getPending().then(res => setPending(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab !== 'discover') return
    setLoading(true)
    const timer = setTimeout(() => {
      usersAPI.searchUsers({ q: search || undefined, limit: 20 })
        .then(res => setResults(res.data))
        .catch(() => {})
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timer)
  }, [search, activeTab])

  const handleConnect = async (receiverId) => {
    try {
      await connectionsAPI.sendRequest(receiverId)
      toast.success('Connection request sent!')
      setResults(prev => prev.map(p => p.id === receiverId ? { ...p, connection_status: 'pending' } : p))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send request')
    }
  }

  const handleAccept = async (connId) => {
    await connectionsAPI.respond(connId, 'accept')
    toast.success('Connection accepted!')
    const conn = pending.find(c => c.id === connId)
    setPending(prev => prev.filter(c => c.id !== connId))
    if (conn?.requester) setConnections(prev => [...prev, conn.requester])
  }

  const handleReject = async (connId) => {
    await connectionsAPI.respond(connId, 'reject')
    setPending(prev => prev.filter(c => c.id !== connId))
    toast.success('Request declined')
  }

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold text-slate-900">Network</h1>
        <p className="text-slate-500 mt-1">Grow your professional circle</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {[
          ['discover', 'Discover', results.length],
          ['connections', 'My Connections', connections.length],
          ['pending', 'Pending', pending.length],
        ].map(([val, label, count]) => (
          <button key={val} onClick={() => setActiveTab(val)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5
              ${activeTab === val ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
            {count > 0 && <span className={`text-xs rounded-full px-1.5 py-0.5 ${activeTab === val ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-500'}`}>{count}</span>}
          </button>
        ))}
      </div>

      {/* Discover */}
      {activeTab === 'discover' && (
        <>
          <div className="relative max-w-md mb-6">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search by name, skills, or course..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />)}
            </div>
          ) : results.length === 0 ? (
            <div className="card p-16 text-center">
              <Users size={40} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No alumni found</p>
              <p className="text-slate-400 text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {results.map(person => (
                <AlumniCard key={person.id} person={person}
                  onConnect={handleConnect}
                  onMessage={(id, isProfile) => isProfile ? navigate(`/profile/${id}`) : navigate(`/messages/${id}`)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* My Connections */}
      {activeTab === 'connections' && (
        connections.length === 0 ? (
          <div className="card p-16 text-center">
            <Users size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No connections yet</p>
            <p className="text-slate-400 text-sm mt-1">Discover and connect with alumni</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {connections.map(conn => (
              <div key={conn.id} className="card p-5 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-lg overflow-hidden flex-shrink-0">
                    {conn.profile_pic ? <img src={conn.profile_pic} alt={conn.name} className="w-full h-full object-cover" /> : conn.name?.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{conn.name}</p>
                    <p className="text-slate-500 text-xs">{conn.course || 'Alumni'}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate(`/messages/${conn.id}`)} className="btn-secondary text-xs flex items-center gap-1.5 py-2 flex-1 justify-center">
                    <MessageSquare size={13} /> Message
                  </button>
                  <button onClick={() => navigate(`/profile/${conn.id}`)} className="btn-ghost text-xs py-2 px-3">Profile</button>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Pending requests */}
      {activeTab === 'pending' && (
        pending.length === 0 ? (
          <div className="card p-16 text-center">
            <UserCheck size={40} className="text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No pending requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl">
            {pending.map(conn => (
              <PendingCard key={conn.id} conn={conn} onAccept={handleAccept} onReject={handleReject} />
            ))}
          </div>
        )
      )}
    </div>
  )
}
