/**
 * Centralized API service using axios.
 * All backend calls go through this module.
 */
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─────────────────────────────────────────────
// Auth
// ─────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/api/auth/register', data),
  login: (data) => api.post('/api/auth/login', data),
  getMe: () => api.get('/api/auth/me'),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/api/auth/reset-password', data),
}

// ─────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────
export const usersAPI = {
  getDashboard: () => api.get('/api/users/dashboard'),
  getProfile: (id) => api.get(`/api/users/${id}`),
  updateProfile: (data) => api.put('/api/users/me', data),
  uploadProfilePic: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/users/me/profile-picture', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  uploadResume: (file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post('/api/users/me/resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  searchUsers: (params) => api.get('/api/users/search', { params }),
}

// ─────────────────────────────────────────────
// Connections
// ─────────────────────────────────────────────
export const connectionsAPI = {
  sendRequest: (receiverId) => api.post('/api/connections/request', { receiver_id: receiverId }),
  respond: (id, action) => api.put(`/api/connections/${id}/respond`, { action }),
  getPending: () => api.get('/api/connections/pending'),
  getMyConnections: () => api.get('/api/connections/my-connections'),
  remove: (id) => api.delete(`/api/connections/${id}`),
}

// ─────────────────────────────────────────────
// Messages
// ─────────────────────────────────────────────
export const messagesAPI = {
  send: (data) => api.post('/api/messages/send', data),
  getConversation: (userId, params) => api.get(`/api/messages/conversation/${userId}`, { params }),
  getConversations: () => api.get('/api/messages/conversations'),
}

// ─────────────────────────────────────────────
// Jobs
// ─────────────────────────────────────────────
export const jobsAPI = {
  listJobs: (params) => api.get('/api/jobs/', { params }),
  getJob: (id) => api.get(`/api/jobs/${id}`),
  createJob: (data) => api.post('/api/jobs/', data),
  updateJob: (id, data) => api.put(`/api/jobs/${id}`, data),
  deleteJob: (id) => api.delete(`/api/jobs/${id}`),
  apply: (jobId, data) => api.post(`/api/jobs/${jobId}/apply`, data),
  getApplicants: (jobId) => api.get(`/api/jobs/${jobId}/applicants`),
  updateAppStatus: (appId, status) => api.put(`/api/jobs/applications/${appId}/status`, { status }),
  getMyApplications: () => api.get('/api/jobs/my-applications/list'),
  getMyJobs: () => api.get('/api/jobs/my-jobs'),
}

// ─────────────────────────────────────────────
// Notifications
// ─────────────────────────────────────────────
export const notificationsAPI = {
  list: (params) => api.get('/api/notifications/', { params }),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
  markAllRead: () => api.put('/api/notifications/mark-all-read'),
}

export default api
