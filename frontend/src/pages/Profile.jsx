import React, { useState, useRef } from 'react'
import { toast } from 'react-toastify'
import { Camera, Upload, Pencil, Save, X, ExternalLink, FileText, Linkedin, Github, MapPin, Phone, GraduationCap, Briefcase } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { usersAPI } from '../services/api'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    college: user?.college || '',
    skills: user?.skills || '',
    bio: user?.bio || '',
    linkedin: user?.linkedin || '',
    github: user?.github || '',
    experience: user?.experience || '',
    location: user?.location || '',
    graduation_year: user?.graduation_year || '',
    course: user?.course || '',
  })
  const [saving, setSaving] = useState(false)
  const [uploadingPic, setUploadingPic] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const picRef = useRef()
  const resumeRef = useRef()

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await usersAPI.updateProfile({
        ...form,
        graduation_year: form.graduation_year ? parseInt(form.graduation_year) : undefined,
      })
      updateUser(res.data)
      setEditing(false)
      toast.success('Profile updated!')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePicUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingPic(true)
    try {
      const res = await usersAPI.uploadProfilePic(file)
      updateUser(res.data)
      toast.success('Profile picture updated!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploadingPic(false)
    }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingResume(true)
    try {
      const res = await usersAPI.uploadResume(file)
      updateUser(res.data)
      toast.success('Resume uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploadingResume(false)
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold text-slate-900">My Profile</h1>
        {!editing ? (
          <button onClick={() => setEditing(true)} className="btn-secondary flex items-center gap-2">
            <Pencil size={16} /> Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setEditing(false)} className="btn-ghost flex items-center gap-2">
              <X size={16} /> Cancel
            </button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              Save Changes
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Avatar + quick info */}
        <div className="space-y-4">
          <div className="card p-6 text-center">
            {/* Avatar */}
            <div className="relative w-28 h-28 mx-auto mb-4">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-brand-100 flex items-center justify-center">
                {user?.profile_pic ? (
                  <img src={user.profile_pic} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-brand-600 text-4xl font-display font-bold">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>
              <button
                onClick={() => picRef.current?.click()}
                disabled={uploadingPic}
                className="absolute bottom-1 right-1 w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white hover:bg-brand-700 transition-colors shadow-md"
              >
                {uploadingPic ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Camera size={14} />}
              </button>
              <input ref={picRef} type="file" accept="image/*" className="hidden" onChange={handlePicUpload} />
            </div>

            <h2 className="text-xl font-display font-bold text-slate-900">{user?.name}</h2>
            <p className="text-slate-500 text-sm">{user?.course || 'Alumni'}</p>
            {user?.graduation_year && (
              <p className="text-slate-400 text-xs mt-1">Class of {user.graduation_year}</p>
            )}

            {user?.location && (
              <p className="text-slate-500 text-sm mt-2 flex items-center justify-center gap-1">
                <MapPin size={13} /> {user.location}
              </p>
            )}

            {/* Social links */}
            <div className="flex justify-center gap-3 mt-4">
              {user?.linkedin && (
                <a href={user.linkedin} target="_blank" rel="noreferrer"
                  className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors">
                  <Linkedin size={16} />
                </a>
              )}
              {user?.github && (
                <a href={user.github} target="_blank" rel="noreferrer"
                  className="w-9 h-9 bg-slate-100 text-slate-700 rounded-lg flex items-center justify-center hover:bg-slate-200 transition-colors">
                  <Github size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Resume */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-brand-600" /> Resume
            </h3>
            {user?.resume ? (
              <div className="space-y-2">
                <a href={user.resume} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm font-medium">
                  <ExternalLink size={14} /> View Resume
                </a>
                <button onClick={() => resumeRef.current?.click()} disabled={uploadingResume}
                  className="btn-secondary w-full text-sm flex items-center justify-center gap-1.5">
                  <Upload size={14} /> Replace
                </button>
              </div>
            ) : (
              <button onClick={() => resumeRef.current?.click()} disabled={uploadingResume}
                className="btn-primary w-full text-sm flex items-center justify-center gap-1.5">
                {uploadingResume ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Upload size={14} />}
                Upload Resume
              </button>
            )}
            <input ref={resumeRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeUpload} />
            <p className="text-slate-400 text-xs mt-2">PDF or DOCX, max 10MB</p>
          </div>
        </div>

        {/* Right: Editable details */}
        <div className="lg:col-span-2 space-y-4">
          {/* Bio */}
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">About</h3>
            {editing ? (
              <textarea className="input resize-none" rows={4} placeholder="Tell us about yourself..."
                value={form.bio} onChange={e => update('bio', e.target.value)} />
            ) : (
              <p className="text-slate-600 text-sm leading-relaxed">
                {user?.bio || <span className="text-slate-400 italic">No bio added yet.</span>}
              </p>
            )}
          </div>

          {/* Personal Info */}
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Full Name', key: 'name', icon: null },
                { label: 'Phone', key: 'phone', icon: Phone },
                { label: 'Location', key: 'location', icon: MapPin },
                { label: 'College / University', key: 'college', icon: GraduationCap },
                { label: 'Course / Major', key: 'course', icon: null },
                { label: 'Graduation Year', key: 'graduation_year', icon: null, type: 'number' },
              ].map(({ label, key, icon: Icon, type }) => (
                <div key={key}>
                  <label className="label flex items-center gap-1.5">
                    {Icon && <Icon size={13} className="text-slate-400" />} {label}
                  </label>
                  {editing ? (
                    <input className="input" type={type || 'text'} value={form[key]}
                      onChange={e => update(key, e.target.value)} placeholder={label} />
                  ) : (
                    <p className="text-slate-700 text-sm py-2">
                      {user?.[key] || <span className="text-slate-400">—</span>}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Skills</h3>
            {editing ? (
              <textarea className="input resize-none" rows={2}
                placeholder="e.g., Python, React, Machine Learning, SQL"
                value={form.skills} onChange={e => update('skills', e.target.value)} />
            ) : (
              <div className="flex flex-wrap gap-2">
                {user?.skills ? user.skills.split(',').map(s => s.trim()).filter(Boolean).map(skill => (
                  <span key={skill} className="badge bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1 text-sm">{skill}</span>
                )) : <span className="text-slate-400 text-sm italic">No skills added yet.</span>}
              </div>
            )}
          </div>

          {/* Experience */}
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Briefcase size={16} className="text-brand-600" /> Experience
            </h3>
            {editing ? (
              <textarea className="input resize-none" rows={4}
                placeholder="Describe your work experience..."
                value={form.experience} onChange={e => update('experience', e.target.value)} />
            ) : (
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                {user?.experience || <span className="text-slate-400 italic">No experience added yet.</span>}
              </p>
            )}
          </div>

          {/* Social */}
          <div className="card p-6">
            <h3 className="font-semibold text-slate-800 mb-4">Social Links</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'LinkedIn URL', key: 'linkedin', icon: Linkedin },
                { label: 'GitHub URL', key: 'github', icon: Github },
              ].map(({ label, key, icon: Icon }) => (
                <div key={key}>
                  <label className="label flex items-center gap-1.5">
                    <Icon size={13} className="text-slate-400" /> {label}
                  </label>
                  {editing ? (
                    <input className="input" type="url" value={form[key]}
                      onChange={e => update(key, e.target.value)} placeholder={`https://...`} />
                  ) : (
                    user?.[key] ? (
                      <a href={user[key]} target="_blank" rel="noreferrer"
                        className="text-brand-600 hover:underline text-sm flex items-center gap-1">
                        {user[key].replace('https://', '')} <ExternalLink size={12} />
                      </a>
                    ) : <p className="text-slate-400 text-sm py-2">—</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
