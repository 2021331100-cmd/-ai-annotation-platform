import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Authentication
export const signup = (data) => api.post('/auth/signup', data)
export const login = (username, password) => {
  // OAuth2PasswordRequestForm expects application/x-www-form-urlencoded
  const formData = new URLSearchParams()
  formData.append('username', username)
  formData.append('password', password)
  return api.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  })
}

// Users
export const getUsers = (params = {}) => api.get('/users/', { params })
export const createUser = (data) => api.post('/users/', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const deleteUser = (id) => api.delete(`/users/${id}`)

// Projects
export const getProjects = (params = {}) => api.get('/projects/', { params })
export const getProject = (id) => api.get(`/projects/${id}`)
export const createProject = (data) => api.post('/projects/', data)
export const updateProject = (id, data) => api.put(`/projects/${id}`, data)
export const deleteProject = (id) => api.delete(`/projects/${id}`)

// Datasets
export const getDatasets = () => api.get('/datasets/')
export const createDataset = (data) => api.post('/datasets/', data)
export const uploadDataset = (formData) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  
  // Create a new axios instance without the interceptor for this specific call
  const uploadAxios = axios.create({
    baseURL: apiUrl,
    timeout: 30000, // 30 second timeout
  })
  
  return uploadAxios.post('/datasets/upload/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (formData._onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        formData._onProgress(percentCompleted)
      }
    }
  })
}

// Labels
export const getLabels = () => api.get('/labels/')
export const createLabel = (data) => api.post('/labels/', data)
export const updateLabel = (id, data) => api.put(`/labels/${id}`, data)
export const deleteLabel = (id) => api.delete(`/labels/${id}`)

// Tasks
export const getTasks = (params = {}) => api.get('/tasks/', { params })
export const getTask = (id) => api.get(`/tasks/${id}`)
export const createTask = (data) => api.post('/tasks/', data)

// Task Assignments
export const createAssignment = (data) => api.post('/assignments/', data)
export const getUserAssignments = (userId) => api.get(`/assignments/user/${userId}`)
export const getTaskAssignments = (taskId) => api.get(`/assignments/task/${taskId}`)

// Annotations
export const getAnnotations = (params = {}) => api.get('/annotations/task/' + params.taskId)
export const createAnnotation = (data) => api.post('/annotations/', data)
export const updateAnnotation = (id, data, userId) => api.put(`/annotations/${id}?user_id=${userId}`, data)
export const deleteAnnotation = (id, userId) => api.delete(`/annotations/${id}?user_id=${userId}`)
export const getUserAnnotations = (userId) => api.get(`/annotations/user/${userId}`)

// Reviews
export const getReviews = (annotationId) => api.get(`/reviews/annotation/${annotationId}`)
export const createReview = (data) => api.post('/reviews/', data)
export const updateReview = (id, data) => api.put(`/reviews/${id}`, data)
export const getReviewerReviews = (reviewerId) => api.get(`/reviews/reviewer/${reviewerId}`)

// Notifications
export const getUserNotifications = (userId, unreadOnly = false) => 
  api.get(`/notifications/user/${userId}`, { params: { unread_only: unreadOnly } })
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`)

// Audit Logs
export const getAuditLogs = (params = {}) => api.get('/audit-logs/', { params })

// AI Annotation & Review
export const aiAutoAnnotate = (data, annotationType, labels = null, maxLength = 100) => 
  api.post('/ai/annotate', { data, annotation_type: annotationType, labels, max_length: maxLength })
export const aiBatchAnnotate = (datasetId, annotationType, labels = null) => 
  api.post('/ai/annotate/batch', { dataset_id: datasetId, annotation_type: annotationType, labels })
export const aiAutoReview = (annotationId, annotationData) => 
  api.post('/ai/review', { annotation_id: annotationId, annotation_data: annotationData })
export const aiQualityCheck = (annotationData) => 
  api.post('/ai/review/quality', { annotation_data: annotationData })
export const aiConsistencyCheck = (annotations) => 
  api.post('/ai/review/consistency', { annotations })

export default api
