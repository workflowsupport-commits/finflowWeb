// routes/workflows.js
const express = require('express');
const { WORKFLOW_DEFINITIONS, STAGES } = require('../db');
const { auth } = require('../middleware/auth');

const router = express.Router();

// GET /api/workflows — only return workflows the user has access to
router.get('/', auth, (req, res) => {
  const { category } = req.query;
  const user = req.user;

  let wfs = WORKFLOW_DEFINITIONS;

  // Initiators only see their allowed workflows
  if (user.role === 'initiator' && user.allowedWorkflows && user.allowedWorkflows.length > 0) {
    wfs = wfs.filter(w => user.allowedWorkflows.includes(w.id));
  }

  if (category) wfs = wfs.filter(w => w.category === category);
  res.json(wfs);
});

// GET /api/workflows/categories
router.get('/categories', auth, (req, res) => {
  const user = req.user;
  let wfs = WORKFLOW_DEFINITIONS;
  if (user.role === 'initiator' && user.allowedWorkflows && user.allowedWorkflows.length > 0) {
    wfs = wfs.filter(w => user.allowedWorkflows.includes(w.id));
  }
  const cats = [...new Set(wfs.map(w => w.category))];
  res.json(cats);
});

// GET /api/workflows/:id
router.get('/:id', auth, (req, res) => {
  const user = req.user;
  const wf = WORKFLOW_DEFINITIONS.find(w => w.id === req.params.id);
  if (!wf) return res.status(404).json({ error: 'Workflow not found' });

  // Block initiators from accessing workflows not in their list
  if (user.role === 'initiator' && user.allowedWorkflows?.length > 0 && !user.allowedWorkflows.includes(wf.id)) {
    return res.status(403).json({ error: 'You do not have access to this workflow' });
  }

  res.json({
    ...wf,
    stagesDetail: wf.stages.map(sid => STAGES[sid.toUpperCase()] || { id: sid, label: sid }),
  });
});

module.exports = router;
