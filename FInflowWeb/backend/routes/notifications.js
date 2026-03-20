// routes/notifications.js
const express = require('express');
const { notifications } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications
router.get('/', auth, (req, res) => {
  const mine = notifications
    .filter(n => n.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 30);
  res.json(mine);
});

// GET /api/notifications/unread-count
router.get('/unread-count', auth, (req, res) => {
  const count = notifications.filter(n => n.userId === req.user.id && !n.read).length;
  res.json({ count });
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', auth, (req, res) => {
  const n = notifications.find(x => x.id === req.params.id && x.userId === req.user.id);
  if (!n) return res.status(404).json({ error: 'Not found' });
  n.read = true;
  res.json(n);
});

// PATCH /api/notifications/read-all
router.patch('/read-all', auth, (req, res) => {
  notifications.filter(n => n.userId === req.user.id).forEach(n => { n.read = true; });
  res.json({ success: true });
});

module.exports = router;
