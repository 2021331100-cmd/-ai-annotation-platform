import { useState, useEffect } from 'react';
import { getAuditLogs } from '../api';
import '../styles/Modal.css';

export default function AuditLogModal({ isOpen, onClose, userId = null }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, userId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const params = userId ? { user_id: userId } : {};
      const response = await getAuditLogs(params);
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
    setLoading(false);
  };

  const filteredLogs = logs.filter(log => {
    if (filter === 'all') return true;
    return log.action_type === filter;
  });

  const getActionColor = (action) => {
    const colors = {
      'create': '#22c55e',
      'update': '#3b82f6',
      'delete': '#ef4444',
      'login': '#8b5cf6',
      'logout': '#6b7280'
    };
    return colors[action] || '#6b7280';
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📋 Audit Logs</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          <div style={{ marginBottom: '20px' }}>
            <label style={{ marginRight: '10px', fontWeight: '500' }}>Filter by Action:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ 
                padding: '8px 12px', 
                borderRadius: '6px', 
                border: '1px solid #e5e7eb',
                fontSize: '14px'
              }}
            >
              <option value="all">All Actions</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
            </select>
            <button 
              onClick={loadLogs} 
              style={{ 
                marginLeft: '10px', 
                padding: '8px 16px', 
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              🔄 Refresh
            </button>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>Loading logs...</p>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: '#6b7280', fontSize: '16px' }}>No audit logs found</p>
              <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
                System activities will appear here
              </p>
            </div>
          ) : (
            <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: '#f9fafb' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Action</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Entity</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>User</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Details</th>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #e5e7eb' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr key={log.log_id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          padding: '4px 12px', 
                          borderRadius: '12px', 
                          backgroundColor: getActionColor(log.action_type) + '20',
                          color: getActionColor(log.action_type),
                          fontWeight: '500',
                          fontSize: '13px'
                        }}>
                          {log.action_type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontWeight: '500' }}>{log.entity_type}</div>
                        <div style={{ fontSize: '12px', color: '#6b7280' }}>ID: {log.entity_id}</div>
                      </td>
                      <td style={{ padding: '12px', color: '#374151' }}>
                        User #{log.user_id}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ fontSize: '13px', color: '#6b7280', maxWidth: '300px', wordWrap: 'break-word' }}>
                          {log.details || '-'}
                        </div>
                      </td>
                      <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280', whiteSpace: 'nowrap' }}>
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Total logs: {filteredLogs.length}
          </p>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    </div>
  );
}
