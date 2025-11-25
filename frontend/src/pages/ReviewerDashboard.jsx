import React, { useState, useEffect } from 'react'
import { getReviewerReviews, getAnnotations, createReview } from '../api'
import { useAuthStore } from '../store/authStore'
import AIReviewModal from '../components/AIReviewModal'
import NotificationBell from '../components/NotificationBell'
import '../styles/Dashboard.css'

function ReviewerDashboard() {
  const user = useAuthStore((state) => state.user)
  const [reviews, setReviews] = useState([])
  const [pendingAnnotations, setPendingAnnotations] = useState([])
  const [stats, setStats] = useState({
    totalReviews: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
  })
  const [selectedAnnotation, setSelectedAnnotation] = useState(null)
  const [showAIModal, setShowAIModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user?.id || user?.user_id) {
      loadDashboardData()
    } else {
      setLoading(false)
      setError('User not logged in properly')
    }
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const userId = user.user_id || user.id
      const reviewsRes = await getReviewerReviews(userId)
      setReviews(reviewsRes.data || [])

      const approved = reviewsRes.data.filter(r => r.status === 'Approved').length
      const rejected = reviewsRes.data.filter(r => r.status === 'Rejected').length
      const needsRevision = reviewsRes.data.filter(r => r.status === 'Needs Revision').length

      setStats({
        totalReviews: reviewsRes.data.length,
        approved,
        rejected,
        pending: needsRevision,
      })

      // Load pending annotations (mock data for demo)
      setPendingAnnotations([])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      setError(error.response?.data?.detail || error.message || 'Failed to load dashboard data')
      setReviews([])
      setPendingAnnotations([])
    } finally {
      setLoading(false)
    }
  }

  const handleAIReview = (annotation) => {
    setSelectedAnnotation(annotation)
    setShowAIModal(true)
  }

  const handleQuickReview = async (annotationId, status, feedback) => {
    try {
      const userId = user.user_id || user.id
      await createReview({
        annotation_id: annotationId,
        reviewer_id: userId,
        status: status,
        feedback: feedback,
      })
      alert('Review submitted successfully!')
      loadDashboardData()
    } catch (error) {
      console.error('Failed to submit review:', error)
      alert('Failed to submit review: ' + (error.response?.data?.detail || error.message))
    }
  }

  if (loading) return <div className="loading">Loading dashboard...</div>

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>🔍 Reviewer Dashboard</h1>
            <p>Welcome back, {user?.username}!</p>
          </div>
          <NotificationBell />
        </div>
        <div className="error-message" style={{ margin: '20px', padding: '20px', background: '#fee', borderRadius: '8px' }}>
          <p>⚠️ {error}</p>
          <button className="btn btn-primary" onClick={loadDashboardData}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>🔍 Reviewer Dashboard</h1>
          <p>Welcome back, {user?.username}!</p>
        </div>
        <NotificationBell />
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <h3>{stats.totalReviews}</h3>
            <p>Total Reviews</p>
          </div>
        </div>

        <div className="stat-card stat-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.approved}</h3>
            <p>Approved</p>
          </div>
        </div>

        <div className="stat-card stat-danger">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <h3>{stats.rejected}</h3>
            <p>Rejected</p>
          </div>
        </div>

        <div className="stat-card stat-warning">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Pending</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>🤖 AI-Assisted Review</h2>
          <div className="ai-feature-card">
            <p>Use AI to help review annotations for quality and accuracy</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAIModal(true)}
            >
              Start AI Review
            </button>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Annotations Pending Review</h2>
          <div className="review-queue">
            {pendingAnnotations.length === 0 ? (
              <p>No annotations pending review</p>
            ) : (
              pendingAnnotations.map((annotation) => (
                <div key={annotation.id} className="review-card">
                  <div className="review-header">
                    <h3>Annotation #{annotation.id}</h3>
                    <span className="badge">Task #{annotation.task_id}</span>
                  </div>
                  <div className="review-content">
                    <p>{JSON.stringify(annotation.data).substring(0, 150)}...</p>
                  </div>
                  <div className="review-actions">
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={() => handleQuickReview(annotation.id, 'Approved', 'Looks good!')}
                    >
                      ✅ Approve
                    </button>
                    <button 
                      className="btn btn-sm btn-warning"
                      onClick={() => handleQuickReview(annotation.id, 'Needs Revision', 'Please revise')}
                    >
                      🔄 Needs Revision
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleQuickReview(annotation.id, 'Rejected', 'Does not meet standards')}
                    >
                      ❌ Reject
                    </button>
                    <button 
                      className="btn btn-sm btn-primary"
                      onClick={() => handleAIReview(annotation)}
                    >
                      🤖 AI Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recent Reviews</h2>
          <div className="review-list">
            {reviews.slice(0, 10).map((review) => (
              <div key={review.id} className="review-item">
                <div className="review-details">
                  <p><strong>Annotation #{review.annotation_id}</strong></p>
                  <p>{review.feedback}</p>
                  <small>{new Date(review.created_at).toLocaleString()}</small>
                </div>
                <span className={`status-badge status-${review.status.toLowerCase().replace(' ', '-')}`}>
                  {review.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAIModal && (
        <AIReviewModal
          annotation={selectedAnnotation}
          onClose={() => {
            setShowAIModal(false)
            setSelectedAnnotation(null)
            loadDashboardData()
          }}
        />
      )}
    </div>
  )
}

export default ReviewerDashboard
