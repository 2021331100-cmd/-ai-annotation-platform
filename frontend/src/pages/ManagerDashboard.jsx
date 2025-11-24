import React, { useState, useEffect } from 'react'
import { getTasks, getProjects, getUsers } from '../api'
import { useAuthStore } from '../store/authStore'
import DatasetUploadModal from '../components/DatasetUploadModal'
import TaskAssignmentModal from '../components/TaskAssignmentModal'
import AuditLogModal from '../components/AuditLogModal'
import NotificationBell from '../components/NotificationBell'
import LabelsModal from '../components/LabelsModal'
import '../styles/Dashboard.css'

function ManagerDashboard() {
  const user = useAuthStore((state) => state.user)
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [team, setTeam] = useState([])
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeTasks: 0,
    teamMembers: 0,
    completedTasks: 0,
  })
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [showLabelsModal, setShowLabelsModal] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      const [projectsRes, tasksRes, usersRes] = await Promise.all([
        getProjects(),
        getTasks(),
        getUsers(),
      ])

      setProjects(projectsRes.data || [])
      setTasks(tasksRes.data || [])
      setTeam(usersRes.data.filter(u => u.role !== 'Admin') || [])

      const activeProjects = projectsRes.data.filter(p => p.status === 'Active').length

      setStats({
        totalProjects: activeProjects,
        activeTasks: tasksRes.data.length,
        teamMembers: usersRes.data.length,
        completedTasks: tasksRes.data.filter(t => t.status === 'Completed').length,
      })
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">Loading dashboard...</div>

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>📋 Manager Dashboard</h1>
          <p>Welcome back, {user?.username}!</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <NotificationBell />
          <button 
            onClick={() => setShowLabelsModal(true)} 
            className="btn-primary"
            style={{ padding: '10px 20px' }}
          >
            🏷️ Manage Labels
          </button>
          <button 
            onClick={() => setShowAuditLog(true)} 
            className="btn-primary"
            style={{ padding: '10px 20px' }}
          >
            📋 Audit Logs
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalProjects}</h3>
            <p>Active Projects</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.activeTasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.teamMembers}</h3>
            <p>Team Members</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.completedTasks}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => window.location.href = '/projects'}>
              <span>📊</span> Create Project
            </button>
            <button className="action-btn" onClick={() => setShowUploadModal(true)}>
              <span>📤</span> Upload Dataset
            </button>
            <button className="action-btn" onClick={() => setShowAssignModal(true)}>
              <span>📋</span> Assign Task
            </button>
            <button className="action-btn" onClick={() => window.location.href = '/users'}>
              <span>👥</span> Manage Team
            </button>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Active Projects</h2>
          <div className="project-list">
            {projects.slice(0, 5).map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <h3>{project.name}</h3>
                  <span className={`status-badge status-${project.status.toLowerCase()}`}>
                    {project.status}
                  </span>
                </div>
                <p>{project.description}</p>
                <div className="project-footer">
                  <small>Created: {new Date(project.created_at).toLocaleDateString()}</small>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => window.location.href = `/projects?id=${project.id}`}
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Team Overview</h2>
          <div className="team-grid">
            {team.slice(0, 6).map((member) => (
              <div key={member.id} className="team-card">
                <div className="team-avatar">{member.username[0].toUpperCase()}</div>
                <h4>{member.username}</h4>
                <p className="team-role">{member.role}</p>
                <span className={`status-dot ${member.is_active ? 'active' : 'inactive'}`}></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showUploadModal && (
        <DatasetUploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={loadDashboardData}
        />
      )}

      {showAssignModal && (
        <TaskAssignmentModal
          onClose={() => setShowAssignModal(false)}
          onSuccess={loadDashboardData}
        />
      )}

      {showAuditLog && (
        <AuditLogModal
          isOpen={showAuditLog}
          onClose={() => setShowAuditLog(false)}
        />
      )}

      {showLabelsModal && (
        <LabelsModal
          show={showLabelsModal}
          onClose={() => setShowLabelsModal(false)}
        />
      )}
    </div>
  )
}

export default ManagerDashboard
