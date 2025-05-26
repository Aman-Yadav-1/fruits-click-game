import React from 'react';
import { Navbar as BootstrapNavbar, Nav, Container, Button } from 'react-bootstrap';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FaBan, FaUser, FaSignOutAlt, FaTrophy, FaHome, FaCrown } from 'react-icons/fa';
import { GiBanana } from 'react-icons/gi';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };
  
  const location = useLocation();
  
  // Check if a path is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  return (
    <BootstrapNavbar variant="dark" expand="lg" className="navbar">
      <Container>
        <BootstrapNavbar.Brand as={Link} to="/">
          <GiBanana className="me-2" style={{ fontSize: '1.5rem' }} /> Banana Clicker
        </BootstrapNavbar.Brand>
        
        <BootstrapNavbar.Toggle aria-controls="navbar-nav" />
        
        <BootstrapNavbar.Collapse id="navbar-nav">
          <Nav className="me-auto">
            {isAuthenticated && user?.role === 'admin' && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/admin/dashboard"
                  className={isActive('/admin/dashboard') ? 'active' : ''}
                >
                  <FaCrown className="me-2" /> Dashboard
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/admin/users"
                  className={isActive('/admin/users') ? 'active' : ''}
                >
                  <FaUser className="me-2" /> Users
                </Nav.Link>
              </>
            )}
            
            {isAuthenticated && user?.role === 'player' && (
              <>
                <Nav.Link 
                  as={Link} 
                  to="/player/home"
                  className={isActive('/player/home') ? 'active' : ''}
                >
                  <FaHome className="me-2" /> Home
                </Nav.Link>
                <Nav.Link 
                  as={Link} 
                  to="/player/rankings"
                  className={isActive('/player/rankings') ? 'active' : ''}
                >
                  <FaTrophy className="me-2" /> Rankings
                </Nav.Link>
              </>
            )}
          </Nav>
          
          <Nav>
            {isAuthenticated ? (
              <div className="d-flex align-items-center">
                <div className="user-badge">
                  <div className="user-avatar">
                    {user?.role === 'admin' ? <FaCrown /> : <FaUser />}
                  </div>
                  <span>{user?.username}</span>
                  {user?.role === 'admin' && (
                    <span className="role-badge role-admin">Admin</span>
                  )}
                  {user?.role === 'player' && (
                    <span className="role-badge role-player">Player</span>
                  )}
                </div>
                
                <Button 
                  onClick={handleLogout}
                  className="btn-nav"
                >
                  <FaSignOutAlt /> Logout
                </Button>
              </div>
            ) : (
              <div className="d-flex">
                <Nav.Link as={Link} to="/login" className="btn-nav me-2">
                  <FaUser className="me-1" /> Sign In
                </Nav.Link>
                <Nav.Link as={Link} to="/register" className="btn-nav">
                  <FaUser className="me-1" /> Register
                </Nav.Link>
              </div>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
};

export default Navbar;
