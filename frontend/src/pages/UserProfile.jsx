import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ArrowLeft, MessageSquare, UserPlus, UserCheck, MapPin, GraduationCap, Linkedin, Github, FileText, ExternalLink, Briefcase } from 'lucide-react'
import { usersAPI, connectionsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'

export default function UserProfile() {
  const { id } = useParams()
  const { user: me } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [connStatus, setConnStatus] = useState('none')
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    usersAPI.getProfile(id).then(res => setProfile(res.data)).catch(() => navigate('/network'))
    usersAPI.searchUsers({ q: '' }).then(res => {
      const found = res.data.find(u => u.id === parseInt(id))
      if (found) setConnStatus(found.connection_status || 'none')
    }).catch(() => {})
  }, [id])

  const handleConnect = async () => {
    setConnecting(true)
    try {
      await connectionsAPI.sendRequest(parseInt(id))
      setConnStatus('pending')
      toast.success('Connection request sent!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to send request')
    } finally {
      setConnecting(false)
    }
  }

  if (!profile) return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const skills = profile.skills ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : []
  const isSelf = me?.id === profile.id

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="btn-ghost flex items-center gap-2 mb-6 -ml-2">
        <ArrowLeft size={18} /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="space-y-4">
          <div className="card p-6 text-center">
            <div className="w-28 h-28 mx-auto rounded-2xl overflow-hidden bg-brand-100 flex items-center justify-center mb-4">
              {profile.profile_pic
                ? <img src={profile.profile_pic} alt={profile.name} className="w-full h-full object-cover" />
                : <span className="text-brand-600 text-4xl font-display font-bold">{profile.name?.charAt(0)}</span>
              }
            </div>
            <h1 className="text-xl font-display font-bold text-slate-900">{profile.name}</h1>
            <p className="text-slate-500 text-sm">{profile.course || 'Alumni'}</p>
            {profile.graduation_year && <p className="text-slate-400 text-xs mt-1">Class of {profile.graduation_year}</p>}
            {profile.location && (
              <p className="text-slate-500 text-sm mt-2 flex items-center justify-center gap-1">
                <MapPin size={13} /> {profile.location}
              </p>
            )}

            {!isSelf && (
              <div className="flex gap-2 mt-4">
                {connStatus === 'none' && (
                  <button onClick={handleConnect} disabled={connecting}
                    className="btn-primary text-sm flex items-center gap-1.5 flex-1 justify-center">
                    {connecting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <UserPlus size={14} />}
                    Connect
                  </button>
                )}
                {connStatus === 'pending' && (
                  <span className="badge bg-amber-50 text-amber-700 flex-1 justify-center py-2">Request Sent</span>
                )}
                {connStatus === 'accepted' && (
                  <button onClick={() => navigate(`/messages/${profile.id}`)}
                    className="btn-primary text-sm flex items-center gap-1.5 flex-1 justify-center">
                    <MessageSquare size={14} /> Message
                  </button>
                )}
              </div>
            )}
            {isSelf && (
              <button onClick={() => navigate('/profile')} className="btn-secondary text-sm mt-4 w-full">
                Edit Profile
              </button>
            )}

            <div className="flex justify-center gap-3 mt-4">
              {profile.linkedin && (
                <a href={profile.linkedin} target="_blank" rel="noreferrer"
                  className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors">
                  <Linkedin size={16} />
                </a>
              )}
              {profile.github && (
                <a href={profile.github} target="_blank" rel="noreferrer"
                  className="w-9 h-9 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <Github size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Resume */}
          {profile.resume && (
            <div className="card p-5">
              <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2 text-sm">
                <FileText size={15} className="text-brand-600" /> Resume
              </h3>
              <a href={profile.resume} target="_blank" rel="noreferrer"
                className="btn-secondary text-sm w-full flex items-center justify-center gap-2">
                <ExternalLink size={14} /> View Resume
              </a>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="lg:col-span-2 space-y-4">
          {profile.bio && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-800 mb-3">About</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{profile.bio}</p>
            </div>
          )}

          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-y-4 text-sm">
              {[
                ['College', profile.college, GraduationCap],
                ['Course', profile.course, null],
                ['Graduation', profile.graduation_year ? `Class of ${profile.graduation_year}` : null, null],
                ['Phone', profile.phone, null],
              ].map(([label, value, Icon]) => value ? (
                <div key={label}>
                  <p className="text-slate-400 text-xs mb-0.5 flex items-center gap-1">
                    {Icon && <Icon size={11} />} {label}
                  </p>
                  <p className="text-slate-700 font-medium">{value}</p>
                </div>
              ) : null).filter(Boolean)}
            </div>
          </div>

          {skills.length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-800 mb-3">Skills</h2>
              <div className="flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s} className="badge bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1">{s}</span>
                ))}
              </div>
            </div>
          )}

          {profile.experience && (
            <div className="card p-6">
              <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <Briefcase size={16} className="text-brand-600" /> Experience
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">{profile.experience}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
