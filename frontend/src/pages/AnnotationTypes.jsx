import React, { useState, useEffect } from 'react'
import axios from 'axios'
import '../styles/Dashboard.css'

function AnnotationTypes() {
  const [annotationTypes, setAnnotationTypes] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnnotationTypes()
  }, [])

  const loadAnnotationTypes = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/api/annotation-types/')
      setAnnotationTypes(res.data)
      console.log('Loaded annotation types:', res.data)
    } catch (error) {
      console.error('Failed to load annotation types:', error)
      alert('Failed to load annotation types. Please check if backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(annotationTypes.map(type => type.category))]
  const filteredTypes = selectedCategory === 'all' 
    ? annotationTypes 
    : annotationTypes.filter(type => type.category === selectedCategory)

  const categoryIcons = {
    'Text': '📝',
    'Audio': '🎵',
    'Image': '🖼️',
    'Video': '🎥',
    'Multimodal': '🔄'
  }

  if (loading) {
    return <div className="dashboard-container"><p>Loading...</p></div>
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1>🎨 Annotation Types</h1>
          <p>Professional multi-modal annotation capabilities</p>
        </div>
      </div>

      {/* Category Filters */}
      <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: selectedCategory === category 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : '#f0f0f0',
              color: selectedCategory === category ? '#fff' : '#333',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.9rem',
              textTransform: 'capitalize'
            }}
          >
            {category === 'all' ? '🌟 All Types' : `${categoryIcons[category] || '📌'} ${category}`}
          </button>
        ))}
      </div>

      {/* Annotation Types Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem' }}>
        {filteredTypes.map(type => (
          <div key={type.type} className="task-card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'start', gap: '1rem', marginBottom: '1rem' }}>
              <div style={{ fontSize: '3rem' }}>{categoryIcons[type.category] || '📌'}</div>
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <span style={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: '#fff',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {type.category}
                  </span>
                </div>
                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem', color: '#333' }}>
                  {type.type}
                </h3>
              </div>
            </div>

            <p style={{ color: '#666', marginBottom: '1.5rem', lineHeight: '1.6' }}>
              {type.description}
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#667eea', fontWeight: '600' }}>
                Use Cases:
              </h4>
              <ul style={{ margin: 0, paddingLeft: '1.5rem', lineHeight: '1.8' }}>
                {type.use_cases.map((useCase, idx) => (
                  <li key={idx} style={{ color: '#666', fontSize: '0.9rem' }}>{useCase}</li>
                ))}
              </ul>
            </div>

            <div style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              <h4 style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#667eea', fontWeight: '600' }}>
                Output Format:
              </h4>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                {Object.keys(type.output_format).map(key => (
                  <div key={key} style={{ marginBottom: '0.25rem' }}>
                    <strong>{key}:</strong> {type.output_format[key]}
                  </div>
                ))}
              </div>
            </div>

            <button style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.95rem'
            }}>
              Start Annotating →
            </button>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div style={{ marginTop: '3rem' }}>
        <h2 style={{ marginBottom: '1.5rem' }}>📊 Annotation Capabilities Overview</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {Object.entries(categoryIcons).map(([category, icon]) => {
            const count = annotationTypes.filter(t => t.category === category).length
            return (
              <div key={category} className="task-card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{icon}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#667eea', marginBottom: '0.25rem' }}>
                  {count}
                </div>
                <div style={{ color: '#666', fontSize: '0.9rem' }}>{category} Types</div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default AnnotationTypes
