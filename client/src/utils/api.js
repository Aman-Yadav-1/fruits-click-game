import axios from 'axios';

// Set base URL for API requests
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance with the base URL
axios.defaults.baseURL = API_URL;

// Mock data for admin mode
let mockUsers = [
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
    _id: 'user2',
    username: 'player2',
    email: 'player2@example.com',
    role: 'player',
    isBlocked: false,
    isActive: false,
    bananaCount: 85
  },
  {
    _id: 'user3',
    username: 'blockedUser',
    email: 'blocked@example.com',
    role: 'player',
    isBlocked: true,
    isActive: false,
    bananaCount: 30
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

// Check if we're in admin mode
const isAdminMode = () => {
  const token = localStorage.getItem('token');
  return token && token.startsWith('admin-token-');
};

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle unauthorized errors (token expired, etc.)
    if (error.response && error.response.status === 401) {
      // Check if this is an admin token - don't log out admin users
      if (!isAdminMode()) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Create mock API response
const createMockResponse = (data) => {
  return Promise.resolve({ data });
};

// Auth API functions
export const authAPI = {
  register: (userData) => {
    if (isAdminMode()) {
      // Mock registration for admin mode
      return createMockResponse({ token: 'mock-token', user: userData });
    }
    return api.post('/auth/register', userData);
  },
  login: (credentials) => {
    if (isAdminMode()) {
      // Mock login for admin mode
      return createMockResponse({ token: 'mock-token', user: { email: credentials.email, role: 'admin' } });
    }
    return api.post('/auth/login', credentials);
  },
  logout: () => {
    if (isAdminMode()) {
      // Mock logout for admin mode
      return createMockResponse({ success: true });
    }
    return api.post('/auth/logout');
  }
};

// User API functions
export const userAPI = {
  getAllUsers: () => {
    if (isAdminMode()) {
      // Return mock users for admin mode
      return createMockResponse(mockUsers);
    }
    return api.get('/users');
  },
  getActiveUsers: () => {
    if (isAdminMode()) {
      // Return active mock users for admin mode
      return createMockResponse(mockUsers.filter(user => user.isActive));
    }
    return api.get('/users/active');
  },
  getUserById: (id) => {
    if (isAdminMode()) {
      // Find user by ID in mock data
      const user = mockUsers.find(u => u._id === id);
      return createMockResponse(user || null);
    }
    return api.get(`/users/${id}`);
  },
  createUser: (userData) => {
    if (isAdminMode()) {
      // Create new user in mock data
      const newUser = {
        ...userData,
        _id: 'user-' + Date.now(),
        bananaCount: 0,
        isActive: false
      };
      mockUsers.push(newUser);
      return createMockResponse(newUser);
    }
    return api.post('/users', userData);
  },
  updateUser: (id, userData) => {
    if (isAdminMode()) {
      // Update user in mock data
      const index = mockUsers.findIndex(u => u._id === id);
      if (index !== -1) {
        mockUsers[index] = { ...mockUsers[index], ...userData };
        return createMockResponse(mockUsers[index]);
      }
      return Promise.reject(new Error('User not found'));
    }
    return api.put(`/users/${id}`, userData);
  },
  deleteUser: (id) => {
    if (isAdminMode()) {
      // Delete user from mock data
      const index = mockUsers.findIndex(u => u._id === id);
      if (index !== -1) {
        const deletedUser = mockUsers[index];
        mockUsers = mockUsers.filter(u => u._id !== id);
        return createMockResponse(deletedUser);
      }
      return createMockResponse({ success: true });
    }
    return api.delete(`/users/${id}`);
  },
  toggleBlockUser: (id, isBlocked) => {
    if (isAdminMode()) {
      // Toggle user block status in mock data
      const index = mockUsers.findIndex(u => u._id === id);
      if (index !== -1) {
        mockUsers[index].isBlocked = isBlocked;
        return createMockResponse(mockUsers[index]);
      }
      return Promise.reject(new Error('User not found'));
    }
    return api.patch(`/users/${id}/block`, { isBlocked });
  },
  incrementBananaCount: () => {
    if (isAdminMode()) {
      // Mock banana count increment
      return createMockResponse({ success: true, bananaCount: 1 });
    }
    return api.post('/users/increment-banana');
  },
  getRankings: () => {
    if (isAdminMode()) {
      // Return mock rankings
      return createMockResponse(mockUsers.sort((a, b) => b.bananaCount - a.bananaCount));
    }
    return api.get('/users/rankings');
  }
};

export default api;
