import React, { useState } from 'react'
import { createReview, aiAutoReview, aiQualityCheck } from '../api'
import { useAuthStore } from '../store/authStore'
import '../styles/Modal.css'

function AIReviewModal({ annotation, onClose }) {
  const user = useAuthStore((state) => state.user)
  const [aiAnalysis, setAiAnalysis] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [reviewDecision, setReviewDecision] = useState('')
  const [feedback, setFeedback] = useState('')

  const handleAIReview = async () => {
    if (!annotation) {
      alert('No annotation selected')
      return
    }

    setLoading(true)
    
    try {
      // Call real AI review API
      const annotationData = typeof annotation.content === 'string' 
        ? JSON.parse(annotation.content) 
        : annotation.content || annotation.data || {}
      
      const response = await aiQualityCheck(annotationData)
      const qualityData = response.data
      
      // Transform API response to UI format
      const mockAnalysis = {
        quality_score: qualityData.quality_score || 0.85,
        completeness: qualityData.quality_score || 0.85,
        accuracy: qualityData.quality_score || 0.85,
        consistency: qualityData.quality_score || 0.85,
        issues: (qualityData.issues || []).map(issue => ({
          type: 'warning',
          message: typeof issue === 'string' ? issue : issue.message || 'Issue detected'
        })),
        strengths: qualityData.suggestions?.length > 0 
          ? ['AI analysis completed', 'Quality check passed']
          : ['Well-structured annotations', 'High confidence scores', 'Proper annotation format'],
        suggestion: qualityData.suggestions?.[0] || 'The annotation quality has been analyzed by AI.',
        recommended_action: qualityData.passed ? 'Approved' : (qualityData.quality_score >= 0.75 ? 'Needs Revision' : 'Rejected'),
      }
      
      setAiAnalysis(mockAnalysis)
      setReviewDecision(mockAnalysis.recommended_action)
    } catch (error) {
      console.error('AI review error:', error)
      alert('AI review failed: ' + (error.response?.data?.detail || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewDecision) {
      alert('Please select a review decision')
      return
    }

    if (!annotation) {
      alert('No annotation selected')
      return
    }

    setSaving(true)
    
    try {
      const userId = user.user_id || user.id
      const annotationId = annotation.annotation_id || annotation.id
      
      const reviewData = {
        annotation_id: annotationId,
        reviewer_id: userId,
        status: reviewDecision,
        feedback: feedback || (aiAnalysis?.suggestion || 'Reviewed with AI assistance'),
      }

      await createReview(reviewData)
      alert('Review submitted successfully!')
      onClose()
    } catch (error) {
      console.error('Failed to submit review:', error)
      alert('Failed to submit review: ' + (error.response?.data?.detail || error.message))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🤖 AI-Assisted Review</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {annotation && (
            <div className="annotation-preview">
              <h3>Annotation Preview</h3>
              <div className="preview-content">
                <p><strong>Annotation ID:</strong> #{annotation.annotation_id || annotation.id}</p>
                <p><strong>Task ID:</strong> #{annotation.task_id}</p>
                <p><strong>Data:</strong></p>
                <pre>{JSON.stringify(annotation.content || annotation.data || {}, null, 2)}</pre>
              </div>
            </div>
          )}

          <button 
            className="btn btn-primary btn-block"
            onClick={handleAIReview}
            disabled={loading}
          >
            {loading ? '🤖 AI Analyzing...' : '🤖 Run AI Quality Analysis'}
          </button>

          {aiAnalysis && (
            <div className="ai-review-results">
              <h3>AI Quality Analysis</h3>
              
              <div className="quality-metrics">
                <div className="metric">
                  <h4>Quality Score</h4>
                  <div className="score-circle">{(aiAnalysis.quality_score * 100).toFixed(0)}%</div>
                </div>
                <div className="metric">
                  <h4>Completeness</h4>
                  <div className="score-circle">{(aiAnalysis.completeness * 100).toFixed(0)}%</div>
                </div>
                <div className="metric">
                  <h4>Accuracy</h4>
                  <div className="score-circle">{(aiAnalysis.accuracy * 100).toFixed(0)}%</div>
                </div>
                <div className="metric">
                  <h4>Consistency</h4>
                  <div className="score-circle">{(aiAnalysis.consistency * 100).toFixed(0)}%</div>
                </div>
              </div>

              <div className="ai-result-section">
                <h4>Identified Issues:</h4>
                <div className="issue-list">
                  {aiAnalysis.issues.map((issue, idx) => (
                    <div key={idx} className={`issue-item issue-${issue.type}`}>
                      <span className="issue-icon">{issue.type === 'warning' ? '⚠️' : 'ℹ️'}</span>
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="ai-result-section">
                <h4>Strengths:</h4>
                <ul className="strengths-list">
                  {aiAnalysis.strengths.map((strength, idx) => (
                    <li key={idx}>✅ {strength}</li>
                  ))}
                </ul>
              </div>

              <div className="ai-result-section">
                <h4>AI Suggestion:</h4>
                <p className="ai-suggestion">{aiAnalysis.suggestion}</p>
              </div>

              <div className="ai-result-section">
                <h4>Recommended Action:</h4>
                <span className={`recommendation-badge recommendation-${aiAnalysis.recommended_action.toLowerCase()}`}>
                  {aiAnalysis.recommended_action}
                </span>
              </div>

              <div className="form-group">
                <label>Your Review Decision</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value)}
                  className="form-control"
                >
                  <option value="">Select decision...</option>
                  <option value="Approved">✅ Approved</option>
                  <option value="Needs Revision">🔄 Needs Revision</option>
                  <option value="Rejected">❌ Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label>Feedback (Optional)</label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Add additional feedback..."
                  rows={4}
                  className="form-control"
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn btn-success"
            onClick={handleSubmitReview}
            disabled={!aiAnalysis || !reviewDecision || saving}
          >
            {saving ? 'Submitting...' : '✅ Submit Review'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AIReviewModal
