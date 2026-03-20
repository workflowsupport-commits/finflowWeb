// services/emailService.js
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.init();
  }

  init() {
    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch (err) {
      console.log('[Email] Transporter init failed – running in log-only mode');
    }
  }

  async send({ to, subject, html, text }) {
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'FinFlow'}" <${process.env.EMAIL_FROM || 'noreply@finflow.lk'}>`,
      to,
      subject,
      html,
      text: text || subject,
    };

    if (!process.env.SMTP_USER || process.env.NODE_ENV === 'development') {
      console.log(`[Email LOG] To: ${to} | Subject: ${subject}`);
      return { messageId: 'dev-mode-' + Date.now() };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[Email] Sent to ${to}: ${info.messageId}`);
      return info;
    } catch (err) {
      console.error(`[Email] Failed to send to ${to}:`, err.message);
      throw err;
    }
  }

  buildEmailHTML(title, body, ctaText, ctaUrl) {
    return `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { margin:0; padding:0; background:#f4f6fa; font-family: 'Segoe UI', Arial, sans-serif; }
  .wrap { max-width:560px; margin:40px auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,0.08); }
  .header { background:#0f2244; padding:28px 32px; }
  .header h1 { color:#fff; margin:0; font-size:22px; font-weight:700; letter-spacing:-0.5px; }
  .header h1 span { color:#4da6ff; }
  .body { padding:28px 32px; }
  .body h2 { color:#0f2244; font-size:17px; margin:0 0 12px; }
  .body p { color:#4b5563; font-size:14px; line-height:1.6; margin:0 0 16px; }
  .badge { display:inline-block; padding:4px 12px; border-radius:20px; font-size:12px; font-weight:600; background:#e8f0fd; color:#1a56db; }
  .cta { display:inline-block; margin:16px 0; padding:12px 24px; background:#1a56db; color:#fff !important; border-radius:8px; text-decoration:none; font-size:14px; font-weight:600; }
  .divider { border:none; border-top:1px solid #e5e7eb; margin:20px 0; }
  .footer { background:#f9fafb; padding:16px 32px; font-size:12px; color:#9ca3af; }
  .info-row { display:flex; gap:8px; margin-bottom:8px; }
  .info-label { font-weight:600; color:#374151; min-width:100px; font-size:13px; }
  .info-value { color:#6b7280; font-size:13px; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header"><h1>Fin<span>Flow</span></h1></div>
    <div class="body">
      <h2>${title}</h2>
      ${body}
      ${ctaText && ctaUrl ? `<a href="${ctaUrl}" class="cta">${ctaText}</a>` : ''}
    </div>
    <div class="footer">This is an automated notification from FinFlow Workflow System. Do not reply to this email.</div>
  </div>
</body>
</html>`;
  }

  // === Template Methods ===

  async sendRequestSubmitted({ to, requesterName, refNo, workflowName, amount, appUrl }) {
    const body = `
      <p>Your workflow request has been submitted successfully and is now awaiting approval.</p>
      <div class="info-row"><span class="info-label">Reference:</span><span class="info-value">${refNo}</span></div>
      <div class="info-row"><span class="info-label">Workflow:</span><span class="info-value">${workflowName}</span></div>
      ${amount > 0 ? `<div class="info-row"><span class="info-label">Amount:</span><span class="info-value">LKR ${amount.toLocaleString()}</span></div>` : ''}
      <hr class="divider">
      <p>You will receive updates as your request progresses through each approval stage.</p>`;
    return this.send({
      to,
      subject: `[FinFlow] Request Submitted – ${refNo} – ${workflowName}`,
      html: this.buildEmailHTML(`Request Submitted – ${refNo}`, body, 'View Request', `${appUrl}/requests`),
    });
  }

  async sendApprovalRequired({ to, approverName, requesterName, refNo, workflowName, stageName, amount, comment, appUrl }) {
    const body = `
      <p>Hello <strong>${approverName}</strong>,</p>
      <p>A workflow request requires your approval action.</p>
      <div class="info-row"><span class="info-label">Reference:</span><span class="info-value">${refNo}</span></div>
      <div class="info-row"><span class="info-label">Workflow:</span><span class="info-value">${workflowName}</span></div>
      <div class="info-row"><span class="info-label">Requested by:</span><span class="info-value">${requesterName}</span></div>
      <div class="info-row"><span class="info-label">Stage:</span><span class="info-value">${stageName}</span></div>
      ${amount > 0 ? `<div class="info-row"><span class="info-label">Amount:</span><span class="info-value">LKR ${amount.toLocaleString()}</span></div>` : ''}
      <hr class="divider">
      <p>Please log in to FinFlow to review and take action on this request.</p>`;
    return this.send({
      to,
      subject: `[FinFlow] Action Required – ${refNo} – ${stageName}`,
      html: this.buildEmailHTML(`Action Required: ${stageName}`, body, 'Review & Approve', `${appUrl}/approvals`),
    });
  }

  async sendStageCompleted({ to, requesterName, refNo, workflowName, stageName, action, actorName, comment, nextStage, appUrl }) {
    const isApproved = action === 'approved';
    const actionColor = isApproved ? '#15803d' : '#dc2626';
    const actionBg = isApproved ? '#dcfce7' : '#fee2e2';
    const body = `
      <p>Hello <strong>${requesterName}</strong>,</p>
      <p>Your request <strong>${refNo}</strong> has been <span style="color:${actionColor};font-weight:600;">${action}</span> at the <strong>${stageName}</strong> stage.</p>
      <div class="info-row"><span class="info-label">Actioned by:</span><span class="info-value">${actorName}</span></div>
      ${comment ? `<div style="background:#f9fafb;border-left:3px solid ${actionColor};padding:10px 14px;border-radius:4px;margin:12px 0;font-size:13px;color:#374151;">"${comment}"</div>` : ''}
      ${nextStage ? `<p>Next step: <strong>${nextStage}</strong></p>` : '<p>Your request has completed all approval stages.</p>'}`;
    return this.send({
      to,
      subject: `[FinFlow] ${refNo} ${action.charAt(0).toUpperCase() + action.slice(1)} at ${stageName}`,
      html: this.buildEmailHTML(`Request ${action.charAt(0).toUpperCase() + action.slice(1)}`, body, 'Track Status', `${appUrl}/requests`),
    });
  }

  async sendRequestCompleted({ to, requesterName, refNo, workflowName, finalStatus, appUrl }) {
    const isApproved = finalStatus === 'approved';
    const body = `
      <p>Hello <strong>${requesterName}</strong>,</p>
      <p>Your workflow request <strong>${refNo}</strong> has been <strong style="color:${isApproved ? '#15803d' : '#dc2626'}">${finalStatus.toUpperCase()}</strong> and all stages are complete.</p>
      <div class="info-row"><span class="info-label">Reference:</span><span class="info-value">${refNo}</span></div>
      <div class="info-row"><span class="info-label">Workflow:</span><span class="info-value">${workflowName}</span></div>
      <div class="info-row"><span class="info-label">Final Status:</span><span class="info-value" style="font-weight:600;color:${isApproved ? '#15803d' : '#dc2626'}">${finalStatus.toUpperCase()}</span></div>`;
    return this.send({
      to,
      subject: `[FinFlow] ${refNo} – ${isApproved ? 'Fully Approved & GL Posted' : 'Request Rejected'}`,
      html: this.buildEmailHTML(`Request ${isApproved ? 'Completed' : 'Rejected'}`, body, 'View Details', `${appUrl}/requests`),
    });
  }
}

module.exports = new EmailService();
