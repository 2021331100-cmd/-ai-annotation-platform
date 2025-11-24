import React, { useEffect, useState } from 'react'
import { getTasks, createAnnotation, getLabels, getAnnotations, updateAnnotation, deleteAnnotation, getUserAnnotations } from '../api'
import { useAuthStore } from '../store/authStore'
import AIAnnotationModal from '../components/AIAnnotationModal'
import '../styles/Dashboard.css'

export default function Annotations() {
  const user = useAuthStore((state) => state.user)
  const [tasks, setTasks] = useState([])
  const [labels, setLabels] = useState([])
  const [annotations, setAnnotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [editingAnnotation, setEditingAnnotation] = useState(null)
  const [formData, setFormData] = useState({
    task_id: '',
    content: '',
    label_ids: []
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tasksRes, labelsRes] = await Promise.all([
        getTasks(),
        getLabels()
      ])
      setTasks(tasksRes.data || [])
      setLabels(labelsRes.data || [])
      
      // Get annotations for the current user
      if (user?.id || user?.user_id) {
        const userId = user.user_id || user.id
        const annotationsRes = await getUserAnnotations(userId)
        setAnnotations(annotationsRes.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const userId = user?.user_id || user?.id || 1
      const annotationData = {
        task_id: parseInt(formData.task_id),
        user_id: userId,
        content: formData.content,
        label_ids: formData.label_ids.map(id => parseInt(id))
      }

      if (editingAnnotation) {
        await updateAnnotation(editingAnnotation.annotation_id, {
          content: annotationData.content,
          label_ids: annotationData.label_ids
        }, userId)
        alert('Annotation updated successfully!')
      } else {
        await createAnnotation(annotationData)
        alert('Annotation created successfully!')
      }
      
      setShowModal(false)
      setEditingAnnotation(null)
      setFormData({ task_id: '', content: '', label_ids: [] })
      loadData()
    } catch (error) {
      console.error('Error saving annotation:', error)
      alert('Failed to save annotation: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleEdit = (annotation) => {
    setEditingAnnotation(annotation)
    setFormData({
      task_id: annotation.task_id.toString(),
      content: annotation.content || '',
      label_ids: annotation.labels?.map(l => l.label_id) || []
    })
    setShowModal(true)
  }

  const handleDelete = async (annotationId) => {
    if (!confirm('Are you sure you want to delete this annotation?')) return
    
    try {
      const userId = user?.user_id || user?.id || 1
      await deleteAnnotation(annotationId, userId)
      alert('Annotation deleted successfully!')
      loadData()
    } catch (error) {
      console.error('Error deleting annotation:', error)
      alert('Failed to delete annotation')
    }
  }

  const handleLabelToggle = (labelId) => {
    setFormData(prev => ({
      ...prev,
      label_ids: prev.label_ids.includes(labelId)
        ? prev.label_ids.filter(id => id !== labelId)
        : [...prev.label_ids, labelId]
    }))
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>✏️ Annotations</h1>
          <p>Create and manage your annotations</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => setShowAIModal(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}
          >
            🤖 AI Annotation
          </button>
          <button className="btn btn-primary" onClick={() => {
            setEditingAnnotation(null)
            setFormData({ task_id: '', content: '', label_ids: [] })
            setShowModal(true)
          }}>
            + Create Annotation
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <h3>{annotations.length}</h3>
            <p>Total Annotations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{tasks.length}</h3>
            <p>Available Tasks</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h3>{labels.length}</h3>
            <p>Available Labels</p>
          </div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2>My Annotations</h2>
        {annotations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">✏️</div>
            <h3>No annotations yet</h3>
            <p>Start creating annotations for your assigned tasks</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create First Annotation
            </button>
          </div>
        ) : (
          <div className="annotation-list">
            {annotations.map((annotation) => (
              <div key={annotation.annotation_id} className="annotation-item">
                <div className="annotation-details">
                  <p><strong>Task #{annotation.task_id}</strong></p>
                  <p>{annotation.content || 'No content'}</p>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {annotation.labels?.map(label => (
                      <span key={label.label_id} className="chip">
                        {label.label_name}
                      </span>
                    ))}
                  </div>
                  <small>{new Date(annotation.create_date).toLocaleString()}</small>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(annotation)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(annotation.annotation_id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingAnnotation ? 'Edit Annotation' : 'Create Annotation'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Task *</label>
                  <select
                    className="form-control"
                    value={formData.task_id}
                    onChange={(e) => setFormData({...formData, task_id: e.target.value})}
                    required
                    disabled={editingAnnotation}
                  >
                    <option value="">Select a task</option>
                    {tasks.map(t => (
                      <option key={t.task_id} value={t.task_id}>
                        Task #{t.task_id} - Project {t.project_id}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Annotation Content (JSON Format)</label>
                  <textarea
                    className="form-control"
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows="6"
                    placeholder='{&#10;  "type": "bounding_box",&#10;  "x": 100,&#10;  "y": 150,&#10;  "width": 200,&#10;  "height": 100&#10;}'
                  />
                  <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                    Enter annotation data in JSON format
                  </small>
                </div>
                <div className="form-group">
                  <label>Labels</label>
                  <div className="label-chips">
                    {labels.map(label => (
                      <div
                        key={label.label_id}
                        onClick={() => handleLabelToggle(label.label_id)}
                        className="chip"
                        style={{
                          cursor: 'pointer',
                          background: formData.label_ids.includes(label.label_id) ? '#667eea' : '#e0e0e0',
                          color: formData.label_ids.includes(label.label_id) ? 'white' : '#333'
                        }}
                      >
                        {label.label_name}
                      </div>
                    ))}
                  </div>
                  {labels.length === 0 && (
                    <small style={{ color: '#ff9800' }}>No labels available. Create labels first.</small>
                  )}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAnnotation ? 'Update' : 'Create'} Annotation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Annotation Modal */}
      <AIAnnotationModal
        show={showAIModal}
        onClose={() => setShowAIModal(false)}
        onSuccess={loadData}
        tasks={tasks}
      />
    </div>
  )
}
