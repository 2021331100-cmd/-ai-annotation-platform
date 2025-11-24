import React, { useState, useEffect } from 'react'
import { getLabels, createLabel, updateLabel, deleteLabel, getProjects } from '../api'
import '../styles/Modal.css'

function LabelsModal({ show, onClose }) {
  const [labels, setLabels] = useState([])
  const [projects, setProjects] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingLabel, setEditingLabel] = useState(null)
  const [formData, setFormData] = useState({
    label_name: '',
    project_id: ''
  })

  useEffect(() => {
    if (show) {
      loadData()
    }
  }, [show])

  const loadData = async () => {
    try {
      const [labelsRes, projectsRes] = await Promise.all([
        getLabels(),
        getProjects()
      ])
      setLabels(labelsRes.data || [])
      setProjects(projectsRes.data || [])
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.label_name || !formData.project_id) {
      alert('Please fill all required fields')
      return
    }

    try {
      if (editingLabel) {
        await updateLabel(editingLabel.label_id, formData)
        alert('Label updated successfully!')
      } else {
        await createLabel(formData)
        alert('Label created successfully!')
      }
      
      setShowForm(false)
      setEditingLabel(null)
      setFormData({ label_name: '', project_id: '' })
      loadData()
    } catch (error) {
      console.error('Error saving label:', error)
      alert('Failed to save label: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleEdit = (label) => {
    setEditingLabel(label)
    setFormData({
      label_name: label.label_name,
      project_id: label.project_id.toString()
    })
    setShowForm(true)
  }

  const handleDelete = async (labelId) => {
    if (!confirm('Are you sure you want to delete this label?')) return
    
    try {
      await deleteLabel(labelId)
      alert('Label deleted successfully!')
      loadData()
    } catch (error) {
      console.error('Error deleting label:', error)
      alert('Failed to delete label')
    }
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingLabel(null)
    setFormData({ label_name: '', project_id: '' })
  }

  if (!show) return null

  return (
    <div className="modal-overlay" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="modal-content" style={{ 
        maxWidth: '850px', 
        maxHeight: '90vh', 
        overflow: 'auto',
        animation: 'slideUp 0.3s ease-out'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '2rem',
          paddingBottom: '1rem',
          borderBottom: '3px solid transparent',
          borderImage: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%) 1'
        }}>
          <div>
            <h2 style={{ 
              margin: 0,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.75rem',
              fontWeight: '700'
            }}>🏷️ Manage Labels</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
              Create and organize labels for your annotation projects
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '2rem',
              cursor: 'pointer',
              color: '#999',
              transition: 'all 0.2s',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#f0f0f0'
              e.target.style.color = '#333'
              e.target.style.transform = 'rotate(90deg)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none'
              e.target.style.color = '#999'
              e.target.style.transform = 'rotate(0deg)'
            }}
          >
            ×
          </button>
        </div>

        {!showForm ? (
          <>
            <button
              onClick={() => setShowForm(true)}
              style={{
                padding: '0.875rem 1.75rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: '700',
                marginBottom: '1.5rem',
                fontSize: '1rem',
                transition: 'all 0.3s',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'
              }}
            >
              + Create New Label
            </button>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {labels.length === 0 ? (
                <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
                  No labels found. Create your first label!
                </p>
              ) : (
                labels.map(label => (
                  <div
                    key={label.label_id}
                    style={{
                      background: 'linear-gradient(135deg, #f8f9fa 0%, #fff 100%)',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '2px solid #e0e0e0',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)'
                      e.currentTarget.style.borderColor = '#667eea'
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.15)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.borderColor = '#e0e0e0'
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span
                          style={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: '#fff',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            fontWeight: '600'
                          }}
                        >
                          {label.label_name}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>
                        Project: {projects.find(p => p.project_id === label.project_id)?.project_name || 'Unknown'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleEdit(label)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          border: '1px solid #667eea',
                          background: '#fff',
                          color: '#667eea',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(label.label_id)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          border: '1px solid #dc3545',
                          background: '#fff',
                          color: '#dc3545',
                          cursor: 'pointer',
                          fontWeight: '600',
                          fontSize: '0.9rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.95rem'
              }}>
                Label Name: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <input
                type="text"
                value={formData.label_name}
                onChange={(e) => setFormData({ ...formData, label_name: e.target.value })}
                placeholder="e.g., Person, Object, Location"
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '10px',
                  border: '2px solid #e0e0e0',
                  fontSize: '1rem',
                  transition: 'all 0.3s'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0'
                  e.target.style.boxShadow = 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.75rem', 
                fontWeight: '600',
                color: '#333',
                fontSize: '0.95rem'
              }}>
                Project: <span style={{ color: '#dc3545' }}>*</span>
              </label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                required
                style={{
                  width: '100%',
                  padding: '0.875rem',
                  borderRadius: '10px',
                  border: '2px solid #e0e0e0',
                  fontSize: '1rem',
                  transition: 'all 0.3s',
                  background: '#fff',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#667eea'
                  e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e0e0e0'
                  e.target.style.boxShadow = 'none'
                }}
              >
                <option value="">Select a project</option>
                {projects.map(project => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.project_name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'flex-end',
              marginTop: '2rem',
              paddingTop: '1.5rem',
              borderTop: '2px solid #f0f0f0'
            }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  border: '2px solid #e0e0e0',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem',
                  transition: 'all 0.3s',
                  color: '#666'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#999'
                  e.target.style.color = '#333'
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#e0e0e0'
                  e.target.style.color = '#666'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.875rem 2rem',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '1rem',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)'
                }}
              >
                {editingLabel ? 'Update Label' : 'Create Label'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default LabelsModal
