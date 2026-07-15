import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Request interceptor — attach JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sg_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sg_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),

  register: (name: string, email: string, password: string) =>
    api.post('/auth/register', { name, email, password }),

  getProfile: () => api.get('/auth/profile'),

  updateProfile: (data: { name?: string; email?: string; avatar?: string }) =>
    api.put('/auth/profile', data),

  changePassword: (oldPassword: string, newPassword: string) =>
    api.put('/auth/change-password', { oldPassword, newPassword }),
}

// ─── Documents ───────────────────────────────────────────────────────────────
export const documentsApi = {
  upload: (formData: FormData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  getAll: () => api.get('/documents'),

  deleteDoc: (id: string) => api.delete(`/documents/${id}`),
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatApi = {
  createChat: (title?: string) => api.post('/chat', { title }),

  getHistory: () => api.get('/chat/history'),

  getMessages: (chatId: string) => api.get(`/chat/${chatId}/messages`),

  sendMessage: (chatId: string, content: string) =>
    api.post(`/chat/${chatId}/message`, { content }),

  deleteChat: (id: string) => api.delete(`/chat/${id}`),

  renameChat: (id: string, title: string) => api.put(`/chat/${id}/rename`, { title }),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  getDashboard: () => api.get('/dashboard'),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  getAnalytics: () => api.get('/analytics'),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  getUsers: () => api.get('/users'),

  updateRole: (id: string, role: string) => api.put(`/users/${id}/role`, { role }),

  deleteUser: (id: string) => api.delete(`/users/${id}`),
}

export default api
