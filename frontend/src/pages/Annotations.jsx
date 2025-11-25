import React, { useEffect, useState } from 'react'
import { getTasks, createAnnotation, getLabels, getAnnotations, updateAnnotation, deleteAnnotation, getUserAnnotations, getUserAssignments } from '../api'
import { useAuthStore } from '../store/authStore'
import AIAnnotationModal from '../components/AIAnnotationModal'
import OCRModal from '../components/OCRModal'
import '../styles/Dashboard.css'

export default function Annotations() {
  const user = useAuthStore((state) => state.user)
  const [tasks, setTasks] = useState([])
  const [assignedTasks, setAssignedTasks] = useState([])
  const [labels, setLabels] = useState([])
  const [annotations, setAnnotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAIModal, setShowAIModal] = useState(false)
  const [showOCRModal, setShowOCRModal] = useState(false)
  const [editingAnnotation, setEditingAnnotation] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
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
      const labelsRes = await getLabels()
      setLabels(labelsRes.data || [])
      
      // Get user's assigned tasks and annotations
      if (user?.id || user?.user_id) {
        const userId = user.user_id || user.id
        const [assignmentsRes, annotationsRes] = await Promise.all([
          getUserAssignments(userId),
          getUserAnnotations(userId)
        ])
        
        // Extract tasks from assignments
        const assignments = assignmentsRes.data || []
        setAssignedTasks(assignments)
        
        // Get full task details
        const tasksList = assignments.map(a => ({
          task_id: a.task_id,
          assignment_id: a.assignment_id,
          status: a.status,
          due_date: a.due_date,
          project: a.task?.project,
          dataset: a.task?.dataset
        }))
        setTasks(tasksList)
        
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

  const handleOCRTextExtracted = (ocrData) => {
    // Use OCR extracted text as annotation content
    const content = JSON.stringify({
      type: 'ocr_text',
      text: ocrData.text,
      confidence: ocrData.confidence,
      language: ocrData.language,
      word_count: ocrData.words?.length || 0,
      extracted_at: new Date().toISOString()
    }, null, 2)
    
    setFormData(prev => ({ ...prev, content }))
    alert('OCR text extracted! You can now save it as an annotation.')
  }

  if (loading) {
    return <div className="loading">Loading...</div>
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>✏️ My Assigned Tasks & Annotations</h1>
          <p>Annotate your assigned tasks</p>
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
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
            }}
          >
            🤖 AI Annotation
          </button>
          <button 
            onClick={() => setShowOCRModal(true)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              boxShadow: '0 4px 12px rgba(78, 205, 196, 0.3)'
            }}
          >
            🔍 OCR Extract
          </button>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <h3>{tasks.length}</h3>
            <p>Assigned Tasks</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{annotations.length}</h3>
            <p>My Annotations</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <h3>{labels.length}</h3>
            <p>Available Labels</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{tasks.filter(t => t.status === 'Pending').length}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>
      </div>

      {/* Assigned Tasks Section */}
      <div className="dashboard-section">
        <h2>📋 My Assigned Tasks</h2>
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <h3>No tasks assigned yet</h3>
            <p>Wait for a manager to assign tasks to you</p>
          </div>
        ) : (
          <div className="task-list" style={{ display: 'grid', gap: '15px' }}>
            {tasks.map((task) => {
              const taskAnnotations = annotations.filter(a => a.task_id === task.task_id)
              return (
                <div key={task.task_id} className="task-card" style={{ 
                  background: '#fff', 
                  padding: '20px', 
                  borderRadius: '12px', 
                  border: '2px solid #e0e0e0',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#333' }}>
                        Task #{task.task_id}
                      </h3>
                      {task.project && (
                        <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9rem' }}>
                          📁 Project: <strong>{task.project.project_name}</strong>
                        </p>
                      )}
                      {task.due_date && (
                        <p style={{ margin: '5px 0', color: '#ff9800', fontSize: '0.9rem' }}>
                          ⏰ Due: {new Date(task.due_date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <span className={`status-badge status-${(task.status || 'pending').toLowerCase()}`}>
                      {task.status || 'Pending'}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: '15px', padding: '12px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
                      <strong>Annotations:</strong> {taskAnnotations.length} created
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        setSelectedTask(task)
                        setEditingAnnotation(null)
                        setFormData({ task_id: task.task_id.toString(), content: '', label_ids: [] })
                        setShowModal(true)
                      }}
                    >
                      ✏️ Create Annotation
                    </button>
                    <button 
                      className="btn btn-secondary"
                      onClick={() => {
                        setSelectedTask(task)
                        setShowAIModal(true)
                      }}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        color: '#fff'
                      }}
                    >
                      🤖 AI Assist
                    </button>
                    {taskAnnotations.length > 0 && (
                      <button 
                        className="btn btn-sm"
                        onClick={() => {
                          const annotationsList = taskAnnotations.map((a, i) => 
                            `${i+1}. ${a.content ? (typeof a.content === 'string' ? a.content.substring(0, 50) : JSON.stringify(a.content).substring(0, 50)) : 'No content'}...`
                          ).join('\n')
                          alert(`Annotations for Task #${task.task_id}:\n\n${annotationsList}`)
                        }}
                        style={{ background: '#28a745', color: '#fff', border: 'none' }}
                      >
                        📝 View {taskAnnotations.length} Annotation{taskAnnotations.length > 1 ? 's' : ''}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="dashboard-section">
        <h2>📝 All My Annotations</h2>
        {annotations.length === 0 ? (
          <div className="empty-state" style={{ padding: '40px', textAlign: 'center' }}>
            <div className="empty-state-icon" style={{ fontSize: '3rem' }}>✏️</div>
            <h3>No annotations yet</h3>
            <p>Start creating annotations for your assigned tasks above</p>
          </div>
        ) : (
          <div className="annotation-list">
            {annotations.map((annotation) => (
              <div key={annotation.annotation_id} className="annotation-item" style={{
                background: '#fff',
                padding: '20px',
                borderRadius: '12px',
                border: '2px solid #e0e0e0',
                marginBottom: '15px'
              }}>
                <div className="annotation-details" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ 
                      background: '#667eea', 
                      color: '#fff', 
                      padding: '4px 12px', 
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      Task #{annotation.task_id}
                    </span>
                    {tasks.find(t => t.task_id === annotation.task_id)?.project && (
                      <span style={{ color: '#666', fontSize: '0.9rem' }}>
                        {tasks.find(t => t.task_id === annotation.task_id).project.project_name}
                      </span>
                    )}
                  </div>
                  <div style={{ 
                    background: '#f8f9fa', 
                    padding: '12px', 
                    borderRadius: '8px', 
                    marginBottom: '10px',
                    maxHeight: '100px',
                    overflow: 'auto'
                  }}>
                    <pre style={{ margin: 0, fontSize: '0.85rem', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {annotation.content || 'No content'}
                    </pre>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '10px' }}>
                    {annotation.labels?.map(label => (
                      <span key={label.label_id} style={{
                        background: label.color_code || '#4ECDC4',
                        color: '#fff',
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '0.85rem'
                      }}>
                        🏷️ {label.label_name}
                      </span>
                    ))}
                  </div>
                  <small style={{ color: '#999' }}>
                    📅 {new Date(annotation.create_date).toLocaleString()}
                  </small>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => handleEdit(annotation)}
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(annotation.annotation_id)}
                  >
                    🗑️ Delete
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
                        Task #{t.task_id}{t.project ? ` - ${t.project.project_name}` : ''}
                      </option>
                    ))}
                  </select>
                  {tasks.length === 0 && (
                    <small style={{ color: '#ff9800', marginTop: '5px', display: 'block' }}>
                      No assigned tasks available. Ask your manager to assign tasks to you.
                    </small>
                  )}
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
        onClose={() => {
          setShowAIModal(false)
          setSelectedTask(null)
        }}
        onSuccess={loadData}
        tasks={tasks}
        task={selectedTask}
      />

      {/* OCR Modal */}
      <OCRModal
        isOpen={showOCRModal}
        onClose={() => setShowOCRModal(false)}
        onTextExtracted={handleOCRTextExtracted}
      />
    </div>
  )
}
