import React from 'react'
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom'
import './App.css'
import { useAuthStore } from './store/authStore'
import HomePage from './pages/HomePage'
import SignUp from './pages/SignUp'
import SignIn from './pages/SignIn'
import AdminDashboard from './pages/AdminDashboard'
import AnnotatorDashboard from './pages/AnnotatorDashboard'
import ReviewerDashboard from './pages/ReviewerDashboard'
import ManagerDashboard from './pages/ManagerDashboard'
import Users from './pages/Users'
import Projects from './pages/Projects'
import Tasks from './pages/Tasks'
import Annotations from './pages/Annotations'
import Reviews from './pages/Reviews'
import AdvancedFeatures from './pages/AdvancedFeatures'

function PrivateRoute({ children, allowedRoles }) {
  const { user, isAuthenticated } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" />
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" />
  }
  
  return children
}

function App() {
  const { user, isAuthenticated, logout } = useAuthStore()

  const getDashboardRoute = () => {
    if (!user) return '/'
    switch (user.role) {
      case 'Admin': return '/admin/dashboard'
      case 'Manager': return '/manager/dashboard'
      case 'Reviewer': return '/reviewer/dashboard'
      case 'Annotator': return '/annotator/dashboard'
      default: return '/'
    }
  }

  return (
    <Router>
      <div className="app">
        {isAuthenticated && (
          <nav className="navbar">
            <div className="navbar-brand">
              <h1>🎯 AI Annotation Platform</h1>
            </div>
            <div className="navbar-menu">
              <Link to={getDashboardRoute()} className="navbar-item">Dashboard</Link>
              {(user?.role === 'Admin' || user?.role === 'Manager') && (
                <>
                  <Link to="/users" className="navbar-item">Users</Link>
                  <Link to="/projects" className="navbar-item">Projects</Link>
                </>
              )}
              <Link to="/tasks" className="navbar-item">Tasks</Link>
              <Link to="/annotations" className="navbar-item">Annotations</Link>
              {(user?.role === 'Reviewer' || user?.role === 'Admin') && (
                <Link to="/reviews" className="navbar-item">Reviews</Link>
              )}
              <Link to="/advanced" className="navbar-item" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                borderRadius: '6px',
                padding: '8px 16px'
              }}>
                🚀 Advanced
              </Link>
            </div>
            <div className="navbar-user">
              <span className="user-info">{user?.username} ({user?.role})</span>
              <button onClick={logout} className="btn-logout">Logout</button>
            </div>
          </nav>
        )}

        <main className="main-content">
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to={getDashboardRoute()} /> : <HomePage />} />
            <Route path="/signup" element={!isAuthenticated ? <SignUp /> : <Navigate to={getDashboardRoute()} />} />
            <Route path="/signin" element={!isAuthenticated ? <SignIn /> : <Navigate to={getDashboardRoute()} />} />
            
            <Route path="/admin/dashboard" element={
              <PrivateRoute allowedRoles={['Admin']}>
                <AdminDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/manager/dashboard" element={
              <PrivateRoute allowedRoles={['Manager', 'Admin']}>
                <ManagerDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/reviewer/dashboard" element={
              <PrivateRoute allowedRoles={['Reviewer', 'Admin']}>
                <ReviewerDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/annotator/dashboard" element={
              <PrivateRoute allowedRoles={['Annotator', 'Admin']}>
                <AnnotatorDashboard />
              </PrivateRoute>
            } />
            
            <Route path="/users" element={
              <PrivateRoute allowedRoles={['Admin', 'Manager']}>
                <Users />
              </PrivateRoute>
            } />
            
            <Route path="/projects" element={
              <PrivateRoute allowedRoles={['Admin', 'Manager']}>
                <Projects />
              </PrivateRoute>
            } />
            
            <Route path="/tasks" element={
              <PrivateRoute>
                <Tasks />
              </PrivateRoute>
            } />
            
            <Route path="/annotations" element={
              <PrivateRoute>
                <Annotations />
              </PrivateRoute>
            } />
            
            <Route path="/reviews" element={
              <PrivateRoute allowedRoles={['Reviewer', 'Admin']}>
                <Reviews />
              </PrivateRoute>
            } />
            
            <Route path="/advanced" element={
              <PrivateRoute>
                <AdvancedFeatures />
              </PrivateRoute>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
