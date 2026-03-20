// routes/requests.js
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { requests, users, notifications, WORKFLOW_DEFINITIONS, STAGES } = require('../db');
const { auth } = require('../middleware/auth');
const emailService = require('../services/emailService');

const router = express.Router();
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

function getUser(id) { return users.find(u => u.id === id); }
function getWfDef(id) { return WORKFLOW_DEFINITIONS.find(w => w.id === id); }

function enrichRequest(r) {
  const requester = getUser(r.requestedBy);
  const wfDef = getWfDef(r.workflowId);
  return {
    ...r,
    requesterName: requester ? requester.name : 'Unknown',
    requesterEmail: requester ? requester.email : '',
    workflowName: wfDef ? wfDef.name : r.workflowId,
    workflowIcon: wfDef ? wfDef.icon : '📄',
    workflowCategory: wfDef ? wfDef.category : '',
    totalStages: r.stages.length,
    completedStages: r.stages.filter(s => s.status === 'completed').length,
    stages: r.stages.map(s => ({
      ...s,
      actorName: s.actor ? (getUser(s.actor)?.name || s.actor) : null,
      stageLabel: STAGES[s.stageId.toUpperCase()]?.label || s.stageId,
    })),
  };
}

// Determine who should act on a given stage
function getStageApprovers(stageId, requestedBy) {
  const stageRoleMap = {
    dept_rec:   ['supervisor'],
    ceo_rec:    ['ceo'],
    approval:   ['supervisor', 'ceo'],
    hr_pending: ['hr'],
    head_hr:    ['hr'],
    finance:    ['finance'],
    gl_post:    ['finance'],
  };
  return stageRoleMap[stageId] || [];
}

// Push in-app notification
function pushNotification(userId, message, requestId, refNo) {
  notifications.push({
    id: uuidv4(), userId, message, requestId, refNo,
    read: false, createdAt: new Date().toISOString(),
  });
}

// ── GET /api/requests ──────────────────────────────────────────────────────
router.get('/', auth, (req, res) => {
  const { status, workflowId, search, page = 1, limit = 20 } = req.query;
  const user = req.user;

  let filtered = requests.filter(r => {
    // Initiators see their own; approvers see all relevant
    if (user.role === 'initiator') return r.requestedBy === user.id;
    // supervisors/hr/finance/ceo see all they can act on + all requests
    return true;
  });

  if (status) filtered = filtered.filter(r => r.status === status);
  if (workflowId) filtered = filtered.filter(r => r.workflowId === workflowId);
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(r =>
      r.refNo.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      (getUser(r.requestedBy)?.name || '').toLowerCase().includes(q)
    );
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  res.json({
    data: paginated.map(enrichRequest),
    meta: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
  });
});

// ── GET /api/requests/my-approvals ────────────────────────────────────────
router.get('/my-approvals', auth, (req, res) => {
  const user = req.user;
  if (user.role === 'initiator') return res.json([]);

  const pending = requests.filter(r => {
    if (r.status !== 'in_progress') return false;
    const currentStage = r.stages[r.currentStageIndex];
    if (!currentStage || currentStage.status !== 'pending') return false;
    const approverRoles = getStageApprovers(currentStage.stageId, r.requestedBy);
    return approverRoles.includes(user.role);
  });

  res.json(pending.map(enrichRequest));
});

// ── GET /api/requests/:id ─────────────────────────────────────────────────
router.get('/:id', auth, (req, res) => {
  const r = requests.find(x => x.id === req.params.id || x.refNo === req.params.id);
  if (!r) return res.status(404).json({ error: 'Request not found' });
  if (req.user.role === 'initiator' && r.requestedBy !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }
  res.json(enrichRequest(r));
});

// ── POST /api/requests ────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { workflowId, title, description, amount = 0, currency = 'LKR', priority = 'medium', attachments = [] } = req.body;
    if (!workflowId || !title) return res.status(400).json({ error: 'workflowId and title required' });

    const wfDef = getWfDef(workflowId);
    if (!wfDef) return res.status(400).json({ error: 'Invalid workflow type' });

    // Auto-generate refNo
    const maxRef = requests.reduce((max, r) => {
      const n = parseInt(r.refNo.replace('REQ-', '')) || 0;
      return Math.max(max, n);
    }, 0);
    const refNo = `REQ-${String(maxRef + 1).padStart(3, '0')}`;

    // Build stages
    const stages = wfDef.stages.map((stageId, i) => ({
      stageId,
      status: i === 0 ? 'completed' : 'pending',
      actor: i === 0 ? req.user.id : null,
      actedAt: i === 0 ? new Date().toISOString() : null,
      comment: i === 0 ? (description || '') : '',
    }));

    const newReq = {
      id: uuidv4(), refNo, workflowId, title, description, amount, currency, priority,
      requestedBy: req.user.id,
      department: req.user.department,
      branch: req.user.branch,
      status: 'in_progress',
      currentStageIndex: 1, // move past initiator
      stages,
      attachments,
      notifications: [],
      createdAt: new Date().toISOString(),
    };

    requests.push(newReq);

    // Notify requester
    try {
      await emailService.sendRequestSubmitted({
        to: req.user.email, requesterName: req.user.name,
        refNo, workflowName: wfDef.name, amount, appUrl: APP_URL,
      });
    } catch (e) {}

    // Notify approvers for stage 1
    const nextStage = stages[1];
    if (nextStage) {
      const approverRoles = getStageApprovers(nextStage.stageId);
      const approvers = users.filter(u => approverRoles.includes(u.role));
      for (const approver of approvers) {
        pushNotification(approver.id, `New request ${refNo} awaiting your action at ${nextStage.stageId}`, newReq.id, refNo);
        try {
          await emailService.sendApprovalRequired({
            to: approver.email, approverName: approver.name,
            requesterName: req.user.name, refNo, workflowName: wfDef.name,
            stageName: STAGES[nextStage.stageId.toUpperCase()]?.label || nextStage.stageId,
            amount, appUrl: APP_URL,
          });
        } catch (e) {}
      }
    }

    res.status(201).json(enrichRequest(newReq));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create request' });
  }
});

// ── POST /api/requests/:id/action ─────────────────────────────────────────
router.post('/:id/action', auth, async (req, res) => {
  try {
    const { action, comment = '' } = req.body; // action: 'approve' | 'reject' | 'clarify'
    if (!['approve', 'reject', 'clarify'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const r = requests.find(x => x.id === req.params.id);
    if (!r) return res.status(404).json({ error: 'Request not found' });
    if (r.status !== 'in_progress') return res.status(400).json({ error: 'Request is not in progress' });

    const currentStage = r.stages[r.currentStageIndex];
    if (!currentStage || currentStage.status !== 'pending') {
      return res.status(400).json({ error: 'No pending stage to act on' });
    }

    // Verify permission
    const approverRoles = getStageApprovers(currentStage.stageId, r.requestedBy);
    if (!approverRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You are not authorized to act on this stage' });
    }

    const wfDef = getWfDef(r.workflowId);
    const stageLabel = STAGES[currentStage.stageId.toUpperCase()]?.label || currentStage.stageId;
    const requester = getUser(r.requestedBy);

    // Update stage
    currentStage.status = action === 'approve' ? 'completed' : action === 'reject' ? 'rejected' : 'pending';
    currentStage.actor = req.user.id;
    currentStage.actedAt = new Date().toISOString();
    currentStage.comment = comment;

    if (action === 'reject') {
      r.status = 'rejected';
      // Notify requester
      pushNotification(r.requestedBy, `Your request ${r.refNo} was rejected at ${stageLabel}`, r.id, r.refNo);
      try {
        await emailService.sendStageCompleted({
          to: requester?.email, requesterName: requester?.name,
          refNo: r.refNo, workflowName: wfDef?.name,
          stageName: stageLabel, action: 'rejected',
          actorName: req.user.name, comment, appUrl: APP_URL,
        });
      } catch (e) {}
    } else if (action === 'approve') {
      // Notify requester of stage completion
      try {
        const nextStageObj = r.stages[r.currentStageIndex + 1];
        const nextLabel = nextStageObj ? (STAGES[nextStageObj.stageId.toUpperCase()]?.label || nextStageObj.stageId) : null;
        pushNotification(r.requestedBy, `${r.refNo} approved at ${stageLabel}${nextLabel ? ' – next: ' + nextLabel : ''}`, r.id, r.refNo);
        await emailService.sendStageCompleted({
          to: requester?.email, requesterName: requester?.name,
          refNo: r.refNo, workflowName: wfDef?.name,
          stageName: stageLabel, action: 'approved',
          actorName: req.user.name, comment,
          nextStage: nextLabel, appUrl: APP_URL,
        });
      } catch (e) {}

      // Advance to next pending stage
      let nextIdx = r.currentStageIndex + 1;
      while (nextIdx < r.stages.length && r.stages[nextIdx].status === 'completed') nextIdx++;

      if (nextIdx >= r.stages.length) {
        r.status = 'approved';
        r.currentStageIndex = r.stages.length - 1;
        pushNotification(r.requestedBy, `🎉 Your request ${r.refNo} has been fully approved!`, r.id, r.refNo);
        try {
          await emailService.sendRequestCompleted({
            to: requester?.email, requesterName: requester?.name,
            refNo: r.refNo, workflowName: wfDef?.name,
            finalStatus: 'approved', appUrl: APP_URL,
          });
        } catch (e) {}
      } else {
        r.currentStageIndex = nextIdx;
        // Notify next approvers
        const nextStage = r.stages[nextIdx];
        const approverRoles = getStageApprovers(nextStage.stageId);
        const approvers = users.filter(u => approverRoles.includes(u.role));
        for (const approver of approvers) {
          pushNotification(approver.id, `Request ${r.refNo} awaiting action at ${nextStage.stageId}`, r.id, r.refNo);
          try {
            await emailService.sendApprovalRequired({
              to: approver.email, approverName: approver.name,
              requesterName: requester?.name, refNo: r.refNo,
              workflowName: wfDef?.name,
              stageName: STAGES[nextStage.stageId.toUpperCase()]?.label || nextStage.stageId,
              amount: r.amount, appUrl: APP_URL,
            });
          } catch (e) {}
        }
      }
    }

    res.json(enrichRequest(r));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Action failed' });
  }
});

module.exports = router;
