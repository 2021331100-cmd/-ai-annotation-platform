import React, { useState, useEffect } from 'react'
import { createAnnotation, aiAutoAnnotate, getLabels } from '../api'
import { useAuthStore } from '../store/authStore'
import '../styles/Modal.css'

function AIAnnotationModal({ show, onClose, onSuccess, tasks, task }) {
  const user = useAuthStore((state) => state.user)
  const [inputData, setInputData] = useState('')
  const [annotationType, setAnnotationType] = useState('sentiment_analysis')
  const [taskId, setTaskId] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [labels, setLabels] = useState([])
  const [selectedLabels, setSelectedLabels] = useState([])

  useEffect(() => {
    if (show) {
      loadLabels()
      // If a single task was passed (from AnnotatorDashboard), preselect it
      if (task && task.task_id) {
        setTaskId(task.task_id)
      }
    }
  }, [show])

  // Normalize tasks prop: use tasks array if provided, otherwise use single task as an array
  const tasksList = tasks ?? (task ? [task] : [])

  const loadLabels = async () => {
    try {
      const res = await getLabels()
      setLabels(res.data || [])
    } catch (error) {
      console.error('Error loading labels:', error)
    }
  }

  const handleAIAnnotate = async () => {
    if (!inputData.trim()) {
      alert('Please enter some data to annotate')
      return
    }

    setLoading(true)
    
    try {
      const data = { text: inputData, content: inputData }
      const labelsList = labels.map(l => l.label_name)
      
      const response = await aiAutoAnnotate(data, annotationType, labelsList)
      setAiResult(response.data)
    } catch (error) {
      console.error('AI annotation error:', error)
      alert('AI annotation failed: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAnnotation = async () => {
    if (!aiResult) {
      alert('Please generate AI annotations first')
      return
    }

    if (!taskId) {
      alert('Please select a task')
      return
    }

    setSaving(true)
    
    try {
      const annotationData = {
        task_id: parseInt(taskId),
        user_id: user.user_id || user.id,
        content: JSON.stringify({
          original_input: inputData,
          ai_result: aiResult,
          annotation_type: annotationType,
          timestamp: new Date().toISOString()
        }),
        label_ids: selectedLabels
      }

      await createAnnotation(annotationData)
      alert('AI-powered annotation saved successfully!')
      if (onSuccess) onSuccess()
      onClose()
    } catch (error) {
      console.error('Failed to save annotation:', error)
      alert('Failed to save annotation: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  const handleLabelToggle = (labelId) => {
    setSelectedLabels(prev => 
      prev.includes(labelId) 
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    )
  }

  const renderAIResult = () => {
    if (!aiResult) return null

    const result = aiResult.result || {}

    return (
      <div style={{ 
        background: '#f8f9fa', 
        padding: '1.5rem', 
        borderRadius: '8px', 
        marginBottom: '1.5rem',
        border: '2px solid #667eea'
      }}>
        <h3 style={{ marginTop: 0, color: '#667eea' }}>🤖 AI Results</h3>

        {/* Sentiment Analysis */}
        {result.sentiment && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>Sentiment:</strong>{' '}
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              background: result.sentiment === 'positive' ? '#28a745' : result.sentiment === 'negative' ? '#dc3545' : '#6c757d',
              color: '#fff',
              fontWeight: '600'
            }}>
              {result.sentiment?.toUpperCase()}
            </span>
            {result.confidence && (
              <span style={{ marginLeft: '0.5rem', color: '#666' }}>
                ({(result.confidence * 100).toFixed(1)}% confidence)
              </span>
            )}
          </div>
        )}

        {/* NER Entities */}
        {result.entities && result.entities.length > 0 && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>Detected Entities:</strong>
            <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {result.entities.map((entity, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    background: '#007bff',
                    color: '#fff',
                    fontSize: '0.9rem'
                  }}
                >
                  {entity.text} ({entity.type})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Text Classification */}
        {result.predicted_label && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>Predicted Label:</strong>{' '}
            <span style={{
              padding: '0.25rem 0.75rem',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontWeight: '600'
            }}>
              {result.predicted_label}
            </span>
          </div>
        )}

        {/* Summary */}
        {result.summary && (
          <div style={{ marginBottom: '1rem' }}>
            <strong>Summary:</strong>
            <p style={{ 
              marginTop: '0.5rem', 
              padding: '0.75rem', 
              background: '#fff', 
              borderRadius: '6px',
              border: '1px solid #ddd'
            }}>
              {result.summary}
            </p>
          </div>
        )}

        {/* Raw JSON */}
        <details style={{ marginTop: '1rem' }}>
          <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#667eea' }}>
            View Full AI Response
          </summary>
          <pre style={{ 
            marginTop: '0.5rem', 
            padding: '1rem', 
            background: '#fff', 
            borderRadius: '6px',
            overflow: 'auto',
            fontSize: '0.85rem'
          }}>
            {JSON.stringify(aiResult, null, 2)}
          </pre>
        </details>
      </div>
    )
  }

  if (!show) return null

  return (
    <div className="modal-overlay" style={{ animation: 'fadeIn 0.2s ease-out' }}>
      <div className="modal-content" style={{ 
        maxWidth: '900px', 
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
            }}>🤖 AI-Powered Annotation</h2>
            <p style={{ margin: '0.5rem 0 0 0', color: '#666', fontSize: '0.9rem' }}>
              Let AI help you annotate your data automatically
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

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.75rem', 
            fontWeight: '600',
            color: '#333',
            fontSize: '0.95rem'
          }}>
            Select Task: <span style={{ color: '#dc3545' }}>*</span>
          </label>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
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
            <option value="">Select a task</option>
            {tasksList.map(t => (
              <option key={t.task_id} value={t.task_id}>
                {t.title || `Task #${t.task_id}`}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.75rem', 
            fontWeight: '600',
            color: '#333',
            fontSize: '0.95rem'
          }}>
            AI Annotation Type:
          </label>
          <select
            value={annotationType}
            onChange={(e) => setAnnotationType(e.target.value)}
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
            <option value="sentiment_analysis">Sentiment Analysis</option>
            <option value="named_entity_recognition">Named Entity Recognition (NER)</option>
            <option value="text_classification">Text Classification</option>
            <option value="summarization">Text Summarization</option>
          </select>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '0.75rem', 
            fontWeight: '600',
            color: '#333',
            fontSize: '0.95rem'
          }}>
            Input Text to Annotate:
          </label>
          <textarea
            value={inputData}
            onChange={(e) => setInputData(e.target.value)}
            placeholder="Enter text to annotate using AI..."
            rows={6}
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '10px',
              border: '2px solid #e0e0e0',
              fontSize: '1rem',
              fontFamily: 'inherit',
              resize: 'vertical',
              transition: 'all 0.3s',
              lineHeight: '1.6'
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

        <button 
          onClick={handleAIAnnotate}
          disabled={loading || !inputData.trim()}
          style={{
            width: '100%',
            padding: '1rem 1.5rem',
            borderRadius: '12px',
            border: 'none',
            background: loading 
              ? 'linear-gradient(135deg, #999 0%, #666 100%)' 
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            cursor: loading || !inputData.trim() ? 'not-allowed' : 'pointer',
            fontWeight: '700',
            fontSize: '1.05rem',
            marginBottom: '1.5rem',
            transition: 'all 0.3s',
            boxShadow: loading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.3)',
            transform: loading ? 'scale(0.98)' : 'scale(1)',
            opacity: (!inputData.trim() && !loading) ? 0.6 : 1
          }}
          onMouseEnter={(e) => {
            if (!loading && inputData.trim()) {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)'
            }
          }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>🤖</span>
              AI Processing...
            </span>
          ) : '🤖 Generate AI Annotations'}
        </button>

        {renderAIResult()}

        {aiResult && labels.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.75rem', 
              fontWeight: '600',
              color: '#333',
              fontSize: '0.95rem'
            }}>
              Add Labels (optional):
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {labels.map(label => {
                const isSelected = selectedLabels.includes(label.label_id)
                return (
                  <span
                    key={label.label_id}
                    onClick={() => handleLabelToggle(label.label_id)}
                    style={{
                      padding: '0.625rem 1.25rem',
                      borderRadius: '20px',
                      background: isSelected
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : '#fff',
                      color: isSelected ? '#fff' : '#333',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      border: isSelected ? 'none' : '2px solid #e0e0e0',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      boxShadow: isSelected 
                        ? '0 4px 12px rgba(102, 126, 234, 0.3)' 
                        : '0 2px 4px rgba(0,0,0,0.05)',
                      transform: 'scale(1)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.transform = 'scale(1.05) translateY(-2px)'
                      e.target.style.boxShadow = isSelected 
                        ? '0 6px 16px rgba(102, 126, 234, 0.4)'
                        : '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.transform = 'scale(1) translateY(0)'
                      e.target.style.boxShadow = isSelected 
                        ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                        : '0 2px 4px rgba(0,0,0,0.05)'
                    }}
                  >
                    {label.label_name}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'flex-end',
          marginTop: '2rem',
          paddingTop: '1.5rem',
          borderTop: '2px solid #f0f0f0'
        }}>
          <button
            onClick={onClose}
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
            onClick={handleSaveAnnotation}
            disabled={!aiResult || saving}
            style={{
              padding: '0.875rem 2rem',
              borderRadius: '10px',
              border: 'none',
              background: (!aiResult || saving) 
                ? 'linear-gradient(135deg, #999 0%, #666 100%)' 
                : 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
              color: '#fff',
              cursor: (!aiResult || saving) ? 'not-allowed' : 'pointer',
              fontWeight: '700',
              fontSize: '1rem',
              transition: 'all 0.3s',
              boxShadow: (!aiResult || saving) ? 'none' : '0 4px 12px rgba(40, 167, 69, 0.3)',
              opacity: (!aiResult || saving) ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (aiResult && !saving) {
                e.target.style.transform = 'translateY(-2px)'
                e.target.style.boxShadow = '0 6px 20px rgba(40, 167, 69, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              if (aiResult && !saving) {
                e.target.style.transform = 'translateY(0)'
                e.target.style.boxShadow = '0 4px 12px rgba(40, 167, 69, 0.3)'
              }
            }}
          >
            {saving ? '⏳ Saving...' : '✅ Save Annotation'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIAnnotationModal
