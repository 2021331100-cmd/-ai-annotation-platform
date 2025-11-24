import React, { useState } from 'react'
import { createReview } from '../api'
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
    setLoading(true)
    
    try {
      // Simulate AI review (in production, call your AI service)
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock AI analysis
      const mockAnalysis = {
        quality_score: 0.87,
        completeness: 0.92,
        accuracy: 0.85,
        consistency: 0.89,
        issues: [
          { type: 'warning', message: 'Missing some entity labels' },
          { type: 'info', message: 'Consider adding more context' },
        ],
        strengths: [
          'Well-structured annotations',
          'High confidence scores',
          'Proper entity classification',
        ],
        suggestion: 'The annotation is of good quality. Minor improvements could be made in entity completeness.',
        recommended_action: 'Approved',
      }
      
      setAiAnalysis(mockAnalysis)
      setReviewDecision(mockAnalysis.recommended_action)
    } catch (error) {
      alert('AI review failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!reviewDecision) {
      alert('Please select a review decision')
      return
    }

    setSaving(true)
    
    try {
      const reviewData = {
        annotation_id: annotation?.id || 1,
        reviewer_id: user.id,
        status: reviewDecision,
        feedback: feedback || (aiAnalysis?.suggestion || 'Reviewed with AI assistance'),
        ai_assisted: true,
        ai_analysis: aiAnalysis,
      }

      await createReview(reviewData)
      alert('Review submitted successfully!')
      onClose()
    } catch (error) {
      alert('Failed to submit review')
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
                <p><strong>Annotation ID:</strong> #{annotation.id}</p>
                <p><strong>Task ID:</strong> #{annotation.task_id}</p>
                <p><strong>Data:</strong></p>
                <pre>{JSON.stringify(annotation.data, null, 2)}</pre>
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
