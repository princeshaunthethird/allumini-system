import React, { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Briefcase, Plus, Search, MapPin, Clock, Users, X, ChevronDown, Eye } from 'lucide-react'
import { jobsAPI } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { formatDistanceToNow } from 'date-fns'

const JOB_TYPES = ['full_time', 'part_time', 'internship', 'contract', 'remote']
const TYPE_COLORS = {
  full_time: 'bg-green-50 text-green-700',
  part_time: 'bg-blue-50 text-blue-700',
  internship: 'bg-purple-50 text-purple-700',
  contract: 'bg-amber-50 text-amber-700',
  remote: 'bg-teal-50 text-teal-700',
}

function JobCard({ job, onApply, onViewApplicants, isOwner }) {
  const [showApply, setShowApply] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [applying, setApplying] = useState(false)

  const handleApply = async () => {
    setApplying(true)
    try {
      await onApply(job.id, coverLetter)
      setShowApply(false)
      setCoverLetter('')
    } finally {
      setApplying(false)
    }
  }

  return (
    <div className="card p-6 hover:shadow-md transition-all duration-200 animate-slide-up">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-semibold text-slate-900 text-base">{job.title}</h3>
          <p className="text-slate-600 text-sm font-medium">{job.company}</p>
        </div>
        <span className={`badge text-xs flex-shrink-0 ${TYPE_COLORS[job.job_type] || 'bg-slate-100 text-slate-600'}`}>
          {job.job_type.replace('_', ' ')}
        </span>
      </div>

      <p className="text-slate-500 text-sm line-clamp-2 mb-4 leading-relaxed">{job.description}</p>

      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400 mb-4">
        {job.location && <span className="flex items-center gap-1"><MapPin size={11} /> {job.location}</span>}
        {job.salary_range && <span className="flex items-center gap-1">💰 {job.salary_range}</span>}
        <span className="flex items-center gap-1"><Clock size={11} />
          {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
        </span>
        <span className="flex items-center gap-1"><Users size={11} /> {job.application_count} applicants</span>
      </div>

      {showApply && (
        <div className="mb-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
          <label className="label">Cover Letter (optional)</label>
          <textarea className="input resize-none" rows={3} placeholder="Why are you a great fit for this role?"
            value={coverLetter} onChange={e => setCoverLetter(e.target.value)} />
          <div className="flex gap-2 mt-3">
            <button onClick={handleApply} disabled={applying} className="btn-primary text-sm flex items-center gap-1.5">
              {applying ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
              Submit Application
            </button>
            <button onClick={() => setShowApply(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {isOwner ? (
          <button onClick={() => onViewApplicants(job)} className="btn-secondary text-sm flex items-center gap-1.5">
            <Eye size={14} /> View Applicants ({job.application_count})
          </button>
        ) : job.has_applied ? (
          <span className="badge bg-green-50 text-green-700 px-3 py-1.5 text-sm">✓ Applied</span>
        ) : (
          <button onClick={() => setShowApply(!showApply)} className="btn-primary text-sm">
            Apply Now
          </button>
        )}
      </div>
    </div>
  )
}

function PostJobModal({ onClose, onCreated }) {
  const [form, setForm] = useState({ title: '', company: '', location: '', job_type: 'full_time', description: '', requirements: '', salary_range: '', deadline: '' })
  const [saving, setSaving] = useState(false)
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, deadline: form.deadline || undefined }
      const res = await jobsAPI.createJob(payload)
      onCreated(res.data)
      toast.success('Job posted successfully!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to post job')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-display font-bold text-slate-900">Post a Job</h2>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Job Title *</label>
              <input className="input" required value={form.title} onChange={e => update('title', e.target.value)} placeholder="Software Engineer" />
            </div>
            <div>
              <label className="label">Company *</label>
              <input className="input" required value={form.company} onChange={e => update('company', e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <label className="label">Location</label>
              <input className="input" value={form.location} onChange={e => update('location', e.target.value)} placeholder="Remote / City" />
            </div>
            <div>
              <label className="label">Job Type</label>
              <select className="input" value={form.job_type} onChange={e => update('job_type', e.target.value)}>
                {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Salary Range</label>
              <input className="input" value={form.salary_range} onChange={e => update('salary_range', e.target.value)} placeholder="₹8-12 LPA" />
            </div>
            <div>
              <label className="label">Application Deadline</label>
              <input className="input" type="date" value={form.deadline} onChange={e => update('deadline', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Description *</label>
            <textarea className="input resize-none" rows={4} required value={form.description}
              onChange={e => update('description', e.target.value)} placeholder="Describe the role, responsibilities..." />
          </div>
          <div>
            <label className="label">Requirements</label>
            <textarea className="input resize-none" rows={3} value={form.requirements}
              onChange={e => update('requirements', e.target.value)} placeholder="Required skills and qualifications..." />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus size={16} />}
              Post Job
            </button>
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ApplicantsModal({ job, onClose }) {
  const [applicants, setApplicants] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    jobsAPI.getApplicants(job.id)
      .then(res => setApplicants(res.data))
      .finally(() => setLoading(false))
  }, [job.id])

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-display font-bold text-slate-900">Applicants</h2>
            <p className="text-slate-500 text-sm">{job.title} at {job.company}</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2"><X size={18} /></button>
        </div>
        <div className="p-4 divide-y divide-slate-50">
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : applicants.length === 0 ? (
            <p className="text-center text-slate-400 py-8">No applicants yet</p>
          ) : applicants.map(app => (
            <div key={app.id} className="py-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-100 flex items-center justify-center text-brand-700 font-semibold flex-shrink-0">
                {app.applicant?.name?.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800">{app.applicant?.name}</p>
                <p className="text-slate-500 text-sm">{app.applicant?.email}</p>
                {app.cover_letter && <p className="text-slate-600 text-sm mt-1 line-clamp-2">{app.cover_letter}</p>}
                <span className={`badge mt-1.5 text-xs ${app.status === 'applied' ? 'bg-blue-50 text-blue-700' : app.status === 'shortlisted' ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {app.status}
                </span>
              </div>
              {app.applicant?.resume && (
                <a href={app.applicant.resume} target="_blank" rel="noreferrer" className="btn-secondary text-xs px-3 py-1.5 flex-shrink-0">CV</a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function Jobs() {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [showPost, setShowPost] = useState(false)
  const [selectedJob, setSelectedJob] = useState(null)
  const [activeTab, setActiveTab] = useState('browse')

  const loadJobs = async () => {
    setLoading(true)
    try {
      const params = { q: search || undefined, job_type: typeFilter || undefined }
      const res = activeTab === 'mine' ? await jobsAPI.getMyJobs() : await jobsAPI.listJobs(params)
      setJobs(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadJobs() }, [search, typeFilter, activeTab])

  const handleApply = async (jobId, coverLetter) => {
    try {
      await jobsAPI.apply(jobId, { job_id: jobId, cover_letter: coverLetter })
      toast.success('Application submitted!')
      setJobs(prev => prev.map(j => j.id === jobId ? { ...j, has_applied: true, application_count: j.application_count + 1 } : j))
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to apply')
      throw err
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900">Job Portal</h1>
          <p className="text-slate-500 mt-1">Discover opportunities from your alumni network</p>
        </div>
        <button onClick={() => setShowPost(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Post Job
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit mb-6">
        {[['browse', 'Browse Jobs'], ['mine', 'My Postings']].map(([val, label]) => (
          <button key={val} onClick={() => setActiveTab(val)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === val ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Filters */}
      {activeTab === 'browse' && (
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="input pl-10" placeholder="Search jobs by title, company..."
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-44" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
          </select>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-16 text-center">
          <Briefcase size={40} className="text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No jobs found</p>
          <p className="text-slate-400 text-sm mt-1">{activeTab === 'mine' ? "You haven't posted any jobs yet." : "Try adjusting your filters."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map(job => (
            <JobCard key={job.id} job={job}
              onApply={handleApply}
              onViewApplicants={setSelectedJob}
              isOwner={job.poster_id === user?.id}
            />
          ))}
        </div>
      )}

      {showPost && <PostJobModal onClose={() => setShowPost(false)} onCreated={j => setJobs(prev => [j, ...prev])} />}
      {selectedJob && <ApplicantsModal job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </div>
  )
}
