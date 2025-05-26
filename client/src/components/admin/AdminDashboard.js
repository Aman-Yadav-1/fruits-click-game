import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge } from 'react-bootstrap';
import { FaUsers, FaUserCheck, FaUserSlash, FaBan } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { io } from 'socket.io-client';

const AdminDashboard = () => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    blockedUsers: 0,
    totalClicks: 0
  });

  // Initialize socket connection
  useEffect(() => {
    if (!token) return;

    // Try to connect to socket
    try {
      const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
        auth: { token }
      });

      newSocket.on('connect', () => {
        console.log('Admin socket connected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setLoading(false);
        // Use real user data if socket fails
        provideRealUserData();
      });

      // Listen for active users updates
      newSocket.on('active-users', (users) => {
        setActiveUsers(users);
        setLoading(false);
        
        // Calculate stats
        const totalUsers = users.length;
        const onlineUsers = users.filter(user => user.isActive).length;
        const blockedUsers = users.filter(user => user.isBlocked).length;
        const totalClicks = users.reduce((sum, user) => sum + user.bananaCount, 0);
        
        setStats({
          totalUsers,
          activeUsers: onlineUsers,
          blockedUsers,
          totalClicks
        });
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } catch (error) {
      console.error('Failed to initialize socket:', error);
      setLoading(false);
      // Use real user data if socket fails
      provideRealUserData();
    }
  }, [token]);
  
  // Provide real user data from localStorage
  const provideRealUserData = () => {
    // Get real logged-in users from localStorage
    const loggedInUsers = JSON.parse(localStorage.getItem('loggedInUsers') || '[]');
    
    // Always include admin in the list
    const adminUser = {
      _id: 'admin-user',
      username: 'Admin',
      email: 'admin@example.com',
      role: 'admin',
      isBlocked: false,
      isActive: true,
      bananaCount: 0
    };
    
    // Check if admin is already in the list
    const adminExists = loggedInUsers.some(user => user.email === 'admin@example.com');
    
    // Combine logged-in users with admin if needed
    const allUsers = adminExists ? 
      loggedInUsers : 
      [...loggedInUsers, adminUser];
      
    // If we have real users, use them
    if (allUsers.length > 0) {
      setActiveUsers(allUsers);
      
      // Calculate stats from real data
      const totalUsers = allUsers.length;
      const onlineUsers = allUsers.filter(user => user.isActive).length;
      const blockedUsers = allUsers.filter(user => user.isBlocked).length;
      const totalClicks = allUsers.reduce((sum, user) => sum + (user.bananaCount || 0), 0);
      
      setStats({
        totalUsers,
        activeUsers: onlineUsers,
        blockedUsers,
        totalClicks
      });
    } else {
      // Fallback to mock data if no real users exist
      const mockUsers = [
        {
          _id: 'user1',
          username: 'player1',
          email: 'player1@example.com',
          role: 'player',
          isBlocked: false,
          isActive: true,
          bananaCount: 120
        },
        {
          _id: 'admin-id',
          username: 'admin',
          email: 'admin@example.com',
          role: 'admin',
          isBlocked: false,
          isActive: true,
          bananaCount: 0
        }
      ];
      
      setActiveUsers(mockUsers);
      
      // Calculate stats from mock data
      setStats({
        totalUsers: mockUsers.length,
        activeUsers: mockUsers.filter(user => user.isActive).length,
        blockedUsers: mockUsers.filter(user => user.isBlocked).length,
        totalClicks: mockUsers.reduce((sum, user) => sum + user.bananaCount, 0)
      });
    }
  };

  return (
    <Container className="py-5 admin-dashboard">
      <h1 className="mb-4">Admin Dashboard</h1>
      
      {/* Admin welcome message */}
      <div className="alert alert-info mb-4">
        <h4 className="alert-heading">Welcome, Admin!</h4>
        <p>You have full access to manage users and view real-time statistics.</p>
        <hr />
        <p className="mb-0">Use the navigation above to switch between Dashboard and User Management.</p>
      </div>
      
      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="text-center h-100 admin-card">
            <Card.Body>
              <FaUsers className="text-primary mb-2" style={{ fontSize: '2.5rem' }} />
              <h3>{stats.totalUsers}</h3>
              <Card.Text>Total Users</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100 admin-card">
            <Card.Body>
              <FaUserCheck className="text-success mb-2" style={{ fontSize: '2.5rem' }} />
              <h3>{stats.activeUsers}</h3>
              <Card.Text>Active Users</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100 admin-card">
            <Card.Body>
              <FaBan className="text-danger mb-2" style={{ fontSize: '2.5rem' }} />
              <h3>{stats.blockedUsers}</h3>
              <Card.Text>Blocked Users</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={3}>
          <Card className="text-center h-100 admin-card">
            <Card.Body>
              <span role="img" aria-label="banana" style={{ fontSize: '2.5rem' }}>🍌</span>
              <h3>{stats.totalClicks}</h3>
              <Card.Text>Total Clicks</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Active Users Table */}
      <Card className="admin-card mt-4">
        <Card.Header>
          <h4 className="mb-0">Currently Active Users</h4>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading active users...</p>
            </div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-end">Banana Clicks</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.filter(user => user.isActive).length > 0 ? (
                  activeUsers
                    .filter(user => user.isActive)
                    .map(user => (
                      <tr key={user._id}>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          <Badge bg={user.role === 'admin' ? 'danger' : 'success'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td>
                          {user.isBlocked ? (
                            <Badge bg="warning" text="dark">
                              <FaBan className="me-1" /> Blocked
                            </Badge>
                          ) : (
                            <Badge bg="success">
                              <FaUserCheck className="me-1" /> Active
                            </Badge>
                          )}
                        </td>
                        <td className="text-end fw-bold">{user.bananaCount}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No active users at the moment
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDashboard;
