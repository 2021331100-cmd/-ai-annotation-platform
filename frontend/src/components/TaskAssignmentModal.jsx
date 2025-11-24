import React, { useState, useEffect } from 'react'
import { createAssignment, getTasks, getUsers } from '../api'
import '../styles/Modal.css'

function TaskAssignmentModal({ onClose, onSuccess }) {
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [formData, setFormData] = useState({
    task_id: '',
    assigned_to: '',
    priority: 'Medium',
    due_date: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [tasksRes, usersRes] = await Promise.all([
        getTasks(),
        getUsers(),
      ])
      setTasks(tasksRes.data || [])
      // Filter users to only show annotators
      setUsers(usersRes.data.filter(u => u.role === 'Annotator' || u.role === 'Reviewer') || [])
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const assignmentData = {
        task_id: parseInt(formData.task_id),
        user_id: parseInt(formData.assigned_to),
        assigned_by: 1, // TODO: Get from authenticated user
        status: "Pending",
        due_date: formData.due_date || null,
      }

      await createAssignment(assignmentData)
      alert('Task assigned successfully!')
      onSuccess && onSuccess()
      onClose()
    } catch (error) {
      console.error('Assignment error:', error.response?.data)
      alert('Failed to assign task: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-body">
            <div className="loading">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 Assign Task</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="task_id">Select Task *</label>
              <select
                id="task_id"
                name="task_id"
                value={formData.task_id}
                onChange={handleChange}
                required
                className="form-control"
              >
                <option value="">Choose a task...</option>
                {tasks.map(task => (
                  <option key={task.task_id} value={task.task_id}>
                    Task #{task.task_id} - {task.name || `Project ${task.project_id}`}
                  </option>
                ))}
              </select>
              {tasks.length === 0 && (
                <small className="form-hint text-warning">
                  No tasks available. Create a task first.
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="assigned_to">Assign To *</label>
              <select
                id="assigned_to"
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                required
                className="form-control"
              >
                <option value="">Choose a user...</option>
                {users.map(user => (
                  <option key={user.user_id} value={user.user_id}>
                    {user.username} ({user.role})
                  </option>
                ))}
              </select>
              {users.length === 0 && (
                <small className="form-hint text-warning">
                  No annotators or reviewers available.
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="priority">Priority</label>
              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Low">🟢 Low</option>
                <option value="Medium">🟡 Medium</option>
                <option value="High">🟠 High</option>
                <option value="Critical">🔴 Critical</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="due_date">Due Date (Optional)</label>
              <input
                type="date"
                id="due_date"
                name="due_date"
                value={formData.due_date}
                onChange={handleChange}
                className="form-control"
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="assignment-summary">
              <h4>Assignment Summary</h4>
              <div className="summary-item">
                <span>Task:</span>
                <strong>
                  {formData.task_id 
                    ? tasks.find(t => t.task_id === parseInt(formData.task_id))?.name || `Task #${formData.task_id}`
                    : 'Not selected'}
                </strong>
              </div>
              <div className="summary-item">
                <span>Assigned to:</span>
                <strong>
                  {formData.assigned_to 
                    ? users.find(u => u.user_id === parseInt(formData.assigned_to))?.username
                    : 'Not selected'}
                </strong>
              </div>
              <div className="summary-item">
                <span>Priority:</span>
                <strong>{formData.priority}</strong>
              </div>
              {formData.due_date && (
                <div className="summary-item">
                  <span>Due:</span>
                  <strong>{new Date(formData.due_date).toLocaleDateString()}</strong>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting || !formData.task_id || !formData.assigned_to}
            >
              {submitting ? 'Assigning...' : '✅ Assign Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskAssignmentModal
