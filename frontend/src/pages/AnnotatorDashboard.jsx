import React, { useState, useEffect } from 'react'
import { getUserAssignments, getUserAnnotations, getTasks } from '../api'
import { useAuthStore } from '../store/authStore'
import AIAnnotationModal from '../components/AIAnnotationModal'
import NotificationBell from '../components/NotificationBell'
import '../styles/Dashboard.css'

function AnnotatorDashboard() {
  const user = useAuthStore((state) => state.user)
  const [assignments, setAssignments] = useState([])
  const [annotations, setAnnotations] = useState([])
  const [stats, setStats] = useState({
    assignedTasks: 0,
    completedAnnotations: 0,
    pendingTasks: 0,
    approved: 0,
  })
  const [selectedTask, setSelectedTask] = useState(null)
  const [showAIModal, setShowAIModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id || user?.user_id) {
      loadDashboardData()
    } else {
      setLoading(false)
      setError('User not logged in properly')
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const userId = user.user_id || user.id
      
      const [assignmentsRes, annotationsRes] = await Promise.all([
        getUserAssignments(userId),
        getUserAnnotations(userId),
      ])

      setAssignments(assignmentsRes.data || [])
      setAnnotations(annotationsRes.data || [])

      const pending = (assignmentsRes.data || []).filter(a => a.status === 'Pending').length
      const approved = (annotationsRes.data || []).filter(a => a.status === 'Approved').length

      setStats({
        assignedTasks: (assignmentsRes.data || []).length,
        completedAnnotations: (annotationsRes.data || []).length,
        pendingTasks: pending,
        approved: approved,
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError(error.response?.data?.detail || error.message || 'Failed to load dashboard data')
      // Set empty data so the UI still renders
      setAssignments([])
      setAnnotations([])
    } finally {
      setLoading(false)
    }
  }

  const handleAnnotateWithAI = (task) => {
    setSelectedTask(task)
    setShowAIModal(true)
  }

  if (loading) return <div className="loading">Loading dashboard...</div>

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>✏️ Annotator Dashboard</h1>
            <p>Welcome back, {user?.username}!</p>
          </div>
          <NotificationBell />
        </div>
        <div className="error-message" style={{ margin: '20px', padding: '20px', background: '#fee', borderRadius: '8px' }}>
          <p>⚠️ {error}</p>
          <button className="btn btn-primary" onClick={loadDashboardData}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>✏️ Annotator Dashboard</h1>
          <p>Welcome back, {user?.username}!</p>
        </div>
        <NotificationBell />
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.assignedTasks}</h3>
            <p>Assigned Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedAnnotations}</h3>
            <p>Completed Annotations</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pendingTasks}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>🤖 AI-Assisted Annotation</h2>
          <div className="ai-feature-card">
            <p>Use AI to help annotate your tasks faster and more accurately</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAIModal(true)}
            >
              Start AI Annotation
            </button>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>My Task Assignments</h2>
          <div className="task-list">
            {assignments.length === 0 ? (
              <p>No tasks assigned yet</p>
            ) : (
              assignments.map((assignment) => (
                <div key={assignment.assignment_id} className="task-card">
                  <div className="task-header">
                    <h3>Task #{assignment.task_id}</h3>
                    {assignment.task && assignment.task.project && (
                      <span className="project-badge">
                        {assignment.task.project.project_name}
                      </span>
                    )}
                    <span className={`status-badge status-${(assignment.status || 'pending').toLowerCase()}`}>
                      {assignment.status || 'Pending'}
                    </span>
                  </div>
                  {assignment.due_date && (
                    <p><strong>Due:</strong> {new Date(assignment.due_date).toLocaleDateString()}</p>
                  )}
                  <div className="task-actions">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => window.location.href = `/annotations?task=${assignment.task_id}`}
                    >
                      View Task
                    </button>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAnnotateWithAI(assignment)}
                    >
                      🤖 AI Assist
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recent Annotations</h2>
          <div className="annotation-list">
              {annotations.length === 0 ? (
              <p>No annotations yet</p>
            ) : (
              annotations.slice(0, 5).map((annotation) => (
                <div key={annotation.annotation_id} className="annotation-item">
                  <div className="annotation-details">
                    <p><strong>Task #{annotation.task_id}</strong></p>
                    <p>{annotation.content ? (typeof annotation.content === 'string' ? annotation.content.substring(0,100) : JSON.stringify(annotation.content).substring(0,100)) : 'No data'}</p>
                    <small>{new Date(annotation.create_date || annotation.created_at || Date.now()).toLocaleString()}</small>
                  </div>
                  <span className={`status-badge status-${(annotation.status || 'pending').toLowerCase()}`}>
                    {annotation.status || 'Pending'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {showAIModal && (
        <AIAnnotationModal
          task={selectedTask}
          onClose={() => {
            setShowAIModal(false)
            setSelectedTask(null)
            loadDashboardData()
          }}
        />
      )}
    </div>
  )
}

export default AnnotatorDashboard
