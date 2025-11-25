import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import axios from 'axios'
import '../styles/Dashboard.css'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export default function AdvancedFeatures() {
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState('active-learning')
  const [loading, setLoading] = useState(false)
  
  // Active Learning state
  const [uncertainSamples, setUncertainSamples] = useState([])
  const [suggestedTasks, setSuggestedTasks] = useState([])
  const [selectedProject, setSelectedProject] = useState(1)
  
  // Quality Metrics state
  const [annotatorMetrics, setAnnotatorMetrics] = useState(null)
  const [projectMetrics, setProjectMetrics] = useState(null)
  
  // Consensus state
  const [consensusData, setConsensusData] = useState(null)
  const [selectedTask, setSelectedTask] = useState(1)
  
  // Export state
  const [exportFormat, setExportFormat] = useState('jsonl')
  const [exportData, setExportData] = useState(null)

  const tabs = [
    { id: 'active-learning', label: '🎯 Active Learning', icon: '🤖' },
    { id: 'version-control', label: '📚 Version Control', icon: '⏮️' },
    { id: 'quality-metrics', label: '📊 Quality Metrics', icon: '📈' },
    { id: 'consensus', label: '🤝 Consensus', icon: '✅' },
    { id: 'export', label: '📤 Export', icon: '💾' }
  ]

  // Active Learning functions
  const loadUncertainSamples = async () => {
    setLoading(true)
    try {
      const response = await axios.get(
        `${API_BASE}/active-learning/uncertain-samples/${selectedProject}?limit=10`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setUncertainSamples(response.data.uncertain_samples || [])
    } catch (error) {
      console.error('Error loading uncertain samples:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSuggestedTasks = async () => {
    setLoading(true)
    try {
      const userId = user?.user_id || user?.id
      const response = await axios.get(
        `${API_BASE}/active-learning/suggest-tasks/${userId}/${selectedProject}?count=5`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setSuggestedTasks(response.data.suggested_tasks || [])
    } catch (error) {
      console.error('Error loading suggested tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Quality Metrics functions
  const loadAnnotatorMetrics = async () => {
    setLoading(true)
    try {
      const userId = user?.user_id || user?.id
      const response = await axios.get(
        `${API_BASE}/metrics/annotator/${userId}?days=30`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setAnnotatorMetrics(response.data)
    } catch (error) {
      console.error('Error loading annotator metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadProjectMetrics = async () => {
    setLoading(true)
    try {
      const response = await axios.get(
        `${API_BASE}/metrics/project/${selectedProject}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setProjectMetrics(response.data)
    } catch (error) {
      console.error('Error loading project metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Consensus functions
  const loadConsensusData = async () => {
    setLoading(true)
    try {
      const [agreementRes, labelsRes] = await Promise.all([
        axios.get(`${API_BASE}/consensus/agreement/${selectedTask}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }),
        axios.get(`${API_BASE}/consensus/labels/${selectedTask}?threshold=0.5`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ])
      setConsensusData({
        agreement: agreementRes.data,
        labels: labelsRes.data
      })
    } catch (error) {
      console.error('Error loading consensus data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Export functions
  const handleExport = async () => {
    setLoading(true)
    try {
      const response = await axios.get(
        `${API_BASE}/export/${exportFormat}/${selectedProject}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      )
      setExportData(response.data)
      
      // Download as file
      const dataStr = JSON.stringify(response.data, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `export_project_${selectedProject}.${exportFormat === 'csv' ? 'json' : exportFormat}`
      link.click()
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Export failed: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>🚀 Advanced Features</h1>
          <p>Cutting-edge AI and analytics tools for data annotation</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #e0e0e0',
        overflowX: 'auto',
        paddingBottom: '10px'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: activeTab === tab.id 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : '#f5f5f5',
              color: activeTab === tab.id ? '#fff' : '#666',
              borderRadius: '12px 12px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem',
              transition: 'all 0.3s',
              whiteSpace: 'nowrap',
              boxShadow: activeTab === tab.id ? '0 -2px 10px rgba(102, 126, 234, 0.3)' : 'none'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Active Learning Tab */}
      {activeTab === 'active-learning' && (
        <div className="dashboard-section">
          <h2>🎯 Active Learning - Smart Task Prioritization</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            AI identifies the most valuable samples to annotate first, improving model performance faster.
          </p>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <input
              type="number"
              value={selectedProject}
              onChange={(e) => setSelectedProject(Number(e.target.value))}
              placeholder="Project ID"
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                width: '150px'
              }}
            />
            <button 
              className="btn btn-primary"
              onClick={loadUncertainSamples}
              disabled={loading}
            >
              {loading ? '⏳ Loading...' : '🔍 Find Uncertain Samples'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={loadSuggestedTasks}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                border: 'none'
              }}
            >
              💡 Get Task Suggestions
            </button>
          </div>

          {uncertainSamples.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3>🎲 Most Uncertain Samples (High Priority)</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                {uncertainSamples.map((sample, idx) => (
                  <div key={idx} style={{
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '2px solid #ff9800',
                    boxShadow: '0 2px 8px rgba(255, 152, 0, 0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Task #{sample.task_id}</strong>
                        <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9rem' }}>
                          Annotations: {sample.annotation_count}
                        </p>
                      </div>
                      <div style={{
                        background: sample.uncertainty_score > 5 ? '#f44336' : '#ff9800',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: '700'
                      }}>
                        Uncertainty: {sample.uncertainty_score.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestedTasks.length > 0 && (
            <div>
              <h3>💡 AI-Recommended Tasks for You</h3>
              <div style={{ display: 'grid', gap: '15px' }}>
                {suggestedTasks.map((task, idx) => (
                  <div key={idx} style={{
                    background: '#fff',
                    padding: '20px',
                    borderRadius: '12px',
                    border: '2px solid #4ECDC4',
                    boxShadow: '0 2px 8px rgba(78, 205, 196, 0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong>Task #{task.task_id}</strong>
                        <p style={{ margin: '5px 0', color: '#666', fontSize: '0.9rem' }}>
                          Current Annotations: {task.annotation_count}
                        </p>
                      </div>
                      <button className="btn btn-sm btn-primary">
                        ✏️ Start Annotating
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Version Control Tab */}
      {activeTab === 'version-control' && (
        <div className="dashboard-section">
          <h2>📚 Version Control - Track Changes</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Complete history of all annotation changes with ability to restore previous versions.
          </p>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            padding: '40px',
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⏮️</div>
            <h3>Version History Available</h3>
            <p>View and restore previous versions from the annotation edit page</p>
          </div>
        </div>
      )}

      {/* Quality Metrics Tab */}
      {activeTab === 'quality-metrics' && (
        <div className="dashboard-section">
          <h2>📊 Quality Metrics & Analytics</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Comprehensive performance metrics for annotators and projects.
          </p>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <button 
              className="btn btn-primary"
              onClick={loadAnnotatorMetrics}
              disabled={loading}
            >
              {loading ? '⏳ Loading...' : '👤 My Performance'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={loadProjectMetrics}
              disabled={loading}
            >
              📁 Project Metrics
            </button>
          </div>

          {annotatorMetrics && (
            <div style={{ marginBottom: '30px' }}>
              <h3>👤 Your Performance Metrics (Last 30 Days)</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">✏️</div>
                  <div className="stat-content">
                    <h3>{annotatorMetrics.total_annotations}</h3>
                    <p>Total Annotations</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>{annotatorMetrics.approval_rate}%</h3>
                    <p>Approval Rate</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-content">
                    <h3>{annotatorMetrics.average_quality_score}/10</h3>
                    <p>Quality Score</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🚀</div>
                  <div className="stat-content">
                    <h3>{annotatorMetrics.annotations_per_day}</h3>
                    <p>Per Day</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🎯</div>
                  <div className="stat-content">
                    <h3>{annotatorMetrics.consistency_score}%</h3>
                    <p>Consistency</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {projectMetrics && (
            <div>
              <h3>📁 Project Metrics - Project #{projectMetrics.project_id}</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📋</div>
                  <div className="stat-content">
                    <h3>{projectMetrics.total_tasks}</h3>
                    <p>Total Tasks</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>{projectMetrics.annotated_tasks}</h3>
                    <p>Annotated</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>{projectMetrics.completion_rate}%</h3>
                    <p>Completion Rate</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">🔍</div>
                  <div className="stat-content">
                    <h3>{projectMetrics.review_rate}%</h3>
                    <p>Review Rate</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Consensus Tab */}
      {activeTab === 'consensus' && (
        <div className="dashboard-section">
          <h2>🤝 Consensus & Agreement Analysis</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Measure inter-annotator agreement and generate consensus labels.
          </p>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
            <input
              type="number"
              value={selectedTask}
              onChange={(e) => setSelectedTask(Number(e.target.value))}
              placeholder="Task ID"
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                width: '150px'
              }}
            />
            <button 
              className="btn btn-primary"
              onClick={loadConsensusData}
              disabled={loading}
            >
              {loading ? '⏳ Loading...' : '🤝 Calculate Consensus'}
            </button>
          </div>

          {consensusData && (
            <div>
              <div style={{
                background: consensusData.agreement.status === 'high' ? '#4caf50' : 
                           consensusData.agreement.status === 'medium' ? '#ff9800' : '#f44336',
                color: '#fff',
                padding: '30px',
                borderRadius: '12px',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: 0, fontSize: '2.5rem' }}>
                  {consensusData.agreement.agreement_score}%
                </h3>
                <p style={{ margin: '10px 0 0 0', fontSize: '1.2rem', fontWeight: '600' }}>
                  Inter-Annotator Agreement ({consensusData.agreement.annotator_count} annotators)
                </p>
                <p style={{ margin: '10px 0 0 0', opacity: 0.9 }}>
                  Status: {consensusData.agreement.status.toUpperCase()}
                </p>
              </div>

              {consensusData.labels.consensus_label_ids.length > 0 && (
                <div style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '2px solid #4ECDC4'
                }}>
                  <h4>✅ Consensus Labels (50% threshold)</h4>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
                    {consensusData.labels.consensus_label_ids.map(labelId => (
                      <span key={labelId} style={{
                        background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                        color: '#fff',
                        padding: '8px 16px',
                        borderRadius: '20px',
                        fontWeight: '600'
                      }}>
                        Label #{labelId}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div className="dashboard-section">
          <h2>📤 Export Annotations</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>
            Export your annotations in industry-standard formats.
          </p>

          <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', alignItems: 'center' }}>
            <input
              type="number"
              value={selectedProject}
              onChange={(e) => setSelectedProject(Number(e.target.value))}
              placeholder="Project ID"
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                width: '150px'
              }}
            />
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              style={{
                padding: '12px',
                borderRadius: '8px',
                border: '2px solid #e0e0e0',
                cursor: 'pointer'
              }}
            >
              <option value="jsonl">JSONL (NLP Tasks)</option>
              <option value="coco">COCO (Object Detection)</option>
              <option value="csv">CSV (Spreadsheet)</option>
            </select>
            <button 
              className="btn btn-primary"
              onClick={handleExport}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                border: 'none'
              }}
            >
              {loading ? '⏳ Exporting...' : '💾 Export Data'}
            </button>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="stat-card" onClick={() => setExportFormat('jsonl')} style={{ cursor: 'pointer', border: exportFormat === 'jsonl' ? '3px solid #667eea' : '2px solid #e0e0e0' }}>
              <div className="stat-icon">📝</div>
              <div className="stat-content">
                <h3>JSONL</h3>
                <p>NLP & Text Tasks</p>
              </div>
            </div>
            <div className="stat-card" onClick={() => setExportFormat('coco')} style={{ cursor: 'pointer', border: exportFormat === 'coco' ? '3px solid #667eea' : '2px solid #e0e0e0' }}>
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <h3>COCO</h3>
                <p>Object Detection</p>
              </div>
            </div>
            <div className="stat-card" onClick={() => setExportFormat('csv')} style={{ cursor: 'pointer', border: exportFormat === 'csv' ? '3px solid #667eea' : '2px solid #e0e0e0' }}>
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <h3>CSV</h3>
                <p>Spreadsheet Format</p>
              </div>
            </div>
          </div>

          {exportData && (
            <div style={{
              marginTop: '30px',
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '12px',
              border: '2px solid #28a745'
            }}>
              <h3 style={{ color: '#28a745', marginBottom: '15px' }}>
                ✅ Export Successful!
              </h3>
              <p>File has been downloaded to your computer.</p>
              <pre style={{
                background: '#fff',
                padding: '15px',
                borderRadius: '8px',
                maxHeight: '300px',
                overflow: 'auto',
                fontSize: '0.85rem'
              }}>
                {JSON.stringify(exportData, null, 2).substring(0, 500)}...
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
