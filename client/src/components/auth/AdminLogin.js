import React, { useEffect } from 'react';
import { Container, Card, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FaCrown } from 'react-icons/fa';
import { toast } from 'react-toastify';

const AdminLogin = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Create a direct admin login that bypasses the normal auth flow
    const setupAdminSession = () => {
      // Set admin data in localStorage
      localStorage.setItem('token', 'admin-token-' + Date.now());
      localStorage.setItem('user_role', 'admin');
      localStorage.setItem('user_data', JSON.stringify({
        id: 'admin-id',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        bananaCount: 0,
        isBlocked: false
      }));

      // Show success message
      toast.success('Admin login successful!');
      
      // Force reload to ensure all components recognize the admin status
      window.location.href = '/admin/dashboard';
    };

    // Execute admin login
    setupAdminSession();
  }, [navigate]);

  return (
    <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <Card className="text-center p-5 shadow" style={{ maxWidth: '500px' }}>
        <div className="mb-4">
          <FaCrown style={{ fontSize: '4rem', color: '#ff3b5c' }} />
        </div>
        <h2>Admin Access</h2>
        <p className="text-muted mb-4">Setting up admin session...</p>
        <Spinner animation="border" variant="primary" />
      </Card>
    </Container>
  );
};

export default AdminLogin;
