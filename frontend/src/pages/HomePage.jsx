import React from 'react'
import { Link } from 'react-router-dom'
import '../styles/HomePage.css'

function HomePage() {
  return (
    <div className="homepage">
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">🎯 AI Data Annotation Platform</h1>
          <p className="hero-subtitle">
            Enterprise-grade annotation platform with AI-powered workflows,
            task management, and collaborative review processes
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
            <Link to="/signin" className="btn btn-secondary">Sign In</Link>
          </div>
        </div>
      </div>

      <div className="features-section">
        <h2>Platform Features</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI-Powered Annotation</h3>
            <p>Leverage AI to assist with annotations, improving speed and accuracy</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>Role-Based Access</h3>
            <p>Admin, Manager, Reviewer, and Annotator roles with tailored dashboards</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Project Management</h3>
            <p>Organize work into projects with datasets, labels, and task assignments</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">✅</div>
            <h3>Review Workflows</h3>
            <p>Multi-stage review process with approval, rejection, and feedback</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Analytics & Insights</h3>
            <p>Track progress, quality metrics, and team performance</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Real-time Notifications</h3>
            <p>Stay updated with task assignments, reviews, and project updates</p>
          </div>
        </div>
      </div>

      <div className="explore-section">
        <h2>Explore More</h2>
        <div className="explore-grid">
          <Link to="/quality" className="explore-card">
            <div className="explore-icon">📊</div>
            <h3>Quality Metrics</h3>
            <p>View quality scores, inter-annotator agreement, and performance analytics</p>
          </Link>
          
          <Link to="/annotation-types" className="explore-card">
            <div className="explore-icon">🎨</div>
            <h3>Annotation Types</h3>
            <p>Discover all supported annotation types including text, image, and video</p>
          </Link>
          
          <Link to="/resources" className="explore-card">
            <div className="explore-icon">📚</div>
            <h3>Resources</h3>
            <p>Access documentation, tutorials, and learning materials</p>
          </Link>
        </div>
      </div>

      <div className="roles-section">
        <h2>Designed for Every Role</h2>
        <div className="roles-grid">
          <div className="role-card">
            <h3>👑 Admin</h3>
            <p>Full system control, user management, and platform oversight</p>
          </div>
          <div className="role-card">
            <h3>📋 Manager</h3>
            <p>Project creation, task assignment, and team coordination</p>
          </div>
          <div className="role-card">
            <h3>🔍 Reviewer</h3>
            <p>Quality assurance, annotation review, and approval workflows</p>
          </div>
          <div className="role-card">
            <h3>✏️ Annotator</h3>
            <p>Data labeling, annotation tasks, and AI-assisted workflows</p>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join our platform and streamline your data annotation workflow today</p>
        <Link to="/signup" className="btn btn-large btn-primary">Create Free Account</Link>
      </div>
    </div>
  )
}

export default HomePage
