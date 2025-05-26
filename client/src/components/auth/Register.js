import React, { useState } from 'react';
import { Form, Button, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { FaUser, FaEnvelope, FaLock, FaUserPlus, FaBan, FaArrowRight } from 'react-icons/fa';
import { GiBanana } from 'react-icons/gi';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const { username, email, password, confirmPassword } = formData;
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!username || !email || !password || !confirmPassword) {
      return setError('Please fill in all fields');
    }
    
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    
    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Check if this is an admin email
      const role = email === 'admin@example.com' ? 'admin' : 'player';
      
      const result = await register({
        username,
        email,
        password,
        role: role // Set role based on email
      });
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Failed to register');
      }
    } catch (error) {
      setError('Failed to register. Please try again.');
      console.error('Registration error:', error);
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
          Join thousands of players in the ultimate banana clicking competition!
        </p>
      </div>
      
      {/* Right side - Register Form */}
      <div className="auth-right">
        <div className="auth-container">
          <h2 className="auth-header">Create Account</h2>
          <p className="text-center text-muted mb-5" style={{ fontSize: '1.2rem', padding: '0 1rem' }}>Join thousands of players in the banana clicking revolution</p>
          
          {error && (
            <Alert variant="danger" className="py-3 mb-4 text-center" style={{ borderRadius: '10px' }}>
              <FaBan className="me-2" style={{ fontSize: '1.2rem' }} /> {error}
            </Alert>
          )}
          
          <Form className="auth-form" onSubmit={handleSubmit} style={{ width: '100%' }}>
            <Form.Group className="auth-input-group">
              <Form.Control
                className="auth-form-control"
                type="text"
                name="username"
                value={username}
                onChange={handleChange}
                placeholder="Username"
                required
                style={{ fontSize: '1.1rem' }}
              />
              <FaUser className="auth-input-icon" />
            </Form.Group>
            
            <Form.Group className="auth-input-group">
              <Form.Control
                className="auth-form-control"
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="Email address"
                required
                style={{ fontSize: '1.1rem' }}
              />
              <FaEnvelope className="auth-input-icon" />
            </Form.Group>
            
            <Form.Group className="auth-input-group">
              <Form.Control
                className="auth-form-control"
                type="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Password (min 6 characters)"
                required
                style={{ fontSize: '1.1rem' }}
              />
              <FaLock className="auth-input-icon" />
            </Form.Group>
            
            <Form.Group className="auth-input-group">
              <Form.Control
                className="auth-form-control"
                type="password"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                placeholder="Confirm password"
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
                  Creating Account...
                </>
              ) : (
                <>
                  Create Account <FaArrowRight className="ms-2" />
                </>
              )}
            </Button>
            
            <div className="text-center mt-5">
              <p className="mb-0" style={{ fontSize: '1.05rem' }}>
                Already have an account? <Link to="/login" className="auth-link">Sign In</Link>
              </p>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Register;
