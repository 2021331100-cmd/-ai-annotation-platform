import { useState, useEffect } from 'react';
import { getUserNotifications, markNotificationRead } from '../api';
import { useAuthStore } from '../store/authStore';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const uid = user.user_id || user.id
      const response = await getUserNotifications(uid);
      const data = response.data || []
      // Normalize fields: created_date is used by backend
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationRead(notificationId);
      setNotifications(notifications.map(n => 
        n.notification_id === notificationId ? { ...n, is_read: true } : n
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'task': '📋',
      'review': '🔍'
    };
    return icons[type] || 'ℹ️';
  };

  const getNotificationColor = (type) => {
    const colors = {
      'info': '#3b82f6',
      'success': '#22c55e',
      'warning': '#f59e0b',
      'error': '#ef4444',
      'task': '#8b5cf6',
      'review': '#06b6d4'
    };
    return colors[type] || '#6b7280';
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        style={{
          position: 'relative',
          background: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '10px 14px',
          cursor: 'pointer',
          fontSize: '20px',
          transition: 'all 0.2s'
        }}
        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-5px',
            right: '-5px',
            backgroundColor: '#ef4444',
            color: 'white',
            borderRadius: '50%',
            padding: '2px 6px',
            fontSize: '11px',
            fontWeight: 'bold',
            minWidth: '18px',
            textAlign: 'center'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 999
            }}
            onClick={() => setShowDropdown(false)}
          />
          <div style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            width: '400px',
            maxHeight: '500px',
            overflowY: 'auto',
            zIndex: 1000
          }}>
            <div style={{
              padding: '16px',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              zIndex: 1
            }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>Notifications</h3>
              <button
                onClick={loadNotifications}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px'
                }}
                title="Refresh"
              >
                🔄
              </button>
            </div>

            {notifications.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <p style={{ color: '#6b7280', margin: 0 }}>No notifications</p>
                <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div>
                {notifications.map((notification) => (
                  <div
                    key={notification.notification_id}
                    style={{
                      padding: '16px',
                      borderBottom: '1px solid #f3f4f6',
                      backgroundColor: notification.is_read ? 'white' : '#f0f9ff',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onClick={() => {
                      if (!notification.is_read) {
                        handleMarkAsRead(notification.notification_id);
                      }
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = notification.is_read ? 'white' : '#f0f9ff'}
                  >
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ 
                        fontSize: '24px',
                        flexShrink: 0
                      }}>
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'start',
                          marginBottom: '4px'
                        }}>
                          <span style={{
                            fontSize: '12px',
                            fontWeight: '600',
                            color: getNotificationColor(notification.notification_type),
                            textTransform: 'uppercase'
                          }}>
                            {notification.notification_type}
                          </span>
                          {!notification.is_read && (
                            <span style={{
                              width: '8px',
                              height: '8px',
                              backgroundColor: '#3b82f6',
                              borderRadius: '50%',
                              flexShrink: 0
                            }} />
                          )}
                        </div>
                        <p style={{ 
                          margin: '0 0 4px 0', 
                          fontSize: '14px',
                          color: '#111827',
                          fontWeight: notification.is_read ? 'normal' : '500'
                        }}>
                          {notification.message}
                        </p>
                          <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                            {new Date(notification.created_date || notification.created_at || Date.now()).toLocaleString()}
                          </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
