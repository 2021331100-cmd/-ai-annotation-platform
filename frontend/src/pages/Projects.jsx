import React, { useEffect, useState } from 'react'
import { getProjects, createProject, deleteProject, exportYOLO, exportVOC, exportCoNLL, exportZIP } from '../api'

export default function Projects() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [exportingProject, setExportingProject] = useState(null)
  const [formData, setFormData] = useState({
    project_name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Pending'
  })

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      const response = await getProjects()
      setProjects(response.data)
    } catch (error) {
      console.error('Error loading projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createProject(formData)
      setShowModal(false)
      setFormData({ project_name: '', description: '', start_date: '', end_date: '', status: 'Pending' })
      loadProjects()
      alert('Project created successfully!')
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this project?')) return
    try {
      await deleteProject(id)
      loadProjects()
      alert('Project deleted successfully!')
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
    }
  }

  const handleExport = async (projectId, format) => {
    try {
      setExportingProject(projectId)
      let response
      let filename
      
      switch(format) {
        case 'yolo':
          response = await exportYOLO(projectId)
          filename = `project_${projectId}_yolo.txt`
          break
        case 'voc':
          response = await exportVOC(projectId)
          filename = `project_${projectId}_voc.xml`
          break
        case 'conll':
          response = await exportCoNLL(projectId)
          filename = `project_${projectId}_conll.txt`
          break
        case 'zip':
          response = await exportZIP(projectId, 'all')
          filename = `project_${projectId}_all_formats.zip`
          break
        default:
          throw new Error('Unknown format')
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      
      alert(`Export successful! Downloaded ${filename}`)
    } catch (error) {
      console.error('Error exporting project:', error)
      alert('Failed to export: ' + (error.response?.data?.detail || error.message))
    } finally {
      setExportingProject(null)
    }
  }

  const getStatusBadgeClass = (status) => {
    const classes = {
      'Pending': 'badge-warning',
      'Active': 'badge-success',
      'Completed': 'badge-info',
      'On Hold': 'badge-danger'
    }
    return classes[status] || 'badge-primary'
  }

  if (loading) {
    return <div className="loading">Loading projects...</div>
  }

  return (
    <div>
      <div className="action-bar">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage annotation projects</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Create Project
        </button>
      </div>

      <div className="card">
        {projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📁</div>
            <h3 className="empty-state-title">No Projects Yet</h3>
            <p className="empty-state-text">Create your first annotation project</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create Project
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Project Name</th>
                <th>Description</th>
                <th>Status</th>
                <th>Start Date</th>
                <th>Created At</th>
                <th>Export</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => (
                <tr key={project.project_id}>
                  <td><strong style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block', maxWidth: '200px'}}>{project.project_name}</strong></td>
                  <td><div style={{maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{project.description || '-'}</div></td>
                  <td>
                    <span className={`badge ${getStatusBadgeClass(project.status)}`}>
                      {project.status}
                    </span>
                  </td>
                  <td style={{whiteSpace: 'nowrap'}}>{project.start_date || '-'}</td>
                  <td style={{whiteSpace: 'nowrap'}}>{new Date(project.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button 
                        className="btn btn-sm" 
                        style={{ padding: '4px 8px', fontSize: '11px', background: '#4CAF50', color: '#fff', border: 'none', borderRadius: '4px', whiteSpace: 'nowrap' }}
                        onClick={() => handleExport(project.project_id, 'yolo')}
                        disabled={exportingProject === project.project_id}
                        title="Export in YOLO format"
                      >
                        📦 YOLO
                      </button>
                      <button 
                        className="btn btn-sm" 
                        style={{ padding: '4px 8px', fontSize: '11px', background: '#2196F3', color: '#fff', border: 'none', borderRadius: '4px', whiteSpace: 'nowrap' }}
                        onClick={() => handleExport(project.project_id, 'voc')}
                        disabled={exportingProject === project.project_id}
                        title="Export in Pascal VOC format"
                      >
                        📄 VOC
                      </button>
                      <button 
                        className="btn btn-sm" 
                        style={{ padding: '4px 8px', fontSize: '11px', background: '#FF9800', color: '#fff', border: 'none', borderRadius: '4px', whiteSpace: 'nowrap' }}
                        onClick={() => handleExport(project.project_id, 'conll')}
                        disabled={exportingProject === project.project_id}
                        title="Export in CoNLL format"
                      >
                        📝 CoNLL
                      </button>
                      <button 
                        className="btn btn-sm" 
                        style={{ padding: '4px 8px', fontSize: '11px', background: '#9C27B0', color: '#fff', border: 'none', borderRadius: '4px', whiteSpace: 'nowrap' }}
                        onClick={() => handleExport(project.project_id, 'zip')}
                        disabled={exportingProject === project.project_id}
                        title="Download all formats as ZIP"
                      >
                        📥 ZIP All
                      </button>
                    </div>
                  </td>
                  <td>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '5px 10px', fontSize: '12px', whiteSpace: 'nowrap' }}
                      onClick={() => handleDelete(project.project_id)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">Create New Project</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Project Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.project_name}
                  onChange={(e) => setFormData({...formData, project_name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Pending">Pending</option>
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
