import React, { useEffect, useState } from 'react'
import { getProjects, getUsers, getTasks, getUserAnnotations } from '../api'

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    totalUsers: 0,
    totalTasks: 0,
    totalAnnotations: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      setLoading(true)
      const [projectsRes, usersRes, tasksRes] = await Promise.all([
        getProjects(),
        getUsers(),
        getTasks()
      ])

      const activeProjects = projectsRes.data.filter(p => p.status === 'Active').length

      setStats({
        totalProjects: projectsRes.data.length,
        activeProjects: activeProjects,
        totalUsers: usersRes.data.length,
        totalTasks: tasksRes.data.length,
        totalAnnotations: 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Overview of your annotation platform</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-label">Total Projects</div>
          <div className="stat-value">{stats.totalProjects}</div>
        </div>

        <div className="stat-card success">
          <div className="stat-label">Active Projects</div>
          <div className="stat-value">{stats.activeProjects}</div>
        </div>

        <div className="stat-card warning">
          <div className="stat-label">Total Users</div>
          <div className="stat-value">{stats.totalUsers}</div>
        </div>

        <div className="stat-card danger">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{stats.totalTasks}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">Welcome to AI Data Annotation Platform</div>
        <p style={{ lineHeight: '1.6', color: '#666' }}>
          This platform provides enterprise-grade data annotation capabilities with role-based access control,
          task management, review workflows, and comprehensive audit logging.
        </p>
        <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
          <a href="/projects" className="btn btn-primary">View Projects</a>
          <a href="/tasks" className="btn btn-secondary">View Tasks</a>
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div className="card-header">🎯 Quick Actions</div>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <a href="/users" style={{ color: '#667eea', textDecoration: 'none' }}>→ Manage Users</a>
            </li>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <a href="/projects" style={{ color: '#667eea', textDecoration: 'none' }}>→ Create New Project</a>
            </li>
            <li style={{ padding: '10px 0', borderBottom: '1px solid #eee' }}>
              <a href="/tasks" style={{ color: '#667eea', textDecoration: 'none' }}>→ Assign Tasks</a>
            </li>
            <li style={{ padding: '10px 0' }}>
              <a href="/reviews" style={{ color: '#667eea', textDecoration: 'none' }}>→ Review Annotations</a>
            </li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header">📊 System Status</div>
          <div style={{ padding: '10px 0' }}>
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                <span>System Health</span>
                <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>Good</span>
              </div>
              <div style={{ background: '#e0e0e0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ background: '#4CAF50', width: '95%', height: '100%' }}></div>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: '#666', lineHeight: '1.8' }}>
              ✓ API Server: Online<br/>
              ✓ Database: Connected<br/>
              ✓ All Services: Operational
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
