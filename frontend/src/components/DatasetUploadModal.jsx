import React, { useState } from 'react'
import { uploadDataset } from '../api'
import '../styles/Modal.css'

function DatasetUploadModal({ projectId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    project_id: projectId || '',
    source_type: 'Upload',
  })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      setFile(selectedFile)
      // Auto-fill name if empty
      if (!formData.name) {
        setFormData({ ...formData, name: selectedFile.name.split('.')[0] })
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!file) {
      alert('Please select a file to upload')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      // Create FormData for file upload
      const uploadFormData = new FormData()
      uploadFormData.append('file', file)
      uploadFormData.append('project_id', formData.project_id)
      uploadFormData.append('name', formData.name)
      uploadFormData.append('description', formData.description || '')
      
      // Add progress callback
      uploadFormData._onProgress = (percent) => {
        setUploadProgress(percent)
      }

      // Upload dataset
      const response = await uploadDataset(uploadFormData)
      
      setUploadProgress(100)
      
      setTimeout(() => {
        onSuccess && onSuccess()
        onClose()
      }, 500)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload dataset: ' + (error.response?.data?.detail || error.message))
      setUploadProgress(0)
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📤 Upload Dataset</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="name">Dataset Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter dataset name"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the dataset..."
                rows={3}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="project_id">Project ID *</label>
              <input
                type="number"
                id="project_id"
                name="project_id"
                value={formData.project_id}
                onChange={handleChange}
                required
                placeholder="Enter project ID"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label htmlFor="source_type">Source Type</label>
              <select
                id="source_type"
                name="source_type"
                value={formData.source_type}
                onChange={handleChange}
                className="form-control"
              >
                <option value="Upload">Upload</option>
                <option value="API">API</option>
                <option value="Database">Database</option>
                <option value="URL">URL</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="file">Select File *</label>
              <div className="file-upload-area">
                <input
                  type="file"
                  id="file"
                  onChange={handleFileChange}
                  accept=".json,.csv,.txt,.xml"
                  className="file-input"
                  required
                />
                <label htmlFor="file" className="file-upload-label">
                  <span className="upload-icon">📁</span>
                  <span className="upload-text">
                    {file ? file.name : 'Click to select file or drag and drop'}
                  </span>
                  {file && (
                    <span className="file-size">{formatFileSize(file.size)}</span>
                  )}
                </label>
              </div>
              <small className="form-hint">
                Supported formats: JSON, CSV, TXT, XML
              </small>
            </div>

            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <span className="progress-text">{uploadProgress}% uploaded</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={uploading || !file}
            >
              {uploading ? 'Uploading...' : '📤 Upload Dataset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DatasetUploadModal
