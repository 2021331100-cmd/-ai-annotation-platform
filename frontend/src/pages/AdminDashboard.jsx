import React, { useState, useEffect } from 'react'
import { getUsers, getProjects, getTasks, getAuditLogs, getDatasets } from '../api'
import axios from 'axios'
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
  const [datasets, setDatasets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [showLabelsModal, setShowLabelsModal] = useState(false)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const handleViewDataset = async (datasetId) => {
    try {
      const token = localStorage.getItem('token')
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const response = await axios.get(`${API_BASE_URL}/api/datasets/${datasetId}/data`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = response.data
      
      // Create a new window to display the dataset
      const newWindow = window.open('', '_blank', 'width=1000,height=800')
      const dataHtml = Array.isArray(data.data) 
        ? data.data.map((item, i) => `<div style="margin: 10px 0; padding: 10px; background: #f9f9f9; border-radius: 4px;"><strong>Row ${i + 1}:</strong><br/><pre>${JSON.stringify(item, null, 2)}</pre></div>`).join('')
        : `<pre>${JSON.stringify(data, null, 2)}</pre>`
      
      newWindow.document.write(`
        <html>
          <head>
            <title>Dataset: ${data.dataset_name || 'Dataset Viewer'}</title>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                padding: 20px; 
                background: #fff;
                margin: 0;
              }
              h1 { 
                color: #667eea; 
                border-bottom: 3px solid #667eea; 
                padding-bottom: 10px;
              }
              .info { 
                background: #f0f0f0; 
                padding: 10px; 
                border-radius: 5px; 
                margin: 15px 0;
              }
              pre { 
                background: #f5f5f5; 
                padding: 15px; 
                border-radius: 5px; 
                overflow: auto; 
                border: 1px solid #ddd;
                font-size: 13px;
                line-height: 1.4;
              }
            </style>
          </head>
          <body>
            <h1>📁 ${data.dataset_name || 'Dataset'}</h1>
            <div class="info">
              <strong>Format:</strong> ${data.format || 'Unknown'} &nbsp;|&nbsp; 
              <strong>Records:</strong> ${data.total_count || 0}
            </div>
            ${dataHtml}
          </body>
        </html>
      `)
      newWindow.document.close()
    } catch (error) {
      console.error('View dataset error:', error)
      alert('Failed to load dataset: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDeleteDataset = async (datasetId, datasetName) => {
    const confirmed = window.confirm(`Are you sure you want to delete "${datasetName}"? This action cannot be undone.`)
    console.log('Delete confirmation:', confirmed)
    
    if (!confirmed) {
      console.log('Delete cancelled by user')
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('You are not logged in. Please log in again.')
        return
      }
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      const url = `${API_BASE_URL}/api/datasets/${datasetId}`
      
      console.log('DELETE Request:', url)
      console.log('Token:', token ? 'Present' : 'Missing')
      
      const response = await axios.delete(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Delete response:', response.data)
      alert('Dataset deleted successfully!')
      await loadDashboardData() // Reload the dashboard
    } catch (error) {
      console.error('Delete dataset full error:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      
      const errorMessage = error.response?.data?.detail || error.response?.statusText || error.message || 'Unknown error occurred'
      alert(`Failed to delete dataset: ${errorMessage}`)
    }
  }

  const loadDashboardData = async () => {
    try {
      const [usersRes, projectsRes, tasksRes, logsRes, datasetsRes] = await Promise.all([
        getUsers(),
        getProjects(),
        getTasks(),
        getAuditLogs({ limit: 10 }),
        getDatasets(),
      ])

      setStats({
        totalUsers: usersRes.data.length,
        totalProjects: projectsRes.data.length,
        totalTasks: tasksRes.data.length,
        activeUsers: usersRes.data.filter(u => u.is_active).length,
      })

      setRecentActivity(logsRes.data || [])
      setDatasets(datasetsRes.data || [])
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

        <div className="dashboard-section">
          <h2>Uploaded Datasets</h2>
          <div className="datasets-list">
            {datasets.length === 0 ? (
              <p>No datasets uploaded yet</p>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Dataset Name</th>
                      <th>Project</th>
                      <th>File Type</th>
                      <th>Uploaded</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.map((dataset) => (
                      <tr key={dataset.dataset_id}>
                        <td><strong>{dataset.dataset_name}</strong></td>
                        <td>{dataset.project?.project_name || 'N/A'}</td>
                        <td>{dataset.format || 'Unknown'}</td>
                        <td>{new Date(dataset.create_date).toLocaleString()}</td>
                        <td>
                          <span className="status-badge status-active">
                            Active
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', minWidth: '140px' }}>
                            <button 
                              className="btn-sm btn-secondary"
                              onClick={() => handleViewDataset(dataset.dataset_id)}
                              title="View Dataset"
                              style={{ flex: '1 1 auto', minWidth: '60px' }}
                            >
                              👁️ View
                            </button>
                            <button 
                              className="btn-sm btn-danger"
                              onClick={() => handleDeleteDataset(dataset.dataset_id, dataset.dataset_name)}
                              title="Delete Dataset"
                              style={{ flex: '1 1 auto', minWidth: '60px' }}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
