// routes/admin.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { users, WORKFLOW_DEFINITIONS } = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// All admin routes require auth + admin role
router.use(auth, requireRole('admin'));

// GET /api/admin/users — list all users
router.get('/users', (req, res) => {
  res.json(users.map(({ password: _, ...u }) => u));
});

// GET /api/admin/users/:id
router.get('/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { password: _, ...safe } = user;
  res.json(safe);
});

// POST /api/admin/users — create user
router.post('/users', async (req, res) => {
  try {
    const { name, email, password, role, jobFunction, department, branch, allowedWorkflows = [] } = req.body;
    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password and role are required' });
    }
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    const avatar = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const newUser = {
      id: uuidv4(),
      name, email,
      password: await bcrypt.hash(password, 10),
      role, jobFunction, department, branch, avatar,
      isActive: true,
      allowedWorkflows,
    };
    users.push(newUser);
    const { password: _, ...safe } = newUser;
    res.status(201).json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PATCH /api/admin/users/:id — update user
router.patch('/users/:id', async (req, res) => {
  try {
    const user = users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { name, email, password, role, jobFunction, department, branch, allowedWorkflows, isActive } = req.body;

    if (email && email !== user.email) {
      if (users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.id !== user.id)) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = email;
    }
    if (name)             { user.name = name; user.avatar = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase(); }
    if (password)         user.password = await bcrypt.hash(password, 10);
    if (role)             user.role = role;
    if (jobFunction)      user.jobFunction = jobFunction;
    if (department)       user.department = department;
    if (branch)           user.branch = branch;
    if (allowedWorkflows) user.allowedWorkflows = allowedWorkflows;
    if (isActive !== undefined) user.isActive = isActive;

    const { password: _, ...safe } = user;
    res.json(safe);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE /api/admin/users/:id — deactivate (soft delete)
router.delete('/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'admin') return res.status(400).json({ error: 'Cannot deactivate admin' });
  user.isActive = false;
  res.json({ success: true, message: `${user.name} deactivated` });
});

// GET /api/admin/workflows — list all workflow IDs + names for assignment
router.get('/workflows', (req, res) => {
  res.json(WORKFLOW_DEFINITIONS.map(w => ({ id: w.id, name: w.name, icon: w.icon, category: w.category })));
});

module.exports = router;
