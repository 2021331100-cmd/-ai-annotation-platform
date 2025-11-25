import React, { useState, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { getReviewerReviews, createReview, updateReview, getUserAnnotations, getTasks } from '../api'
import '../styles/Dashboard.css'

function Reviews() {
  const user = useAuthStore((state) => state.user)
  const [reviews, setReviews] = useState([])
  const [pendingAnnotations, setPendingAnnotations] = useState([])
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedAnnotation, setSelectedAnnotation] = useState(null)
  const [formData, setFormData] = useState({
    feedback: '',
    status: 'pending'
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('pending')

  useEffect(() => {
    if (user?.id) {
      loadReviewData()
    }
  }, [user])

  const loadReviewData = async () => {
    setLoading(true)
    try {
      const reviewsRes = await getReviewerReviews(user.id)
      setReviews(reviewsRes.data || [])

      const annotationsRes = await getUserAnnotations(user.id)
      const allAnnotations = annotationsRes.data || []
      
      const reviewedAnnotationIds = new Set(reviewsRes.data?.map(r => r.annotation_id) || [])
      const pending = allAnnotations.filter(a => !reviewedAnnotationIds.has(a.annotation_id))
      setPendingAnnotations(pending)
    } catch (error) {
      console.error('Error loading review data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateReview = async () => {
    if (!selectedAnnotation || !formData.status) {
      alert('Please select status')
      return
    }

    try {
      const reviewData = {
        annotation_id: selectedAnnotation.annotation_id,
        reviewer_id: user.id,
        feedback: formData.feedback || null,
        status: formData.status
      }
      
      console.log('Submitting review:', reviewData)
      await createReview(reviewData)
      alert('Review submitted successfully!')
      setShowReviewModal(false)
      setSelectedAnnotation(null)
      setFormData({ feedback: '', status: 'pending' })
      loadReviewData()
    } catch (error) {
      console.error('Error creating review:', error)
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error'
      alert('Failed to submit review: ' + errorMessage)
    }
  }

  const openReviewModal = (annotation) => {
    setSelectedAnnotation(annotation)
    setFormData({ feedback: '', status: 'pending' })
    setShowReviewModal(true)
  }

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'pending': 'status-badge-pending',
      'approved': 'status-badge-completed',
      'rejected': 'status-badge-in-progress',
      'needs_revision': 'status-badge-not-started'
    }
    return statusMap[status?.toLowerCase()] || 'status-badge-pending'
  }

  if (loading) {
    return <div className="dashboard-container"><p>Loading reviews...</p></div>
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Annotation Reviews</h1>
        <p>Review and approve annotations from annotators</p>
      </div>

      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <button
          onClick={() => setActiveTab('pending')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'pending' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
            color: activeTab === 'pending' ? '#fff' : '#333',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Pending Annotations ({pendingAnnotations.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'completed' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
            color: activeTab === 'completed' ? '#fff' : '#333',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          My Reviews ({reviews.length})
        </button>
      </div>

      {activeTab === 'pending' && (
        <div className="dashboard-section">
          <h2>Pending Annotations</h2>
          {pendingAnnotations.length === 0 ? (
            <p style={{ color: '#999', padding: '2rem', textAlign: 'center' }}>
              No pending annotations to review
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {pendingAnnotations.map(annotation => (
                <div key={annotation.annotation_id} className="task-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ marginBottom: '0.5rem', fontSize: '1.1rem' }}>
                        Annotation #{annotation.annotation_id}
                      </h3>
                      <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Created: {new Date(annotation.create_date).toLocaleDateString()}
                      </p>
                      
                      <div style={{ 
                        background: '#f8f9fa', 
                        padding: '1rem', 
                        borderRadius: '8px', 
                        marginBottom: '1rem',
                        maxHeight: '150px',
                        overflow: 'auto'
                      }}>
                        <pre style={{ 
                          margin: 0, 
                          fontSize: '0.9rem', 
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word'
                        }}>
                          {annotation.content || 'No content'}
                        </pre>
                      </div>

                      {annotation.labels && annotation.labels.length > 0 && (
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                          {annotation.labels.map(label => (
                            <span
                              key={label.label_id}
                              style={{
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                color: '#fff',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.85rem',
                                fontWeight: '500'
                              }}
                            >
                              {label.label_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => openReviewModal(annotation)}
                      style={{
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: '600',
                        marginLeft: '1rem'
                      }}
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="dashboard-section">
          <h2>My Reviews</h2>
          {reviews.length === 0 ? (
            <p style={{ color: '#999', padding: '2rem', textAlign: 'center' }}>
              You haven't submitted any reviews yet
            </p>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {reviews.map(review => (
                <div key={review.review_id} className="task-card" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                          Annotation #{review.annotation_id}
                        </h3>
                        <span className={getStatusBadgeClass(review.status)}>
                          {review.status?.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      
                      <p style={{ color: '#666', marginBottom: '1rem', fontSize: '0.9rem' }}>
                        Reviewed: {new Date(review.review_date).toLocaleDateString()}
                      </p>
                      
                      {review.feedback && (
                        <div style={{ 
                          background: '#f8f9fa', 
                          padding: '1rem', 
                          borderRadius: '8px',
                          borderLeft: '4px solid #667eea'
                        }}>
                          <strong style={{ display: 'block', marginBottom: '0.5rem', color: '#667eea' }}>
                            Feedback:
                          </strong>
                          <p style={{ margin: 0, color: '#333' }}>{review.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showReviewModal && selectedAnnotation && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '700px' }}>
            <h2>Review Annotation #{selectedAnnotation.annotation_id}</h2>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Annotation Content:
              </label>
              <div style={{ 
                background: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '8px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <pre style={{ 
                  margin: 0, 
                  fontSize: '0.9rem', 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}>
                  {selectedAnnotation.content || 'No content'}
                </pre>
              </div>
            </div>

            {selectedAnnotation.labels && selectedAnnotation.labels.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Labels:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {selectedAnnotation.labels.map(label => (
                    <span
                      key={label.label_id}
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: '#fff',
                        padding: '0.5rem 1rem',
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        fontWeight: '500'
                      }}
                    >
                      {label.label_name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Review Status: <span style={{ color: 'red' }}>*</span>
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '1rem'
                }}
              >
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="needs_revision">Needs Revision</option>
              </select>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                Feedback (optional):
              </label>
              <textarea
                value={formData.feedback}
                onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                placeholder="Provide feedback for the annotator..."
                rows="4"
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowReviewModal(false)
                  setSelectedAnnotation(null)
                  setFormData({ feedback: '', status: 'pending' })
                }}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  background: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateReview}
                style={{
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Reviews

