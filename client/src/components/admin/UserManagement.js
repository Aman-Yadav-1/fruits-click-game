import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, Badge, Card } from 'react-bootstrap';
import { FaEdit, FaTrash, FaBan, FaUserPlus, FaUnlock, FaUserCheck, FaUserSlash } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { userAPI } from '../../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'player',
    isBlocked: false
  });

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Try to get users from API first
      try {
        const response = await userAPI.getAllUsers();
        setUsers(response.data);
      } catch (apiError) {
        // If API fails, get real logged-in users from localStorage
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
          setUsers(allUsers);
        } else {
          // Fallback to mock data if no real users exist
          setUsers([
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
          ]);
        }
      }
    } catch (error) {
      toast.error('Failed to load user management');
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Open modal for creating a new user
  const handleCreateUser = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'player',
      isBlocked: false
    });
    setModalMode('create');
    setShowModal(true);
  };

  // Open modal for editing a user
  const handleEditUser = (user) => {
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't show password in edit mode
      role: user.role,
      isBlocked: user.isBlocked
    });
    setCurrentUser(user);
    setModalMode('edit');
    setShowModal(true);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        // Create new user
        await userAPI.createUser(formData);
        toast.success('User created successfully');
      } else {
        // Update existing user
        const updateData = { ...formData };
        
        // Only include password if it was changed
        if (!updateData.password) {
          delete updateData.password;
        }
        
        await userAPI.updateUser(currentUser._id, updateData);
        toast.success('User updated successfully');
      }
      
      // Refresh users list
      fetchUsers();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save user');
    }
  };

  // Handle user deletion
  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setLoading(true);
        await userAPI.deleteUser(userId);
        toast.success('User deleted successfully');
        fetchUsers(); // Refresh user list
      } catch (error) {
        toast.error('Failed to delete user');
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle blocking/unblocking a user
  const handleToggleBlockUser = async (userId, isCurrentlyBlocked) => {
    try {
      await userAPI.toggleBlockUser(userId, !isCurrentlyBlocked);
      toast.success(
        isCurrentlyBlocked ? 'User unblocked successfully' : 'User blocked successfully'
      );
      fetchUsers();
    } catch (error) {
      console.error('Error toggling user block status:', error);
      toast.error('Failed to update user status');
    }
  };

  return (
    <Container className="py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>User Management</h1>
        <Button variant="success" onClick={handleCreateUser}>
          <FaUserPlus className="me-2" /> Add New User
        </Button>
      </div>
      
      <Card>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading users...</p>
            </div>
          ) : (
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Banana Clicks</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => (
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
                          <Badge bg={user.isActive ? 'success' : 'secondary'}>
                            {user.isActive ? (
                              <>
                                <FaUserCheck className="me-1" /> Active
                              </>
                            ) : (
                              <>
                                <FaUserSlash className="me-1" /> Inactive
                              </>
                            )}
                          </Badge>
                        )}
                      </td>
                      <td>{user.bananaCount}</td>
                      <td>
                        <div className="admin-action-buttons">
                          <Button 
                            variant="primary" 
                            size="sm" 
                            onClick={() => handleEditUser(user)}
                          >
                            <FaEdit />
                          </Button>
                          
                          <Button 
                            variant={user.isBlocked ? 'success' : 'warning'} 
                            size="sm" 
                            onClick={() => handleToggleBlockUser(user._id, user.isBlocked)}
                          >
                            {user.isBlocked ? <FaUnlock /> : <FaBan />}
                          </Button>
                          
                          <Button 
                            variant="danger" 
                            size="sm" 
                            onClick={() => handleDeleteUser(user._id)}
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4">
                      No users found
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
      
      {/* User Form Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Add New User' : 'Edit User'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Form.Group className="mb-3" controlId="username">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="email">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="password">
              <Form.Label>
                {modalMode === 'create' ? 'Password' : 'Password (leave blank to keep current)'}
              </Form.Label>
              <Form.Control
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required={modalMode === 'create'}
              />
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="role">
              <Form.Label>Role</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="player">Player</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
            
            <Form.Group className="mb-3" controlId="isBlocked">
              <Form.Check
                type="checkbox"
                label="Block User"
                name="isBlocked"
                checked={formData.isBlocked}
                onChange={handleChange}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {modalMode === 'create' ? 'Create User' : 'Update User'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default UserManagement;
