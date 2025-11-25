import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import '../styles/Dashboard.css'

function CrowdManagement() {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('leaderboard')
  const [leaderboard, setLeaderboard] = useState([])
  const [languages, setLanguages] = useState([])
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedAnnotator, setSelectedAnnotator] = useState(null)
  const [annotatorStats, setAnnotatorStats] = useState(null)

  useEffect(() => {
    loadCrowdData()
  }, [activeTab])

  const loadCrowdData = async () => {
    try {
      setLoading(true)
      if (activeTab === 'leaderboard') {
        const res = await axios.get('http://localhost:8000/api/crowd/leaderboard?time_period=all&limit=50')
        setLeaderboard(res.data.leaderboard)
      } else if (activeTab === 'languages') {
        const res = await axios.get('http://localhost:8000/api/crowd/languages')
        setLanguages(res.data.languages)
      } else if (activeTab === 'metrics') {
        const res = await axios.get('http://localhost:8000/api/crowd/metrics')
        setMetrics(res.data)
      }
    } catch (error) {
      console.error('Failed to load crowd data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAnnotatorStats = async (userId) => {
    try {
      const res = await axios.get(`http://localhost:8000/api/crowd/annotator/${userId}/stats?days=30`)
      setAnnotatorStats(res.data)
      setSelectedAnnotator(userId)
    } catch (error) {
      console.error('Failed to load annotator stats:', error)
    }
  }

  if (loading) {
    return <div className="dashboard-container"><p>Loading...</p></div>
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>👥 Crowd Management</h1>
          <p>Manage and monitor your annotation workforce</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'leaderboard', label: '🏆 Leaderboard', icon: '🏆' },
          { id: 'languages', label: '🌍 Languages', icon: '🌍' },
          { id: 'metrics', label: '📊 Metrics', icon: '📊' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === tab.id 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#f0f0f0',
              color: activeTab === tab.id ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="dashboard-section">
          <h2>🏆 Top Performers</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Rank</th>
                  <th style={{ padding: '1rem', textAlign: 'left' }}>Annotator</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Total Annotations</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Quality Score</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Approval Rate</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Annotations/Day</th>
                  <th style={{ padding: '1rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((annotator, index) => (
                  <tr key={annotator.user_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                      {index < 3 ? (
                        <span style={{ fontSize: '1.5rem' }}>
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                        </span>
                      ) : (
                        `#${index + 1}`
                      )}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div>
                        <div style={{ fontWeight: '600' }}>{annotator.username}</div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>{annotator.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>
                      {annotator.total_annotations}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        background: annotator.avg_quality_score >= 8 ? '#d4edda' : annotator.avg_quality_score >= 6 ? '#fff3cd' : '#f8d7da',
                        color: annotator.avg_quality_score >= 8 ? '#155724' : annotator.avg_quality_score >= 6 ? '#856404' : '#721c24',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {annotator.avg_quality_score ? annotator.avg_quality_score.toFixed(1) : 'N/A'}/10
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{
                        background: annotator.approval_rate >= 90 ? '#d4edda' : annotator.approval_rate >= 70 ? '#fff3cd' : '#f8d7da',
                        color: annotator.approval_rate >= 90 ? '#155724' : annotator.approval_rate >= 70 ? '#856404' : '#721c24',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        fontWeight: '600'
                      }}>
                        {annotator.approval_rate ? annotator.approval_rate.toFixed(1) : '0'}%
                      </span>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center', color: '#667eea', fontWeight: '600' }}>
                      {annotator.annotations_per_day ? annotator.annotations_per_day.toFixed(1) : '0'}
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <button
                        onClick={() => loadAnnotatorStats(annotator.user_id)}
                        style={{
                          padding: '0.5rem 1rem',
                          borderRadius: '6px',
                          border: 'none',
                          background: '#667eea',
                          color: '#fff',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Annotator Details Modal */}
          {annotatorStats && (
            <div style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000
            }}>
              <div style={{
                background: '#fff',
                padding: '2rem',
                borderRadius: '12px',
                maxWidth: '800px',
                width: '90%',
                maxHeight: '80vh',
                overflow: 'auto'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <h2>📊 Annotator Performance Details</h2>
                  <button
                    onClick={() => setAnnotatorStats(null)}
                    style={{
                      border: 'none',
                      background: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer'
                    }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                  <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Total Annotations</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                      {annotatorStats.productivity?.total_annotations || 0}
                    </div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Avg Quality Score</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                      {annotatorStats.quality?.avg_quality_score?.toFixed(1) || 'N/A'}/10
                    </div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Approval Rate</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                      {annotatorStats.quality?.approval_rate?.toFixed(1) || '0'}%
                    </div>
                  </div>
                  <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Annotations/Day</div>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea' }}>
                      {annotatorStats.productivity?.annotations_per_day?.toFixed(1) || '0'}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ marginBottom: '1rem' }}>📈 Performance Metrics</h3>
                  <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Active Days:</strong> {annotatorStats.productivity?.active_days || 0}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Total Reviews:</strong> {annotatorStats.quality?.total_reviews || 0}
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Approved:</strong> {annotatorStats.quality?.approved || 0}
                    </div>
                    <div>
                      <strong>Rejected:</strong> {annotatorStats.quality?.rejected || 0}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Languages */}
      {activeTab === 'languages' && (
        <div className="dashboard-section">
          <h2>🌍 Supported Languages ({languages.length})</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
            {languages.map(lang => (
              <div key={lang.code} className="task-card" style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                      {lang.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      Code: {lang.code}
                    </div>
                  </div>
                  <div style={{
                    background: lang.available_annotators > 10 ? '#d4edda' : lang.available_annotators > 5 ? '#fff3cd' : '#f8d7da',
                    color: lang.available_annotators > 10 ? '#155724' : lang.available_annotators > 5 ? '#856404' : '#721c24',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    fontWeight: 'bold',
                    fontSize: '1.1rem'
                  }}>
                    {lang.available_annotators}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics */}
      {activeTab === 'metrics' && metrics && (
        <div className="dashboard-section">
          <h2>📊 Overall Crowd Metrics</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="task-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>👥</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.25rem' }}>
                {metrics.total_annotators}
              </div>
              <div style={{ color: '#666' }}>Total Annotators</div>
            </div>
            <div className="task-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>✅</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.25rem' }}>
                {metrics.total_annotations}
              </div>
              <div style={{ color: '#666' }}>Total Annotations</div>
            </div>
            <div className="task-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>⭐</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.25rem' }}>
                {metrics.avg_quality_score?.toFixed(1)}/10
              </div>
              <div style={{ color: '#666' }}>Avg Quality Score</div>
            </div>
            <div className="task-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📈</div>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.25rem' }}>
                {metrics.avg_approval_rate?.toFixed(1)}%
              </div>
              <div style={{ color: '#666' }}>Avg Approval Rate</div>
            </div>
          </div>

          <div className="task-card" style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>🎯 Productivity Insights</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                <strong>Most Productive Annotator:</strong> {metrics.top_performer?.username || 'N/A'} 
                ({metrics.top_performer?.annotations || 0} annotations)
              </div>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                <strong>Average Annotations per Annotator:</strong> {metrics.avg_annotations_per_annotator?.toFixed(1) || 0}
              </div>
              <div style={{ background: '#f8f9fa', padding: '1rem', borderRadius: '8px' }}>
                <strong>Active Annotators (Last 30 Days):</strong> {metrics.active_annotators || 0}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CrowdManagement
