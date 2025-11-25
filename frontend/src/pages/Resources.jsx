import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import BulkUploadModal from '../components/BulkUploadModal'
import '../styles/Dashboard.css'

function Resources() {
  const [activeTab, setActiveTab] = useState('concepts')
  const [concepts, setConcepts] = useState([])
  const [caseStudies, setCaseStudies] = useState([])
  const [blogPosts, setBlogPosts] = useState([])
  const [whitepapers, setWhitepapers] = useState([])
  const [events, setEvents] = useState([])
  const [webinars, setWebinars] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showBulkUpload, setShowBulkUpload] = useState(false)

  useEffect(() => {
    loadResources()
  }, [])

  const loadResources = async () => {
    try {
      const [conceptsRes, casesRes, blogRes, papersRes, eventsRes, webinarsRes] = await Promise.all([
        axios.get('http://localhost:8000/api/resources/core-concepts'),
        axios.get('http://localhost:8000/api/resources/case-studies'),
        axios.get('http://localhost:8000/api/resources/blog'),
        axios.get('http://localhost:8000/api/resources/whitepapers'),
        axios.get('http://localhost:8000/api/resources/events'),
        axios.get('http://localhost:8000/api/resources/webinars')
      ])

      setConcepts(conceptsRes.data)
      setCaseStudies(casesRes.data)
      setBlogPosts(blogRes.data)
      setWhitepapers(papersRes.data)
      setEvents(eventsRes.data)
      setWebinars(webinarsRes.data)
    } catch (error) {
      console.error('Failed to load resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    
    try {
      const res = await axios.get(`http://localhost:8000/api/resources/search?q=${searchQuery}`)
      console.log('Search results:', res.data)
      // Handle search results
    } catch (error) {
      console.error('Search failed:', error)
    }
  }

  if (loading) {
    return <div className="dashboard-container"><p>Loading resources...</p></div>
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>📚 Resources & Learning Center</h1>
          <p>Explore AI concepts, case studies, and educational content</p>
        </div>
        <button
          onClick={() => setShowBulkUpload(true)}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: '600',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
          }}
        >
          📤 Bulk Upload Datasets
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem' }}>
        <input
          type="text"
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          style={{
            flex: 1,
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            border: '1px solid #ddd',
            fontSize: '1rem'
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '8px',
            border: 'none',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          Search
        </button>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'concepts', label: '💎 Core Concepts', count: concepts.length },
          { id: 'cases', label: '📊 Case Studies', count: caseStudies.length },
          { id: 'blog', label: '📝 Blog', count: blogPosts.length },
          { id: 'whitepapers', label: '📄 Whitepapers', count: whitepapers.length },
          { id: 'events', label: '📅 Events', count: events.length },
          { id: 'webinars', label: '🎥 Webinars', count: webinars.length }
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
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Core Concepts */}
      {activeTab === 'concepts' && (
        <div className="dashboard-section">
          <h2>Core AI & ML Concepts</h2>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {concepts.map(concept => (
              <div key={concept.id} className="task-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '1.5rem' }}>
                  <div style={{ fontSize: '3rem' }}>{concept.icon}</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem', color: '#667eea' }}>
                      {concept.title}
                    </h3>
                    <p style={{ marginBottom: '1rem', color: '#666', fontWeight: '500' }}>
                      {concept.description}
                    </p>
                    <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                      {concept.details}
                    </p>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      <h4 style={{ marginBottom: '0.75rem', color: '#333' }}>Key Points:</h4>
                      <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                        {concept.key_points.map((point, idx) => (
                          <li key={idx}>{point}</li>
                        ))}
                      </ul>
                    </div>

                    {concept.use_cases && (
                      <div style={{ 
                        background: '#f8f9fa', 
                        padding: '1rem', 
                        borderRadius: '8px',
                        borderLeft: '4px solid #667eea'
                      }}>
                        <h4 style={{ marginBottom: '0.5rem', color: '#667eea' }}>Use Cases:</h4>
                        <ul style={{ paddingLeft: '1.5rem', margin: 0 }}>
                          {concept.use_cases.map((useCase, idx) => (
                            <li key={idx}>{useCase}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Case Studies */}
      {activeTab === 'cases' && (
        <div className="dashboard-section">
          <h2>Success Stories & Case Studies</h2>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {caseStudies.map(study => (
              <div key={study.id} className="task-card" style={{ padding: '2rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ 
                    background: '#667eea', 
                    color: '#fff', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '12px',
                    fontSize: '0.85rem',
                    fontWeight: '500'
                  }}>
                    {study.category}
                  </span>
                  <span style={{ 
                    marginLeft: '0.5rem',
                    color: '#666',
                    fontSize: '0.9rem'
                  }}>
                    {study.industry}
                  </span>
                </div>

                <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', color: '#333' }}>
                  {study.title}
                </h3>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Challenge:</h4>
                  <p style={{ color: '#666' }}>{study.challenge}</p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Solution:</h4>
                  <p style={{ color: '#666' }}>{study.solution}</p>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <h4 style={{ color: '#667eea', marginBottom: '0.5rem' }}>Results:</h4>
                  <ul style={{ paddingLeft: '1.5rem', color: '#666' }}>
                    {study.results.map((result, idx) => (
                      <li key={idx}>{result}</li>
                    ))}
                  </ul>
                </div>

                <div style={{ 
                  background: '#f0f7ff', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  borderLeft: '4px solid #667eea'
                }}>
                  <strong style={{ color: '#667eea' }}>Impact:</strong> {study.impact}
                </div>

                <div style={{ marginTop: '1rem', color: '#999', fontSize: '0.85rem' }}>
                  Published: {new Date(study.published_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blog Posts */}
      {activeTab === 'blog' && (
        <div className="dashboard-section">
          <h2>Blog & Articles</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
            {blogPosts.map(post => (
              <div key={post.id} className="task-card" style={{ padding: '1.5rem' }}>
                <div style={{ marginBottom: '1rem' }}>
                  <span style={{ 
                    background: '#667eea', 
                    color: '#fff', 
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '12px',
                    fontSize: '0.8rem'
                  }}>
                    {post.category}
                  </span>
                  <span style={{ 
                    marginLeft: '0.5rem',
                    color: '#999',
                    fontSize: '0.8rem'
                  }}>
                    {post.read_time}
                  </span>
                </div>

                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>
                  {post.title}
                </h3>

                <p style={{ color: '#666', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {post.excerpt}
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  {post.tags.map(tag => (
                    <span key={tag} style={{ 
                      background: '#f0f0f0', 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      marginRight: '0.5rem',
                      color: '#666'
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '1rem',
                  borderTop: '1px solid #eee'
                }}>
                  <span style={{ fontSize: '0.85rem', color: '#999' }}>
                    {post.author}
                  </span>
                  <button style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#667eea',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}>
                    Read More →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Whitepapers */}
      {activeTab === 'whitepapers' && (
        <div className="dashboard-section">
          <h2>Whitepapers & Research</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
            {whitepapers.map(paper => (
              <div key={paper.id} className="task-card" style={{ padding: '1.5rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📄</div>
                
                <h3 style={{ marginBottom: '0.75rem', fontSize: '1.2rem' }}>
                  {paper.title}
                </h3>

                <p style={{ color: '#666', marginBottom: '1rem', lineHeight: '1.5' }}>
                  {paper.description}
                </p>

                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  fontSize: '0.85rem',
                  color: '#999'
                }}>
                  <span>{paper.pages} pages</span>
                  <span>{paper.category}</span>
                </div>

                <button style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}>
                  📥 Download PDF
                </button>

                <div style={{ marginTop: '1rem', color: '#999', fontSize: '0.8rem', textAlign: 'center' }}>
                  Published: {new Date(paper.published_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events */}
      {activeTab === 'events' && (
        <div className="dashboard-section">
          <h2>Upcoming Events</h2>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {events.map(event => (
              <div key={event.id} className="task-card" style={{ padding: '1.5rem', display: 'flex', gap: '1.5rem' }}>
                <div style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  padding: '1rem',
                  borderRadius: '12px',
                  textAlign: 'center',
                  minWidth: '100px'
                }}>
                  <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>
                    {new Date(event.date).getDate()}
                  </div>
                  <div style={{ fontSize: '0.9rem' }}>
                    {new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <span style={{ 
                      background: '#667eea', 
                      color: '#fff', 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '12px',
                      fontSize: '0.8rem'
                    }}>
                      {event.type}
                    </span>
                  </div>

                  <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem' }}>
                    {event.title}
                  </h3>

                  <p style={{ color: '#666', marginBottom: '1rem' }}>
                    📍 {event.location}
                  </p>

                  <p style={{ marginBottom: '1rem', lineHeight: '1.5' }}>
                    {event.description}
                  </p>

                  <button style={{
                    padding: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#667eea',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}>
                    Register Now →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Webinars */}
      {activeTab === 'webinars' && (
        <div className="dashboard-section">
          <h2>Webinars & Online Training</h2>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {webinars.map(webinar => (
              <div key={webinar.id} className="task-card" style={{ padding: '2rem' }}>
                <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
                  <div style={{ fontSize: '3rem' }}>🎥</div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ marginBottom: '0.5rem', fontSize: '1.4rem' }}>
                      {webinar.title}
                    </h3>
                    <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                      Presented by {webinar.presenter}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', color: '#999' }}>
                      <span>📅 {new Date(webinar.date).toLocaleDateString()}</span>
                      <span>⏱️ {webinar.duration}</span>
                    </div>
                  </div>
                </div>

                <p style={{ marginBottom: '1.5rem', lineHeight: '1.6' }}>
                  {webinar.description}
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ marginBottom: '0.75rem', color: '#667eea' }}>Topics Covered:</h4>
                  <ul style={{ paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                    {webinar.topics.map((topic, idx) => (
                      <li key={idx}>{topic}</li>
                    ))}
                  </ul>
                </div>

                <button style={{
                  padding: '0.75rem 2rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '1rem'
                }}>
                  Register for Webinar →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onUploadComplete={() => {
          alert('Files uploaded successfully!')
          setShowBulkUpload(false)
        }}
      />
    </div>
  )
}

export default Resources
