import React, { useState, useEffect } from 'react'
import { getUsers, getProjects, getTasks, getAuditLogs } from '../api'
import { useAuthStore } from '../store/authStore'
import DatasetUploadModal from '../components/DatasetUploadModal'
import TaskAssignmentModal from '../components/TaskAssignmentModal'
import AuditLogModal from '../components/AuditLogModal'
import NotificationBell from '../components/NotificationBell'
import LabelsModal from '../components/LabelsModal'
import '../styles/Dashboard.css'

function AdminDashboard() {
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalTasks: 0,
    activeUsers: 0,
  })
  const [recentActivity, setRecentActivity] = useState([])
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
      const [usersRes, projectsRes, tasksRes, logsRes] = await Promise.all([
        getUsers(),
        getProjects(),
        getTasks(),
        getAuditLogs({ limit: 10 }),
      ])

      setStats({
        totalUsers: usersRes.data.length,
        totalProjects: projectsRes.data.length,
        totalTasks: tasksRes.data.length,
        activeUsers: usersRes.data.filter(u => u.is_active).length,
      })

      setRecentActivity(logsRes.data || [])
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
          <h1>👑 Admin Dashboard</h1>
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
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total Users</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalProjects}</h3>
            <p>Projects</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{stats.totalTasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.activeUsers}</h3>
            <p>Active Users</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Recent Activity</h2>
          <div className="activity-list">
            {recentActivity.length === 0 ? (
              <p>No recent activity</p>
            ) : (
              recentActivity.map((log, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">📝</div>
                  <div className="activity-details">
                    <p>{log.action}</p>
                    <small>{new Date(log.timestamp).toLocaleString()}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button className="action-btn" onClick={() => window.location.href = '/users'}>
              <span>👥</span> Manage Users
            </button>
            <button className="action-btn" onClick={() => window.location.href = '/projects'}>
              <span>📊</span> Manage Projects
            </button>
            <button className="action-btn" onClick={() => setShowUploadModal(true)}>
              <span>📤</span> Upload Dataset
            </button>
            <button className="action-btn" onClick={() => setShowAssignModal(true)}>
              <span>📋</span> Assign Task
            </button>
            <button className="action-btn" onClick={() => window.location.href = '/tasks'}>
              <span>📝</span> View All Tasks
            </button>
            <button className="action-btn" onClick={() => window.location.href = '/reviews'}>
              <span>🔍</span> Review Queue
            </button>
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

export default AdminDashboard
