const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

/**
 * Send an email
 */
async function sendEmail({ to, subject, html, text }) {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Student Management System'}" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      text: text || html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error('Failed to send email', { to, subject, error: err.message });
    throw err;
  }
}

/**
 * Send student ID after registration
 */
async function sendStudentIdEmail({ email, studentId, firstName, dashboardUrl }) {
  const loginUrl = dashboardUrl || (process.env.APP_URL || 'http://localhost:3000');
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">Welcome to Student Management System</h2>
      <p>Hello ${firstName || 'Student'},</p>
      <p>Your registration was successful. Your unique Student ID is:</p>
      <div style="background: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">
        ${studentId}
      </div>
      <p><strong>Important:</strong> Keep this ID safe. You will need it to access exams.</p>
      <p>Access your personalised dashboard here:<br>
        <a href="${loginUrl}" style="color: #2563eb;">${loginUrl}</a>
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
      <p style="color: #64748b; font-size: 12px;">This is an automated message. Please do not reply.</p>
    </div>
  `;
  return sendEmail({
    to: email,
    subject: 'Your Student ID - Registration Successful',
    html,
  });
}

/**
 * Send absence alert to all admins
 */
async function sendAbsenceAlertEmail({ adminEmails, studentName, studentId, absenceCount }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #dc2626;">⚠️ Absence Alert</h2>
      <p>This is an automated alert from the Student Management System.</p>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Student Name</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${studentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Student ID</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0;">${studentId}</td>
        </tr>
        <tr>
          <td style="padding: 8px; border: 1px solid #e2e8f0; font-weight: bold;">Total Absences</td>
          <td style="padding: 8px; border: 1px solid #e2e8f0; color: #dc2626; font-weight: bold;">${absenceCount}</td>
        </tr>
      </table>
      <p>This student has exceeded the maximum allowed absences (3). Please take appropriate action.</p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
      <p style="color: #64748b; font-size: 12px;">This is an automated message. Please do not reply.</p>
    </div>
  `;
  return sendEmail({
    to: adminEmails.join(', '),
    subject: `⚠️ Absence Alert: ${studentName} has ${absenceCount} absences`,
    html,
  });
}

/**
 * Send announcement broadcast email to a single recipient
 */
async function sendAnnouncementEmail({ email, firstName, title, body }) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #2563eb;">📢 New Announcement</h2>
      <p>Hello ${firstName || 'Student'},</p>
      <div style="background: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
        <h3 style="margin: 0 0 10px; color: #1e40af;">${title}</h3>
        <p style="margin: 0; color: #374151; white-space: pre-wrap;">${body}</p>
      </div>
      <p>Login to view more details: <a href="${process.env.APP_URL || 'http://localhost:3000'}">${process.env.APP_URL || 'http://localhost:3000'}</a></p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
      <p style="color: #64748b; font-size: 12px;">This is an automated message. Please do not reply.</p>
    </div>
  `;
  return sendEmail({ to: email, subject: `📢 Announcement: ${title}`, html });
}

module.exports = { sendEmail, sendStudentIdEmail, sendAbsenceAlertEmail, sendAnnouncementEmail };

