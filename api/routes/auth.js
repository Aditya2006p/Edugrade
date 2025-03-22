const express = require('express');
const router = express.Router();

// Mock users for demo purposes
const users = [
  { id: 'teacher1', username: 'teacher1', password: 'password123', role: 'teacher', name: 'John Smith' },
  { id: 'student1', username: 'student1', password: 'password123', role: 'student', name: 'Alice Johnson' }
];

// POST login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  // Find user
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid username or password'
    });
  }
  
  // In a real app, you would generate a JWT token here
  const token = `mock-token-${user.id}-${Date.now()}`;
  
  // Return user info (excluding password)
  const { password: _, ...userWithoutPassword } = user;
  
  res.json({
    status: 'success',
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token
    }
  });
});

// POST register
router.post('/register', (req, res) => {
  const { username, password, name, role } = req.body;
  
  // Check if username already exists
  if (users.some(u => u.username === username)) {
    return res.status(400).json({
      status: 'error',
      message: 'Username already exists'
    });
  }
  
  // Create new user
  const newUser = {
    id: `user${users.length + 1}`,
    username,
    password,
    name,
    role: role || 'student'
  };
  
  // In a real app, you would save the user to a database
  users.push(newUser);
  
  // Return user info (excluding password)
  const { password: _, ...userWithoutPassword } = newUser;
  
  res.status(201).json({
    status: 'success',
    message: 'Registration successful',
    data: {
      user: userWithoutPassword
    }
  });
});

// GET users (for demo purposes)
router.get('/users', (req, res) => {
  // Return users without passwords
  const safeUsers = users.map(({ password, ...user }) => user);
  
  res.json({
    status: 'success',
    message: 'Users retrieved successfully',
    data: safeUsers
  });
});

module.exports = router; 