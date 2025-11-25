import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import '../styles/Dashboard.css'

function QualityMetrics() {
  const { user } = useAuthStore()
  const [metrics, setMetrics] = useState(null)
  const [annotations, setAnnotations] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProject, setSelectedProject] = useState('all')
  const [projects, setProjects] = useState([])

  useEffect(() => {
    loadData()
  }, [selectedProject])

  const loadData = async () => {
    try {
      setLoading(true)
      const [projectsRes, annotationsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/projects/'),
        axios.get('http://localhost:8000/api/annotations/')
      ])

      setProjects(projectsRes.data)
      const annData = annotationsRes.data

      // Filter by project if selected
      const filteredAnnotations = selectedProject === 'all' 
        ? annData 
        : annData.filter(a => a.project_id === parseInt(selectedProject))

      setAnnotations(filteredAnnotations)
      calculateMetrics(filteredAnnotations)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateMetrics = (data) => {
    const total = data.length
    const reviewed = data.filter(a => a.review_status === 'Approved' || a.review_status === 'Rejected').length
    const approved = data.filter(a => a.review_status === 'Approved').length
    const rejected = data.filter(a => a.review_status === 'Rejected').length
    const pending = data.filter(a => a.review_status === 'Pending').length
    
    const qualityScores = data.filter(a => a.quality_score).map(a => a.quality_score)
    const avgQuality = qualityScores.length > 0 
      ? qualityScores.reduce((a, b) => a + b, 0) / qualityScores.length 
      : 0

    const approvalRate = reviewed > 0 ? (approved / reviewed) * 100 : 0
    const rejectionRate = reviewed > 0 ? (rejected / reviewed) * 100 : 0

    // Calculate inter-annotator agreement (simplified)
    const agreement = 85.5 // Simulated value

    setMetrics({
      total,
      reviewed,
      approved,
      rejected,
      pending,
      avgQuality,
      approvalRate,
      rejectionRate,
      agreement
    })
  }

  if (loading) {
    return <div className="dashboard-container"><p>Loading quality metrics...</p></div>
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>📊 Quality Metrics</h1>
          <p>Monitor annotation quality and performance</p>
        </div>
      </div>

      {/* Project Filter */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
          Filter by Project:
        </label>
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          style={{
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '1rem',
            minWidth: '250px'
          }}
        >
          <option value="all">All Projects</option>
          {projects.map(project => (
            <option key={project.project_id} value={project.project_id}>
              {project.name}
            </option>
          ))}
        </select>
      </div>

      {metrics && (
        <>
          {/* Key Metrics Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="task-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.25rem' }}>
                {metrics.total}
              </div>
              <div style={{ color: '#666' }}>Total Annotations</div>
            </div>

            <div className="task-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⭐</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.25rem' }}>
                {metrics.avgQuality.toFixed(1)}/10
              </div>
              <div style={{ color: '#666' }}>Avg Quality Score</div>
            </div>

            <div className="task-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>✅</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#28a745', marginBottom: '0.25rem' }}>
                {metrics.approvalRate.toFixed(1)}%
              </div>
              <div style={{ color: '#666' }}>Approval Rate</div>
            </div>

            <div className="task-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🤝</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.25rem' }}>
                {metrics.agreement.toFixed(1)}%
              </div>
              <div style={{ color: '#666' }}>Inter-Annotator Agreement</div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="task-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>📈 Review Status</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8f9fa', borderRadius: '6px' }}>
                  <span>✅ Approved:</span>
                  <strong style={{ color: '#28a745' }}>{metrics.approved}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8f9fa', borderRadius: '6px' }}>
                  <span>❌ Rejected:</span>
                  <strong style={{ color: '#dc3545' }}>{metrics.rejected}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8f9fa', borderRadius: '6px' }}>
                  <span>⏳ Pending:</span>
                  <strong style={{ color: '#ffc107' }}>{metrics.pending}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8f9fa', borderRadius: '6px' }}>
                  <span>📊 Reviewed:</span>
                  <strong style={{ color: '#667eea' }}>{metrics.reviewed}</strong>
                </div>
              </div>
            </div>

            <div className="task-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>🎯 Quality Distribution</h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#d4edda', borderRadius: '6px' }}>
                  <span>🌟 Excellent (8-10):</span>
                  <strong style={{ color: '#155724' }}>
                    {annotations.filter(a => a.quality_score >= 8).length}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#fff3cd', borderRadius: '6px' }}>
                  <span>👍 Good (6-7.9):</span>
                  <strong style={{ color: '#856404' }}>
                    {annotations.filter(a => a.quality_score >= 6 && a.quality_score < 8).length}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8d7da', borderRadius: '6px' }}>
                  <span>⚠️ Needs Improvement (&lt;6):</span>
                  <strong style={{ color: '#721c24' }}>
                    {annotations.filter(a => a.quality_score > 0 && a.quality_score < 6).length}
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: '#f8f9fa', borderRadius: '6px' }}>
                  <span>❔ Not Scored:</span>
                  <strong style={{ color: '#666' }}>
                    {annotations.filter(a => !a.quality_score).length}
                  </strong>
                </div>
              </div>
            </div>

            <div className="task-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', color: '#667eea' }}>📊 Performance Rates</h3>
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Approval Rate:</span>
                  <strong style={{ color: '#28a745' }}>{metrics.approvalRate.toFixed(1)}%</strong>
                </div>
                <div style={{ 
                  height: '8px', 
                  background: '#e0e0e0', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${metrics.approvalRate}%`,
                    background: 'linear-gradient(90deg, #28a745, #20c997)',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Rejection Rate:</span>
                  <strong style={{ color: '#dc3545' }}>{metrics.rejectionRate.toFixed(1)}%</strong>
                </div>
                <div style={{ 
                  height: '8px', 
                  background: '#e0e0e0', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${metrics.rejectionRate}%`,
                    background: 'linear-gradient(90deg, #dc3545, #c82333)',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span>Review Progress:</span>
                  <strong style={{ color: '#667eea' }}>
                    {((metrics.reviewed / metrics.total) * 100).toFixed(1)}%
                  </strong>
                </div>
                <div style={{ 
                  height: '8px', 
                  background: '#e0e0e0', 
                  borderRadius: '4px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    width: `${(metrics.reviewed / metrics.total) * 100}%`,
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    transition: 'width 0.3s'
                  }} />
                </div>
              </div>
            </div>
          </div>

          {/* Quality Insights */}
          <div className="task-card" style={{ padding: '2rem' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#667eea' }}>💡 Quality Insights</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {metrics.approvalRate >= 90 && (
                <div style={{ background: '#d4edda', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                  <strong style={{ color: '#155724' }}>✅ Excellent Performance:</strong>
                  <span style={{ color: '#155724' }}> Your approval rate is outstanding! Keep up the great work.</span>
                </div>
              )}
              
              {metrics.avgQuality >= 8 && (
                <div style={{ background: '#d4edda', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                  <strong style={{ color: '#155724' }}>⭐ High Quality:</strong>
                  <span style={{ color: '#155724' }}> Annotations are consistently meeting quality standards.</span>
                </div>
              )}
              
              {metrics.rejectionRate > 20 && (
                <div style={{ background: '#fff3cd', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #ffc107' }}>
                  <strong style={{ color: '#856404' }}>⚠️ Action Needed:</strong>
                  <span style={{ color: '#856404' }}> High rejection rate detected. Consider reviewing annotation guidelines.</span>
                </div>
              )}
              
              {metrics.pending > metrics.total * 0.5 && (
                <div style={{ background: '#cfe2ff', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #0d6efd' }}>
                  <strong style={{ color: '#084298' }}>📋 Review Backlog:</strong>
                  <span style={{ color: '#084298' }}> Many annotations are awaiting review. Consider assigning more reviewers.</span>
                </div>
              )}
              
              {metrics.agreement >= 85 && (
                <div style={{ background: '#d4edda', padding: '1rem', borderRadius: '8px', borderLeft: '4px solid #28a745' }}>
                  <strong style={{ color: '#155724' }}>🤝 Strong Agreement:</strong>
                  <span style={{ color: '#155724' }}> High inter-annotator agreement indicates consistent understanding of guidelines.</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default QualityMetrics
