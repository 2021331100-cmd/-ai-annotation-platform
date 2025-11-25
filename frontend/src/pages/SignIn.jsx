import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { login as loginApi, getOAuthProviders, initiateOAuthLogin } from '../api'
import { useAuthStore } from '../store/authStore'
import '../styles/Auth.css'

function SignIn() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const login = useAuthStore((state) => state.login)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [oauthProviders, setOAuthProviders] = useState([])

  useEffect(() => {
    // Check for OAuth callback token
    const token = searchParams.get('token')
    const userDataStr = searchParams.get('user')
    
    if (token && userDataStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userDataStr))
        const normalizedUser = {
          ...user,
          id: user.id || user.user_id,
          user_id: user.user_id || user.id
        }
        login(normalizedUser, token)
        
        const dashboardRoutes = {
          'Admin': '/admin/dashboard',
          'Manager': '/manager/dashboard',
          'Reviewer': '/reviewer/dashboard',
          'Annotator': '/annotator/dashboard',
        }
        navigate(dashboardRoutes[normalizedUser.role] || '/annotator/dashboard')
      } catch (err) {
        console.error('OAuth callback error:', err)
        setError('OAuth authentication failed')
      }
    }

    // Load OAuth providers
    loadOAuthProviders()
  }, [searchParams, login, navigate])

  const loadOAuthProviders = async () => {
    try {
      const response = await getOAuthProviders()
      setOAuthProviders(response.data || [])
    } catch (error) {
      console.error('Failed to load OAuth providers:', error)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Call the real authentication endpoint
      const response = await loginApi(formData.username, formData.password)
      const { access_token, user } = response.data
      
      // Normalize user object to include both 'id' and 'user_id' for frontend consistency
      const normalizedUser = {
        ...user,
        id: user.id || user.user_id,
        user_id: user.user_id || user.id
      }
      
      // Store token and user info
      login(normalizedUser, access_token)
      
      // Navigate to appropriate dashboard
      const dashboardRoutes = {
        'Admin': '/admin/dashboard',
        'Manager': '/manager/dashboard',
        'Reviewer': '/reviewer/dashboard',
        'Annotator': '/annotator/dashboard',
      }
      
      navigate(dashboardRoutes[normalizedUser.role] || '/annotator/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to sign in. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="back-to-home">← Back to Home</Link>
          <h1>🎯 Welcome Back</h1>
          <p>Sign in to your account</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="Enter your username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                style={{ paddingRight: '45px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  padding: '5px',
                  color: '#666'
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        {oauthProviders.length > 0 && (
          <>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              margin: '1.5rem 0', 
              gap: '1rem' 
            }}>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
              <span style={{ color: '#666', fontSize: '0.9rem' }}>or continue with</span>
              <div style={{ flex: 1, height: '1px', background: '#ddd' }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {oauthProviders.includes('google') && (
                <button
                  type="button"
                  onClick={() => initiateOAuthLogin('google')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    background: '#fff',
                    color: '#333',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#f5f5f5'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#fff'}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18">
                    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                    <path fill="#FBBC05" d="M3.964 10.71c-.18-.54-.282-1.117-.282-1.71s.102-1.17.282-1.71V4.958H.957C.347 6.173 0 7.548 0 9s.348 2.827.957 4.042l3.007-2.332z"/>
                    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                  </svg>
                  Continue with Google
                </button>
              )}
              
              {oauthProviders.includes('github') && (
                <button
                  type="button"
                  onClick={() => initiateOAuthLogin('github')}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid #24292e',
                    background: '#24292e',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#1b1f23'}
                  onMouseOut={(e) => e.currentTarget.style.background = '#24292e'}
                >
                  <svg width="18" height="18" viewBox="0 0 16 16" fill="white">
                    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
                  </svg>
                  Continue with GitHub
                </button>
              )}
            </div>
          </>
        )}

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
        </div>
      </div>
    </div>
  )
}

export default SignIn
