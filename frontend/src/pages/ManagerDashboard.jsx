import React, { useState, useEffect } from 'react'
import { getTasks, getProjects, getUsers, getDatasets } from '../api'
import axios from 'axios'
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
  const [datasets, setDatasets] = useState([])
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
    if (!window.confirm(`Are you sure you want to delete "${datasetName}"? This action cannot be undone.`)) {
      return
    }
    
    try {
      const token = localStorage.getItem('token')
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      
      console.log('Deleting dataset:', datasetId)
      
      const response = await axios.delete(`${API_BASE_URL}/api/datasets/${datasetId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Delete response:', response.data)
      alert('Dataset deleted successfully!')
      loadDashboardData() // Reload the dashboard
    } catch (error) {
      console.error('Delete dataset error:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error occurred'
      alert(`Failed to delete dataset: ${errorMessage}`)
    }
  }

  const loadDashboardData = async () => {
    try {
      const [projectsRes, tasksRes, usersRes, datasetsRes] = await Promise.all([
        getProjects(),
        getTasks(),
        getUsers(),
        getDatasets(),
      ])

      setProjects(projectsRes.data || [])
      setTasks(tasksRes.data || [])
      setTeam(usersRes.data.filter(u => u.role !== 'Admin') || [])
      setDatasets(datasetsRes.data || [])

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
