# FinFlow – Finance Workflow System

A full-stack finance workflow management system built with **Node.js + Express** (backend) and **React** (frontend).

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm 9+

### 1. Start the Backend

```bash
cd backend
cp .env.example .env          # copy env file
npm install                    # install dependencies
npm start                      # starts on http://localhost:5000
```

For development with auto-reload:
```bash
npm run dev
```

### 2. Start the Frontend

```bash
cd frontend
npm install
npm start                      # starts on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## 🔐 Demo Users

| Email | Password | Role | Access |
|-------|----------|------|--------|
| malith@finflow.lk | password123 | **Initiator** | Submit requests, track own requests |
| ravi@finflow.lk | password123 | **Supervisor** | Approve Dept Rec, Approval stages |
| sunethra@finflow.lk | password123 | **Head of HR** | HR Pending, Head of HR stages |
| amal@finflow.lk | password123 | **Finance Manager** | Finance Pending, GL Posting stages |
| pradeep@finflow.lk | password123 | **CEO** | CEO Recommendation stage |

> Use the **Demo: Switch Role** panel in the sidebar to instantly switch between users.

---

## 📋 Workflow Types (32 total)

### Finance (8)
- Cash Advance · Bill Payment · Supplier Payment · Petty Cash
- Budget Request · Asset Purchase · GL Adjustment · Vendor Payment

### Loans (4)
- Agri Loan · Personal Loan · SME Loan · Mortgage Loan

### HR (8)
- Leave Approval · Staff Travelling · Recruitment · Training Request
- Salary Advance · Overtime Approval · Resignation · Promotion Request

### Operations (6)
- Customer Onboarding · Risk Profiling · Account Closure
- Credit Limit Increase · FD Opening · Loan Settlement

### Compliance (6)
- KYC Review · AML Report · Audit Request
- Policy Exception · Loan Write-Off · Interest Waiver

---

## 🔄 Approval Stages

Each workflow is configured with a subset of these stages:

| Stage | Role | Description |
|-------|------|-------------|
| **Initiator** | Any | Submits the request |
| **Dept/Branch Recommendation** | Supervisor | Based on job function |
| **CEO Recommendation** | CEO | Required for high-value/sensitive workflows |
| **Approval** | Supervisor / CEO | Based on job function |
| **HR Pending** | HR Officer | HR processing |
| **Head of HR** | Head of HR | Final HR sign-off |
| **Finance Pending** | Finance Manager | Finance processing |
| **GL Posting** | Finance Manager | General Ledger entry |

---

## 📁 Project Structure

```
finflow/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── db.js                  # In-memory database + seed data
│   ├── .env.example           # Environment variables template
│   ├── routes/
│   │   ├── auth.js            # Login, JWT, user listing
│   │   ├── workflows.js       # Workflow definitions
│   │   ├── requests.js        # CRUD + approval actions
│   │   ├── analytics.js       # Reports data
│   │   └── notifications.js   # In-app notifications
│   ├── middleware/
│   │   └── auth.js            # JWT verification middleware
│   └── services/
│       └── emailService.js    # Nodemailer email templates
│
└── frontend/
    └── src/
        ├── App.js             # Root + routing
        ├── App.css            # Global styles
        ├── context/
        │   └── AuthContext.js # Auth state management
        ├── utils/
        │   └── api.js         # API client
        ├── components/
        │   ├── Sidebar.js          # Navigation + role switcher
        │   ├── Topbar.js           # Header + notifications bell
        │   ├── RequestCard.js      # Request list item
        │   └── RequestDetailModal.js # Full detail + approve/reject
        └── pages/
            ├── LoginPage.js        # Login + demo quick access
            ├── Dashboard.js        # Overview + stats
            ├── RequestsPage.js     # Browse + search requests
            ├── ApprovalsPage.js    # Supervisor approval queue
            ├── NewRequestPage.js   # Submit new workflow request
            ├── ReportsPage.js      # Analytics + charts
            └── WorkflowsPage.js    # Browse 32 workflow types
```

---

## 📧 Email Notifications

Configure in `backend/.env`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=noreply@finflow.lk
```

Emails are sent for:
- ✅ Request submitted (to requester)
- ⏳ Action required at each stage (to approvers)
- 📢 Stage approved/rejected (to requester)
- 🎉 Request fully approved (to requester)

In `NODE_ENV=development`, emails are logged to console instead of sent.

---

## 🗄️ Production Database

The current build uses an **in-memory store** for simplicity. To switch to PostgreSQL:

1. Install `pg` or use an ORM like `prisma`
2. Replace the arrays in `db.js` with database queries
3. The route logic stays the same

Recommended schema tables:
- `users` · `workflow_definitions` · `requests` · `request_stages` · `notifications`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/workflows` | All workflow types |
| GET | `/api/workflows/:id` | Workflow detail + stages |
| GET | `/api/requests` | List requests (filtered) |
| POST | `/api/requests` | Submit new request |
| GET | `/api/requests/my-approvals` | My pending approvals |
| GET | `/api/requests/:id` | Request detail |
| POST | `/api/requests/:id/action` | Approve / reject |
| GET | `/api/analytics/summary` | Dashboard stats |
| GET | `/api/analytics/by-workflow` | Per-workflow breakdown |
| GET | `/api/analytics/by-month` | Monthly trend |
| GET | `/api/notifications` | My notifications |
| PATCH | `/api/notifications/read-all` | Mark all read |

---

## 🛠️ Extending the System

### Add a new workflow:
In `backend/db.js`, add to `WORKFLOW_DEFINITIONS`:
```js
{
  id: 'my_workflow',
  category: 'Finance',
  name: 'My New Workflow',
  icon: '📄',
  stages: ['initiator', 'dept_rec', 'approval', 'finance', 'gl_post'],
  requiresCEO: false,
  requiresHR: false,
}
```

### Add a new stage:
Add to the `STAGES` object in `db.js` and update the role mapping in `routes/requests.js`.

---

## 📦 Tech Stack

**Backend:** Node.js · Express · JWT · Bcrypt · Nodemailer · UUID  
**Frontend:** React 18 · Chart.js · DM Sans font  
**Auth:** JWT Bearer tokens (8h expiry)
