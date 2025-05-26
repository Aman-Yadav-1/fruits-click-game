import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaSignInAlt, FaBan, FaArrowRight } from 'react-icons/fa';
import { GiBanana } from 'react-icons/gi';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  
  const { email, password } = formData;
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!email || !password) {
      return setError('Please fill in all fields');
    }
    
    // SPECIAL CASE: Direct admin login for admin@example.com
    if (email === 'admin@example.com' && password === 'admin123') {
      try {
        setError('');
        setLoading(true);
        
        // Set admin data directly in localStorage
        const adminToken = 'admin-token-' + Date.now();
        const adminUser = {
          id: 'admin-id',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          bananaCount: 0,
          isBlocked: false
        };
        
        // Store admin session data
        localStorage.setItem('token', adminToken);
        localStorage.setItem('user_role', 'admin');
        localStorage.setItem('user_data', JSON.stringify(adminUser));
        
        // Show success message
        toast.success('Admin login successful!');
        
        // Force hard redirect to admin dashboard
        window.location.replace('/admin/dashboard');
        return;
      } catch (error) {
        console.error('Admin login error:', error);
        setError('Failed to log in as admin');
        setLoading(false);
        return;
      }
    }
    
    // Regular login flow for non-admin users
    try {
      setError('');
      setLoading(true);
      
      // Regular login flow
      const result = await login({ email, password });
      
      if (result.success) {
        // Check if the logged-in user is an admin
        if (result.user && result.user.role === 'admin') {
          console.log('Admin user detected, redirecting to admin dashboard');
          navigate('/admin/dashboard');
        } else {
          // Regular user, redirect to home
          navigate('/player/home');
        }
      } else {
        setError(result.error || 'Failed to log in');
      }
    } catch (error) {
      setError('Failed to log in. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="auth-page">
      {/* Left side - Branding */}
      <div className="auth-left">
        {/* Decorative circles */}
        <div className="auth-circles">
          <div className="auth-circle auth-circle-1"></div>
          <div className="auth-circle auth-circle-2"></div>
          <div className="auth-circle auth-circle-3"></div>
        </div>
        
        <GiBanana className="app-logo" style={{ color: '#FFD700' }} />
        <h1 className="banana-title">Banana Clicker</h1>
        <p className="banana-subtitle">
          The ultimate banana clicking experience. Click, upgrade, and climb the rankings!
        </p>
      </div>
      
      {/* Right side - Login Form */}
      <div className="auth-right">
        <div className="auth-container">
          <h2 className="auth-header">Welcome Back!</h2>
          <p className="text-center text-muted mb-5" style={{ fontSize: '1.2rem', padding: '0 1rem' }}>Sign in to continue your banana clicking journey</p>
          
          {error && (
            <Alert variant="danger" className="py-3 mb-4 text-center" style={{ borderRadius: '10px' }}>
              <FaBan className="me-2" style={{ fontSize: '1.2rem' }} /> {error}
            </Alert>
          )}
          
          <Form id="login-form" className="auth-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Form.Group className="auth-input-group">
              <Form.Control
                type="email"
                placeholder="Email address"
                className="auth-form-control"
                value={email}
                onChange={handleChange}
                name="email"
                required
                style={{ fontSize: '1.1rem' }}
              />
              <FaUser className="auth-input-icon" />
            </Form.Group>
            
            <Form.Group className="auth-input-group">
              <Form.Control
                type="password"
                placeholder="Password"
                className="auth-form-control"
                value={password}
                onChange={handleChange}
                name="password"
                required
                style={{ fontSize: '1.1rem' }}
              />
              <FaLock className="auth-input-icon" />
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              className="auth-btn w-100"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Logging in...
                </>
              ) : (
                <>
                  Sign In <FaArrowRight className="ms-2" />
                </>
              )}
            </Button>
            

            
            <div className="text-center mt-5">
              <p className="mb-0" style={{ fontSize: '1.05rem' }}>
                Don't have an account? <Link to="/register" className="auth-link">Create Account</Link>
              </p>
              <p className="mt-3" style={{ fontSize: '0.9rem' }}>
                <Link 
                  to="#" 
                  className="text-muted"
                  onClick={(e) => {
                    e.preventDefault();
                    setFormData({
                      email: 'admin@example.com',
                      password: 'admin123'
                    });
                    setTimeout(() => {
                      document.getElementById('login-form').dispatchEvent(
                        new Event('submit', { cancelable: true, bubbles: true })
                      );
                    }, 100);
                  }}
                >
                  Admin Access
                </Link>
              </p>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Login;
