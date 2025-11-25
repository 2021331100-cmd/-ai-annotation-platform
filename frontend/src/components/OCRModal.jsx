import React, { useState, useEffect } from 'react'
import { extractTextFromImage, extractTextFromPDF, getOCRLanguages } from '../api'
import '../styles/Modal.css'

function OCRModal({ isOpen, onClose, onTextExtracted }) {
  const [file, setFile] = useState(null)
  const [language, setLanguage] = useState('eng')
  const [languages, setLanguages] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadLanguages()
    }
  }, [isOpen])

  const loadLanguages = async () => {
    try {
      const response = await getOCRLanguages()
      setLanguages(response.data || [])
    } catch (error) {
      console.error('Failed to load OCR languages:', error)
      setLanguages([
        { code: 'eng', name: 'English' },
        { code: 'fra', name: 'French' },
        { code: 'deu', name: 'German' },
        { code: 'spa', name: 'Spanish' },
        { code: 'chi_sim', name: 'Chinese (Simplified)' },
        { code: 'jpn', name: 'Japanese' },
        { code: 'ara', name: 'Arabic' }
      ])
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      setResult(null)
      setError('')
    }
  }

  const handleExtract = async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    setExtracting(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      let response
      if (file.type === 'application/pdf') {
        response = await extractTextFromPDF(formData, language)
      } else {
        response = await extractTextFromImage(formData, language)
      }

      setResult(response.data)
      
      if (onTextExtracted && response.data.text) {
        onTextExtracted(response.data)
      }
    } catch (error) {
      console.error('OCR extraction failed:', error)
      setError(error.response?.data?.detail || 'Failed to extract text. Make sure Tesseract is installed.')
    } finally {
      setExtracting(false)
    }
  }

  const handleCopyText = () => {
    if (result?.text) {
      navigator.clipboard.writeText(result.text)
      alert('Text copied to clipboard!')
    }
  }

  const handleUseAsAnnotation = () => {
    if (result?.text && onTextExtracted) {
      onTextExtracted({
        text: result.text,
        confidence: result.confidence,
        language: language,
        words: result.words
      })
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="modal-header">
          <h2>🔍 OCR - Extract Text from Image/PDF</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Select File (Image or PDF)
            </label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '2px dashed #667eea',
                cursor: 'pointer'
              }}
            />
            {file && (
              <div style={{ 
                marginTop: '0.5rem', 
                padding: '0.5rem', 
                background: '#f0f7ff', 
                borderRadius: '4px',
                fontSize: '0.9rem',
                color: '#667eea'
              }}>
                📎 {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </div>
            )}
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
              Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '1rem'
              }}
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name} ({lang.code})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <div style={{ 
              padding: '1rem', 
              background: '#fee', 
              color: '#c33', 
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              ⚠️ {error}
            </div>
          )}

          <button
            onClick={handleExtract}
            disabled={!file || extracting}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: 'none',
              background: file && !extracting ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ccc',
              color: '#fff',
              cursor: file && !extracting ? 'pointer' : 'not-allowed',
              fontWeight: '600',
              fontSize: '1rem',
              marginBottom: '1.5rem'
            }}
          >
            {extracting ? '🔄 Extracting...' : '🔍 Extract Text'}
          </button>

          {result && (
            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <h3 style={{ margin: 0 }}>Extracted Text</h3>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {result.confidence && (
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      background: result.confidence > 80 ? '#4CAF50' : result.confidence > 60 ? '#FF9800' : '#F44336',
                      color: '#fff',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: '600'
                    }}>
                      {result.confidence.toFixed(1)}% confidence
                    </span>
                  )}
                </div>
              </div>

              <div style={{ 
                background: '#f8f9fa', 
                padding: '1rem', 
                borderRadius: '8px',
                maxHeight: '300px',
                overflow: 'auto',
                marginBottom: '1rem',
                border: '1px solid #ddd'
              }}>
                <pre style={{ 
                  margin: 0, 
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  fontFamily: 'monospace',
                  fontSize: '0.9rem'
                }}>
                  {result.text || 'No text detected'}
                </pre>
              </div>

              {result.words && result.words.length > 0 && (
                <div style={{ marginBottom: '1rem' }}>
                  <details style={{ 
                    background: '#f8f9fa', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    border: '1px solid #ddd'
                  }}>
                    <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '0.5rem' }}>
                      📊 Word Details ({result.words.length} words)
                    </summary>
                    <div style={{ 
                      maxHeight: '200px', 
                      overflow: 'auto',
                      marginTop: '0.5rem'
                    }}>
                      {result.words.slice(0, 20).map((word, idx) => (
                        <div key={idx} style={{ 
                          padding: '0.25rem 0', 
                          borderBottom: '1px solid #e0e0e0',
                          fontSize: '0.85rem'
                        }}>
                          <strong>{word.text}</strong> - {word.confidence.toFixed(1)}% 
                          {word.bbox && ` (x:${word.bbox.x}, y:${word.bbox.y})`}
                        </div>
                      ))}
                      {result.words.length > 20 && (
                        <div style={{ padding: '0.5rem', color: '#666', fontSize: '0.85rem' }}>
                          ... and {result.words.length - 20} more words
                        </div>
                      )}
                    </div>
                  </details>
                </div>
              )}

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleCopyText}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #667eea',
                    background: '#fff',
                    color: '#667eea',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  📋 Copy Text
                </button>
                {onTextExtracted && (
                  <button
                    onClick={handleUseAsAnnotation}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      cursor: 'pointer',
                      fontWeight: '600'
                    }}
                  >
                    ✅ Use as Annotation
                    </button>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            onClick={onClose}
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              border: '1px solid #ddd',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default OCRModal
