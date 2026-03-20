// db.js - In-memory database (replace with PostgreSQL/MySQL in production)
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const STAGES = {
  INITIATOR:    { id: 'initiator',   label: 'Initiator',                    order: 1 },
  DEPT_REC:     { id: 'dept_rec',    label: 'Dept/Branch Recommendation',   order: 2 },
  CEO_REC:      { id: 'ceo_rec',     label: 'CEO Recommendation',           order: 3 },
  APPROVAL:     { id: 'approval',    label: 'Approval',                     order: 4 },
  HR_PENDING:   { id: 'hr_pending',  label: 'HR Pending',                   order: 5 },
  HEAD_HR:      { id: 'head_hr',     label: 'Head of HR',                   order: 6 },
  FINANCE:      { id: 'finance',     label: 'Finance Pending',              order: 7 },
  GL_POST:      { id: 'gl_post',     label: 'GL Posting',                   order: 8 },
};

// 30+ workflow definitions with dynamic stage configs
const WORKFLOW_DEFINITIONS = [
  // --- Finance ---
  { id: 'cash_advance',       category: 'Finance',    name: 'Cash Advance',             icon: '💵', stages: ['initiator','dept_rec','approval','finance','gl_post'],                               requiresCEO: false, requiresHR: false },
  { id: 'bill_payment',       category: 'Finance',    name: 'Bill Payment',             icon: '🧾', stages: ['initiator','dept_rec','approval','finance','gl_post'],                               requiresCEO: false, requiresHR: false },
  { id: 'supplier_payment',   category: 'Finance',    name: 'Supplier Payment',         icon: '📦', stages: ['initiator','dept_rec','ceo_rec','approval','finance','gl_post'],                     requiresCEO: true,  requiresHR: false },
  { id: 'petty_cash',         category: 'Finance',    name: 'Petty Cash Reimbursement', icon: '💰', stages: ['initiator','dept_rec','finance','gl_post'],                                          requiresCEO: false, requiresHR: false },
  { id: 'budget_request',     category: 'Finance',    name: 'Budget Request',           icon: '📊', stages: ['initiator','dept_rec','ceo_rec','approval','finance','gl_post'],                     requiresCEO: true,  requiresHR: false },
  { id: 'asset_purchase',     category: 'Finance',    name: 'Asset Purchase',           icon: '🖥️', stages: ['initiator','dept_rec','ceo_rec','approval','finance','gl_post'],                     requiresCEO: true,  requiresHR: false },
  { id: 'gl_adjustment',      category: 'Finance',    name: 'GL Adjustment',            icon: '📒', stages: ['initiator','dept_rec','approval','finance','gl_post'],                               requiresCEO: false, requiresHR: false },
  { id: 'vendor_payment',     category: 'Finance',    name: 'Vendor Payment',           icon: '🏢', stages: ['initiator','dept_rec','approval','finance','gl_post'],                               requiresCEO: false, requiresHR: false },

  // --- Loans ---
  { id: 'agri_loan',          category: 'Loans',      name: 'Agri Loan',                icon: '🌾', stages: ['initiator','dept_rec','ceo_rec','approval','finance','gl_post'],                     requiresCEO: true,  requiresHR: false },
  { id: 'personal_loan',      category: 'Loans',      name: 'Personal Loan',            icon: '👤', stages: ['initiator','dept_rec','approval','finance','gl_post'],                               requiresCEO: false, requiresHR: false },
  { id: 'sme_loan',           category: 'Loans',      name: 'SME Loan',                 icon: '🏭', stages: ['initiator','dept_rec','ceo_rec','approval','finance','gl_post'],                     requiresCEO: true,  requiresHR: false },
  { id: 'mortgage_loan',      category: 'Loans',      name: 'Mortgage Loan',            icon: '🏠', stages: ['initiator','dept_rec','ceo_rec','approval','finance','gl_post'],                     requiresCEO: true,  requiresHR: false },

  // --- HR ---
  { id: 'leave_approval',     category: 'HR',         name: 'Leave Approval',           icon: '🏖️', stages: ['initiator','dept_rec','hr_pending','head_hr'],                                       requiresCEO: false, requiresHR: true  },
  { id: 'staff_travelling',   category: 'HR',         name: 'Staff Travelling',         icon: '✈️', stages: ['initiator','dept_rec','ceo_rec','approval','hr_pending','head_hr','finance','gl_post'], requiresCEO: true, requiresHR: true },
  { id: 'recruitment',        category: 'HR',         name: 'Recruitment Request',      icon: '👥', stages: ['initiator','dept_rec','ceo_rec','hr_pending','head_hr'],                             requiresCEO: true,  requiresHR: true  },
  { id: 'training_request',   category: 'HR',         name: 'Training Request',         icon: '🎓', stages: ['initiator','dept_rec','hr_pending','head_hr','finance','gl_post'],                   requiresCEO: false, requiresHR: true  },
  { id: 'salary_advance',     category: 'HR',         name: 'Salary Advance',           icon: '💳', stages: ['initiator','dept_rec','hr_pending','head_hr','finance','gl_post'],                   requiresCEO: false, requiresHR: true  },
  { id: 'overtime_approval',  category: 'HR',         name: 'Overtime Approval',        icon: '⏰', stages: ['initiator','dept_rec','hr_pending','head_hr'],                                       requiresCEO: false, requiresHR: true  },
  { id: 'resignation',        category: 'HR',         name: 'Resignation Processing',   icon: '📋', stages: ['initiator','dept_rec','hr_pending','head_hr'],                                       requiresCEO: false, requiresHR: true  },
  { id: 'promotion_request',  category: 'HR',         name: 'Promotion Request',        icon: '⭐', stages: ['initiator','dept_rec','ceo_rec','hr_pending','head_hr'],                             requiresCEO: true,  requiresHR: true  },

  // --- Operations ---
  { id: 'customer_onboard',   category: 'Operations', name: 'Customer Onboarding',      icon: '🤝', stages: ['initiator','dept_rec','approval'],                                                   requiresCEO: false, requiresHR: false },
  { id: 'risk_profiling',     category: 'Operations', name: 'Risk Profiling',           icon: '🛡️', stages: ['initiator','dept_rec','approval'],                                                   requiresCEO: false, requiresHR: false },
  { id: 'account_closure',    category: 'Operations', name: 'Account Closure',          icon: '🔒', stages: ['initiator','dept_rec','approval'],                                                   requiresCEO: false, requiresHR: false },
  { id: 'limit_increase',     category: 'Operations', name: 'Credit Limit Increase',    icon: '📈', stages: ['initiator','dept_rec','ceo_rec','approval','finance'],                               requiresCEO: true,  requiresHR: false },
  { id: 'fd_opening',         category: 'Operations', name: 'FD Opening',               icon: '🏦', stages: ['initiator','dept_rec','approval','finance','gl_post'],                               requiresCEO: false, requiresHR: false },
  { id: 'loan_settlement',    category: 'Operations', name: 'Loan Settlement',          icon: '✅', stages: ['initiator','dept_rec','approval','finance','gl_post'],                               requiresCEO: false, requiresHR: false },

  // --- Compliance ---
  { id: 'kyc_review',         category: 'Compliance', name: 'KYC Review',               icon: '🔍', stages: ['initiator','dept_rec','approval'],                                                   requiresCEO: false, requiresHR: false },
  { id: 'aml_report',         category: 'Compliance', name: 'AML Report',               icon: '🚨', stages: ['initiator','dept_rec','ceo_rec','approval'],                                         requiresCEO: true,  requiresHR: false },
  { id: 'audit_request',      category: 'Compliance', name: 'Audit Request',            icon: '📁', stages: ['initiator','dept_rec','ceo_rec','approval'],                                         requiresCEO: true,  requiresHR: false },
  { id: 'policy_exception',   category: 'Compliance', name: 'Policy Exception',         icon: '⚠️', stages: ['initiator','dept_rec','ceo_rec','approval'],                                         requiresCEO: true,  requiresHR: false },
  { id: 'write_off',          category: 'Compliance', name: 'Loan Write-Off',           icon: '📉', stages: ['initiator','dept_rec','ceo_rec','approval','finance','gl_post'],                     requiresCEO: true,  requiresHR: false },
  { id: 'interest_waiver',    category: 'Compliance', name: 'Interest Waiver',          icon: '🏷️', stages: ['initiator','dept_rec','ceo_rec','approval','finance','gl_post'],                     requiresCEO: true,  requiresHR: false },
];

// Users with roles and allowed workflows
const salt = bcrypt.genSaltSync(10);
const users = [
  {
    id: 'u0', name: 'System Admin', email: 'admin@finflow.lk',
    password: bcrypt.hashSync('admin123', salt), role: 'admin',
    jobFunction: 'System Administrator', department: 'IT', branch: 'Head Office', avatar: 'SA',
    isActive: true,
    allowedWorkflows: [] // admin sees all
  },
  {
    id: 'u1', name: 'Malith Amarasinghe', email: 'malith@finflow.lk',
    password: bcrypt.hashSync('password123', salt), role: 'initiator',
    jobFunction: 'Branch Manager', department: 'Operations', branch: 'Colombo Main', avatar: 'MA',
    isActive: true,
    allowedWorkflows: ['cash_advance','bill_payment','staff_travelling','customer_onboard','risk_profiling','asset_purchase','supplier_payment']
  },
  {
    id: 'u2', name: 'Ravi Fernando', email: 'ravi@finflow.lk',
    password: bcrypt.hashSync('password123', salt), role: 'supervisor',
    jobFunction: 'Regional Manager', department: 'Management', branch: 'Colombo Region', avatar: 'RF',
    isActive: true,
    allowedWorkflows: [] // supervisors can approve all
  },
  {
    id: 'u3', name: 'Sunethra Silva', email: 'sunethra@finflow.lk',
    password: bcrypt.hashSync('password123', salt), role: 'hr',
    jobFunction: 'Head of HR', department: 'HR', branch: 'Head Office', avatar: 'SS',
    isActive: true,
    allowedWorkflows: ['leave_approval','staff_travelling','recruitment','training_request','salary_advance','overtime_approval','resignation','promotion_request']
  },
  {
    id: 'u4', name: 'Amal Gunawardena', email: 'amal@finflow.lk',
    password: bcrypt.hashSync('password123', salt), role: 'finance',
    jobFunction: 'Finance Manager', department: 'Finance', branch: 'Head Office', avatar: 'AG',
    isActive: true,
    allowedWorkflows: [] // finance sees all finance-stage workflows
  },
  {
    id: 'u5', name: 'Pradeep Jayasuriya', email: 'pradeep@finflow.lk',
    password: bcrypt.hashSync('password123', salt), role: 'ceo',
    jobFunction: 'CEO', department: 'Executive', branch: 'Head Office', avatar: 'PJ',
    isActive: true,
    allowedWorkflows: [] // CEO sees all
  },
  {
    id: 'u6', name: 'Dilani Jayawardena', email: 'dilani@finflow.lk',
    password: bcrypt.hashSync('password123', salt), role: 'initiator',
    jobFunction: 'Customer Officer', department: 'Retail', branch: 'Galle', avatar: 'DJ',
    isActive: true,
    allowedWorkflows: ['customer_onboard','risk_profiling','kyc_review','personal_loan','fd_opening','account_closure']
  },
  {
    id: 'u7', name: 'Chaminda Bandara', email: 'chaminda@finflow.lk',
    password: bcrypt.hashSync('password123', salt), role: 'initiator',
    jobFunction: 'Agri Finance Officer', department: 'Agri Finance', branch: 'Kurunegala', avatar: 'CB',
    isActive: true,
    allowedWorkflows: ['agri_loan','personal_loan','loan_settlement','cash_advance','fd_opening']
  },
  {
    id: 'u8', name: 'Tharuka Wickrama', email: 'tharuka@finflow.lk',
    password: bcrypt.hashSync('password123', salt), role: 'hr',
    jobFunction: 'HR Officer', department: 'HR', branch: 'Head Office', avatar: 'TW',
    isActive: true,
    allowedWorkflows: ['leave_approval','overtime_approval','salary_advance','resignation','training_request']
  },
];

// Generate sample requests
function genId() { return 'REQ-' + String(Math.floor(Math.random() * 900) + 100); }

const now = Date.now();
const day = 86400000;

const requests = [
  {
    id: uuidv4(), refNo: 'REQ-047', workflowId: 'staff_travelling',
    title: 'Staff Travelling – Colombo Client Visit',
    requestedBy: 'u1', department: 'Operations', branch: 'Colombo Main',
    amount: 45000, currency: 'LKR', description: 'Travelling to Colombo HQ for Q1 client review meeting',
    status: 'in_progress', priority: 'high',
    createdAt: new Date(now - 2 * day).toISOString(),
    currentStageIndex: 4,
    stages: [
      { stageId: 'initiator',  status: 'completed', actor: 'u1', actedAt: new Date(now - 2*day).toISOString(), comment: 'Travelling to Colombo for Q1 client meeting' },
      { stageId: 'dept_rec',   status: 'completed', actor: 'u2', actedAt: new Date(now - 2*day + 3600000).toISOString(), comment: 'Valid business travel – recommended' },
      { stageId: 'ceo_rec',    status: 'completed', actor: 'u5', actedAt: new Date(now - 1*day).toISOString(), comment: 'Approved by CEO office' },
      { stageId: 'approval',   status: 'completed', actor: 'u2', actedAt: new Date(now - 1*day + 3600000).toISOString(), comment: 'Managerial approval granted' },
      { stageId: 'hr_pending', status: 'pending',   actor: null, actedAt: null, comment: '' },
      { stageId: 'head_hr',    status: 'pending',   actor: null, actedAt: null, comment: '' },
      { stageId: 'finance',    status: 'pending',   actor: null, actedAt: null, comment: '' },
      { stageId: 'gl_post',    status: 'pending',   actor: null, actedAt: null, comment: '' },
    ],
    attachments: [],
    notifications: []
  },
  {
    id: uuidv4(), refNo: 'REQ-046', workflowId: 'cash_advance',
    title: 'Cash Advance – Branch Audit Expenses',
    requestedBy: 'u1', department: 'Operations', branch: 'Colombo Main',
    amount: 25000, currency: 'LKR', description: 'Field expenses for Q1 branch audit activities',
    status: 'in_progress', priority: 'medium',
    createdAt: new Date(now - 1 * day).toISOString(),
    currentStageIndex: 2,
    stages: [
      { stageId: 'initiator', status: 'completed', actor: 'u1', actedAt: new Date(now - 1*day).toISOString(), comment: 'Field expenses for branch audit' },
      { stageId: 'dept_rec',  status: 'completed', actor: 'u2', actedAt: new Date(now - 1*day + 3600000).toISOString(), comment: 'Recommended by branch manager' },
      { stageId: 'approval',  status: 'pending',   actor: null, actedAt: null, comment: '' },
      { stageId: 'finance',   status: 'pending',   actor: null, actedAt: null, comment: '' },
      { stageId: 'gl_post',   status: 'pending',   actor: null, actedAt: null, comment: '' },
    ],
    attachments: [],
    notifications: []
  },
  {
    id: uuidv4(), refNo: 'REQ-045', workflowId: 'customer_onboard',
    title: 'Customer Onboarding – Galle SME Client',
    requestedBy: 'u6', department: 'Retail', branch: 'Galle',
    amount: 0, currency: 'LKR', description: 'New SME customer KYC document submission and account opening',
    status: 'in_progress', priority: 'medium',
    createdAt: new Date(now - 2 * day).toISOString(),
    currentStageIndex: 1,
    stages: [
      { stageId: 'initiator', status: 'completed', actor: 'u6', actedAt: new Date(now - 2*day).toISOString(), comment: 'New SME customer KYC submitted and verified' },
      { stageId: 'dept_rec',  status: 'pending',   actor: null, actedAt: null, comment: '' },
      { stageId: 'approval',  status: 'pending',   actor: null, actedAt: null, comment: '' },
    ],
    attachments: [],
    notifications: []
  },
  {
    id: uuidv4(), refNo: 'REQ-044', workflowId: 'agri_loan',
    title: 'Agri Loan – Seasonal Paddy Farming',
    requestedBy: 'u7', department: 'Agri Finance', branch: 'Kurunegala',
    amount: 2500000, currency: 'LKR', description: 'Seasonal paddy loan for registered farmer – Maha season 2024',
    status: 'in_progress', priority: 'high',
    createdAt: new Date(now - 3 * day).toISOString(),
    currentStageIndex: 5,
    stages: [
      { stageId: 'initiator', status: 'completed', actor: 'u7', actedAt: new Date(now - 3*day).toISOString(), comment: 'Seasonal paddy loan – farmer verified' },
      { stageId: 'dept_rec',  status: 'completed', actor: 'u2', actedAt: new Date(now - 3*day + 3600000).toISOString(), comment: 'Recommended – all documents in order' },
      { stageId: 'ceo_rec',   status: 'completed', actor: 'u5', actedAt: new Date(now - 2*day).toISOString(), comment: 'Approved for high-value agri loan' },
      { stageId: 'approval',  status: 'completed', actor: 'u2', actedAt: new Date(now - 2*day + 3600000).toISOString(), comment: 'Credit committee approved' },
      { stageId: 'finance',   status: 'completed', actor: 'u4', actedAt: new Date(now - 1*day).toISOString(), comment: 'Disbursement initiated' },
      { stageId: 'gl_post',   status: 'pending',   actor: null, actedAt: null, comment: '' },
    ],
    attachments: [],
    notifications: []
  },
  {
    id: uuidv4(), refNo: 'REQ-043', workflowId: 'bill_payment',
    title: 'Bill Payment – Q1 Electricity',
    requestedBy: 'u1', department: 'Admin', branch: 'Colombo Main',
    amount: 185000, currency: 'LKR', description: 'Electricity utility bill payment for Q1 2024',
    status: 'approved', priority: 'low',
    createdAt: new Date(now - 5 * day).toISOString(),
    currentStageIndex: 4,
    stages: [
      { stageId: 'initiator', status: 'completed', actor: 'u1', actedAt: new Date(now - 5*day).toISOString(), comment: 'Electricity bill Q1 2024' },
      { stageId: 'dept_rec',  status: 'completed', actor: 'u2', actedAt: new Date(now - 5*day + 3600000).toISOString(), comment: 'Verified – recurring bill' },
      { stageId: 'approval',  status: 'completed', actor: 'u2', actedAt: new Date(now - 4*day).toISOString(), comment: 'Approved' },
      { stageId: 'finance',   status: 'completed', actor: 'u4', actedAt: new Date(now - 4*day + 3600000).toISOString(), comment: 'Payment processed' },
      { stageId: 'gl_post',   status: 'completed', actor: 'u4', actedAt: new Date(now - 3*day).toISOString(), comment: 'Posted to GL account 5001' },
    ],
    attachments: [],
    notifications: []
  },
  {
    id: uuidv4(), refNo: 'REQ-041', workflowId: 'supplier_payment',
    title: 'Supplier Payment – IT Equipment',
    requestedBy: 'u1', department: 'Procurement', branch: 'Colombo Main',
    amount: 675000, currency: 'LKR', description: 'IT equipment purchase from approved vendor',
    status: 'rejected', priority: 'medium',
    createdAt: new Date(now - 6 * day).toISOString(),
    currentStageIndex: 2,
    stages: [
      { stageId: 'initiator', status: 'completed', actor: 'u1', actedAt: new Date(now - 6*day).toISOString(), comment: 'IT equipment purchase – Q1 budget' },
      { stageId: 'dept_rec',  status: 'completed', actor: 'u2', actedAt: new Date(now - 6*day + 3600000).toISOString(), comment: 'Recommended' },
      { stageId: 'ceo_rec',   status: 'rejected',  actor: 'u5', actedAt: new Date(now - 5*day).toISOString(), comment: 'Budget exceeded for Q1 – defer to Q2' },
      { stageId: 'approval',  status: 'pending',   actor: null, actedAt: null, comment: '' },
      { stageId: 'finance',   status: 'pending',   actor: null, actedAt: null, comment: '' },
      { stageId: 'gl_post',   status: 'pending',   actor: null, actedAt: null, comment: '' },
    ],
    attachments: [],
    notifications: []
  },
  {
    id: uuidv4(), refNo: 'REQ-040', workflowId: 'leave_approval',
    title: 'Leave Approval – Annual Leave',
    requestedBy: 'u8', department: 'HR', branch: 'Head Office',
    amount: 0, currency: 'LKR', description: 'Annual leave request – 5 working days',
    status: 'approved', priority: 'low',
    createdAt: new Date(now - 7 * day).toISOString(),
    currentStageIndex: 3,
    stages: [
      { stageId: 'initiator',  status: 'completed', actor: 'u8', actedAt: new Date(now - 7*day).toISOString(), comment: 'Annual leave – 5 days March 20-26' },
      { stageId: 'dept_rec',   status: 'completed', actor: 'u2', actedAt: new Date(now - 7*day + 3600000).toISOString(), comment: 'Approved – no conflicts' },
      { stageId: 'hr_pending', status: 'completed', actor: 'u8', actedAt: new Date(now - 6*day).toISOString(), comment: 'Recorded in HR system' },
      { stageId: 'head_hr',    status: 'completed', actor: 'u3', actedAt: new Date(now - 6*day + 3600000).toISOString(), comment: 'Leave approved and confirmed' },
    ],
    attachments: [],
    notifications: []
  },
];

// Notifications store
const notifications = [];

// Analytics events
const analyticsEvents = requests.map(r => ({
  requestId: r.id,
  workflowId: r.workflowId,
  status: r.status,
  amount: r.amount,
  department: r.department,
  branch: r.branch,
  createdAt: r.createdAt,
  completedAt: r.status === 'approved' ? new Date(Date.now() - Math.random() * 3 * day).toISOString() : null,
}));

module.exports = { users, requests, notifications, analyticsEvents, WORKFLOW_DEFINITIONS, STAGES };
