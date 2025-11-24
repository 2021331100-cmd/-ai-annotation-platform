import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginApi } from '../api'
import { useAuthStore } from '../store/authStore'
import '../styles/Auth.css'

function SignIn() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
        </div>
      </div>
    </div>
  )
}

export default SignIn
