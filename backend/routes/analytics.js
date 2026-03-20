// routes/analytics.js
const express = require('express');
const { requests, WORKFLOW_DEFINITIONS } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/analytics/summary
router.get('/summary', auth, (req, res) => {
  const total = requests.length;
  const approved = requests.filter(r => r.status === 'approved').length;
  const rejected = requests.filter(r => r.status === 'rejected').length;
  const inProgress = requests.filter(r => r.status === 'in_progress').length;
  const totalAmount = requests.filter(r => r.status === 'approved').reduce((s, r) => s + (r.amount || 0), 0);

  const myRequests = req.user.role === 'initiator'
    ? requests.filter(r => r.requestedBy === req.user.id).length
    : null;

  res.json({ total, approved, rejected, inProgress, totalAmount, myRequests });
});

// GET /api/analytics/by-workflow
router.get('/by-workflow', auth, (req, res) => {
  const counts = {};
  WORKFLOW_DEFINITIONS.forEach(wf => { counts[wf.id] = { name: wf.name, icon: wf.icon, category: wf.category, total: 0, approved: 0, rejected: 0, inProgress: 0 }; });
  requests.forEach(r => {
    if (counts[r.workflowId]) {
      counts[r.workflowId].total++;
      counts[r.workflowId][r.status === 'in_progress' ? 'inProgress' : r.status]++;
    }
  });
  res.json(Object.values(counts).filter(c => c.total > 0));
});

// GET /api/analytics/by-department
router.get('/by-department', auth, (req, res) => {
  const depts = {};
  requests.forEach(r => {
    if (!depts[r.department]) depts[r.department] = { department: r.department, total: 0, approved: 0, rejected: 0, amount: 0 };
    depts[r.department].total++;
    if (r.status === 'approved') { depts[r.department].approved++; depts[r.department].amount += r.amount || 0; }
    if (r.status === 'rejected') depts[r.department].rejected++;
  });
  res.json(Object.values(depts));
});

// GET /api/analytics/by-month
router.get('/by-month', auth, (req, res) => {
  const months = {};
  requests.forEach(r => {
    const month = r.createdAt.slice(0, 7); // YYYY-MM
    if (!months[month]) months[month] = { month, total: 0, approved: 0, rejected: 0 };
    months[month].total++;
    if (r.status === 'approved') months[month].approved++;
    if (r.status === 'rejected') months[month].rejected++;
  });
  res.json(Object.values(months).sort((a, b) => a.month.localeCompare(b.month)));
});

// GET /api/analytics/by-category
router.get('/by-category', auth, (req, res) => {
  const cats = {};
  requests.forEach(r => {
    const wf = WORKFLOW_DEFINITIONS.find(w => w.id === r.workflowId);
    const cat = wf?.category || 'Other';
    if (!cats[cat]) cats[cat] = { category: cat, total: 0, amount: 0 };
    cats[cat].total++;
    cats[cat].amount += r.amount || 0;
  });
  res.json(Object.values(cats));
});

module.exports = router;
