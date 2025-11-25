import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import '../styles/Modal.css';

const BulkUploadModal = ({ isOpen, onClose, onUploadComplete }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResults, setUploadResults] = useState(null);
  const [uploadType, setUploadType] = useState('files'); // 'files' or 'zip'

  const onDrop = useCallback(async (acceptedFiles) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadResults(null);

    try {
      const formData = new FormData();

      if (uploadType === 'zip' && acceptedFiles.length === 1 && acceptedFiles[0].name.endsWith('.zip')) {
        // Upload ZIP file
        formData.append('file', acceptedFiles[0]);

        const response = await axios.post('http://127.0.0.1:8000/api/datasets/upload-zip', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });

        setUploadResults(response.data);
      } else {
        // Upload multiple files
        acceptedFiles.forEach(file => {
          formData.append('files', file);
        });

        const response = await axios.post('http://127.0.0.1:8000/api/datasets/bulk-upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });

        setUploadResults(response.data);
      }

      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadResults({
        success: [],
        failed: [{ filename: 'Upload', reason: error.response?.data?.detail || error.message }]
      });
    } finally {
      setUploading(false);
    }
  }, [uploadType, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
    accept: uploadType === 'zip' ? { 'application/zip': ['.zip'] } : undefined,
    multiple: uploadType === 'files'
  });

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h2>📦 Bulk File Upload</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>Upload Type:</label>
            <div style={{ display: 'flex', gap: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="files"
                  checked={uploadType === 'files'}
                  onChange={(e) => setUploadType(e.target.value)}
                  disabled={uploading}
                  style={{ marginRight: '8px' }}
                />
                <span>📄 Multiple Files</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  value="zip"
                  checked={uploadType === 'zip'}
                  onChange={(e) => setUploadType(e.target.value)}
                  disabled={uploading}
                  style={{ marginRight: '8px' }}
                />
                <span>🗜️ ZIP Archive</span>
              </label>
            </div>
          </div>

          <div
            {...getRootProps()}
            style={{
              border: '3px dashed #667eea',
              borderRadius: '12px',
              padding: '60px 20px',
              textAlign: 'center',
              cursor: uploading ? 'not-allowed' : 'pointer',
              background: isDragActive ? 'linear-gradient(135deg, #667eea22, #764ba222)' : '#f8f9ff',
              transition: 'all 0.3s ease',
              marginBottom: '20px'
            }}
          >
            <input {...getInputProps()} />
            {uploading ? (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>⏳</div>
                <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '10px' }}>
                  Uploading... {uploadProgress}%
                </p>
                <div style={{
                  width: '100%',
                  height: '8px',
                  background: '#e0e0e0',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  margin: '0 auto',
                  maxWidth: '300px'
                }}>
                  <div style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #667eea, #764ba2)',
                    transition: 'width 0.3s ease'
                  }}></div>
                </div>
              </div>
            ) : isDragActive ? (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📂</div>
                <p style={{ fontSize: '18px', color: '#667eea', fontWeight: '600' }}>
                  Drop files here!
                </p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: '48px', marginBottom: '15px' }}>
                  {uploadType === 'zip' ? '🗜️' : '📁'}
                </div>
                <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>
                  Drag & drop {uploadType === 'zip' ? 'a ZIP file' : 'files'} here
                </p>
                <p style={{ color: '#666', fontSize: '14px' }}>
                  or click to browse files
                </p>
                <p style={{ color: '#999', fontSize: '12px', marginTop: '10px' }}>
                  {uploadType === 'zip' 
                    ? 'Supported: .zip archives (will be extracted automatically)'
                    : 'Supported: Images, Videos, Audio, Text, PDFs, and more'}
                </p>
              </div>
            )}
          </div>

          {uploadResults && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>
                📊 Upload Results
              </h3>
              
              {uploadResults.success && uploadResults.success.length > 0 && (
                <div style={{
                  background: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '8px',
                  padding: '15px',
                  marginBottom: '15px'
                }}>
                  <p style={{ color: '#155724', fontWeight: '600', marginBottom: '10px' }}>
                    ✅ Successfully uploaded: {uploadResults.success.length} files
                  </p>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '13px' }}>
                    {uploadResults.success.map((file, idx) => (
                      <div key={idx} style={{ padding: '5px 0', color: '#155724' }}>
                        • {file.filename} ({(file.size / 1024).toFixed(1)} KB)
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadResults.failed && uploadResults.failed.length > 0 && (
                <div style={{
                  background: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '8px',
                  padding: '15px'
                }}>
                  <p style={{ color: '#721c24', fontWeight: '600', marginBottom: '10px' }}>
                    ❌ Failed: {uploadResults.failed.length} files
                  </p>
                  <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '13px' }}>
                    {uploadResults.failed.map((file, idx) => (
                      <div key={idx} style={{ padding: '5px 0', color: '#721c24' }}>
                        • {file.filename}: {file.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadResults.created_datasets && uploadResults.created_datasets.length > 0 && (
                <div style={{
                  background: '#d1ecf1',
                  border: '1px solid #bee5eb',
                  borderRadius: '8px',
                  padding: '15px',
                  marginTop: '15px'
                }}>
                  <p style={{ color: '#0c5460', fontWeight: '600' }}>
                    📝 {uploadResults.created_datasets.length} dataset entries created
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onClose}
            disabled={uploading}
          >
            {uploadResults ? 'Done' : 'Cancel'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkUploadModal;
