import React, { useEffect, useState } from 'react'
import { getTasks, createTask, getProjects, getDatasets, createAssignment, getUsers } from '../api'

export default function Tasks() {
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [datasets, setDatasets] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [formData, setFormData] = useState({
    project_id: '',
    dataset_id: '',
    due_date: ''
  })
  const [assignData, setAssignData] = useState({
    user_id: '',
    due_date: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tasksRes, projectsRes, datasetsRes, usersRes] = await Promise.all([
        getTasks(),
        getProjects(),
        getDatasets(),
        getUsers()
      ])
      setTasks(tasksRes.data)
      setProjects(projectsRes.data)
      setDatasets(datasetsRes.data)
      setUsers(usersRes.data)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createTask({
        ...formData,
        project_id: parseInt(formData.project_id),
        dataset_id: parseInt(formData.dataset_id)
      })
      setShowModal(false)
      setFormData({ project_id: '', dataset_id: '', due_date: '' })
      loadData()
      alert('Task created successfully!')
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task')
    }
  }

  const handleAssign = async (e) => {
    e.preventDefault()
    try {
      await createAssignment({
        task_id: selectedTask.task_id,
        user_id: parseInt(assignData.user_id),
        due_date: assignData.due_date || null
      })
      setShowAssignModal(false)
      setAssignData({ user_id: '', due_date: '' })
      alert('Task assigned successfully!')
    } catch (error) {
      console.error('Error assigning task:', error)
      alert('Failed to assign task')
    }
  }

  const openAssignModal = (task) => {
    setSelectedTask(task)
    setShowAssignModal(true)
  }

  if (loading) {
    return <div className="loading">Loading tasks...</div>
  }

  return (
    <div>
      <div className="action-bar">
        <div>
          <h1 className="page-title">Annotation Tasks</h1>
          <p className="page-subtitle">Create and manage annotation tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Create Task
        </button>
      </div>

      <div className="card">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3 className="empty-state-title">No Tasks Yet</h3>
            <p className="empty-state-text">Create annotation tasks for your projects</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create Task
            </button>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Task ID</th>
                <th>Project ID</th>
                <th>Dataset ID</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.task_id}>
                  <td><strong>#{task.task_id}</strong></td>
                  <td>{task.project_id}</td>
                  <td>{task.dataset_id}</td>
                  <td>{task.due_date || '-'}</td>
                  <td>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '5px 10px', fontSize: '12px' }}
                      onClick={() => openAssignModal(task)}
                    >
                      Assign User
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
            <h2 className="modal-header">Create New Task</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Project</label>
                <select
                  className="form-control"
                  value={formData.project_id}
                  onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                  required
                >
                  <option value="">Select a project</option>
                  {projects.map(p => (
                    <option key={p.project_id} value={p.project_id}>{p.project_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Dataset</label>
                <select
                  className="form-control"
                  value={formData.dataset_id}
                  onChange={(e) => setFormData({...formData, dataset_id: e.target.value})}
                  required
                >
                  <option value="">Select a dataset</option>
                  {datasets.map(d => (
                    <option key={d.dataset_id} value={d.dataset_id}>{d.dataset_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={formData.due_date}
                  onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && selectedTask && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-header">Assign Task #{selectedTask.task_id}</h2>
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label className="form-label">User</label>
                <select
                  className="form-control"
                  value={assignData.user_id}
                  onChange={(e) => setAssignData({...assignData, user_id: e.target.value})}
                  required
                >
                  <option value="">Select a user</option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.username} ({u.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={assignData.due_date}
                  onChange={(e) => setAssignData({...assignData, due_date: e.target.value})}
                />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
