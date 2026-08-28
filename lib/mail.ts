import nodemailer from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';

const domain = process.env.NEXT_PUBLIC_APP_URL ?? '';
const currentYear = new Date().getFullYear();
const brandName = 'PASS College';
const productName = 'e-Advising System';
const fromName = `${brandName} ${productName}`;

const colors = {
  red: '#c9121f',
  gold: '#ebc42e',
  charcoal: '#1a1617',
  iron: '#eaeaeb',
  white: '#ffffff',
  muted: '#6b6566',
  body: '#3d3839',
  warningBg: '#fff8e1',
  warningBorder: '#ebc42e',
  warningText: '#7a5c00',
};

const fontFamily =
  "Georgia, 'Times New Roman', Times, serif";
const uiFont =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text: string;
  attachments?: Mail.Attachment[];
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstNameFrom(fullName: string) {
  const first = fullName.trim().split(/\s+/)[0];
  return first || 'there';
}

function createTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
}

export async function sendEmail({ to, subject, html, text, attachments }: SendEmailOptions) {
  const transporter = createTransporter();

  const mailOptions: Mail.Options = {
    from: `"${fromName}" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
    attachments,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

function emailLayout({
  preheader,
  eyebrow,
  title,
  content,
  buttonText,
  buttonHref,
}: {
  preheader: string;
  eyebrow: string;
  title: string;
  content: string;
  buttonText?: string;
  buttonHref?: string;
}) {
  const button = buttonText && buttonHref
    ? `
      <tr>
        <td align="center" style="padding:8px 0 28px 0">
          <a href="${escapeHtml(buttonHref)}" style="display:inline-block;background:${colors.red};color:${colors.iron};text-decoration:none;font-family:${uiFont};font-size:15px;font-weight:700;letter-spacing:0.01em;padding:14px 28px;border-radius:10px">${escapeHtml(buttonText)}</a>
        </td>
      </tr>
    `
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
</head>
<body>
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0;padding:24px 12px;background:${colors.iron};color:${colors.charcoal}">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:${colors.white};border-radius:16px;overflow:hidden;border:1px solid rgba(26,22,23,0.08)">
          <tr>
            <td style="height:4px;background:linear-gradient(90deg, ${colors.red} 0%, ${colors.gold} 50%, ${colors.red} 100%);font-size:0;line-height:0">&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:22px 28px 8px 28px">
              <p style="margin:0;font-family:${uiFont};font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${colors.red}">${escapeHtml(eyebrow)}</p>
              <h1 style="margin:8px 0 0 0;font-family:${fontFamily};font-size:26px;line-height:1.25;font-weight:700;color:${colors.charcoal}">${escapeHtml(title)}</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 28px 8px 28px;font-family:${uiFont};font-size:15px;line-height:1.65;color:${colors.body}">
              ${content}
            </td>
          </tr>
          ${button}
          <tr>
            <td style="padding:18px 28px 22px 28px;border-top:1px solid rgba(26,22,23,0.08);background:#f7f7f8">
              <p style="margin:0;font-family:${uiFont};font-size:12px;line-height:1.5;color:${colors.muted}">
                ${brandName} · ${productName}<br>
                This is an automated message. Please do not reply.<br>
                &copy; ${currentYear} ${brandName}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function fallbackLink(href: string) {
  return `
    <p style="margin:20px 0 0 0;font-size:13px;color:${colors.muted}">If the button does not work, copy and paste this link into your browser:</p>
    <p style="margin:8px 0 0 0;font-size:13px;word-break:break-all;color:${colors.red}">${escapeHtml(href)}</p>
  `;
}

export const sendTwoFactorTokenEmail = async (email: string, token: string) => {
  const safeToken = escapeHtml(token);
  const content = `
    <p style="margin:0 0 18px 0">Use this code to finish signing in to your ${productName} account.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0">
      <tr>
        <td align="center" style="background:${colors.iron};border:1px solid rgba(201,18,31,0.18);border-radius:12px;padding:20px">
          <p style="margin:0;font-family:${uiFont};font-size:32px;font-weight:800;letter-spacing:0.28em;color:${colors.red}">${safeToken}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:${colors.muted}">This code expires in <strong style="color:${colors.charcoal}">5 minutes</strong>. If you did not try to sign in, you can ignore this email — your account is still secure.</p>
  `;

  await sendEmail({
    to: email,
    subject: `${brandName} sign-in code: ${token}`,
    text: `Your ${brandName} ${productName} sign-in code is ${token}. It expires in 5 minutes. If you did not try to sign in, ignore this email.`,
    html: emailLayout({
      preheader: `Your sign-in code is ${token}. It expires in 5 minutes.`,
      eyebrow: brandName,
      title: 'Your sign-in code',
      content,
    }),
  });
};

export const sendPasswordResetEmail = async (email: string, token: string) => {
  const resetLink = `${domain}/auth/new-password?token=${encodeURIComponent(token)}`;

  const content = `
    <p style="margin:0 0 16px 0">We received a request to reset the password for your ${productName} account.</p>
    <p style="margin:0 0 8px 0;padding:14px 16px;background:${colors.warningBg};border-left:4px solid ${colors.warningBorder};border-radius:8px;color:${colors.warningText};font-size:14px">This link expires in <strong>1 hour</strong>. If you did not ask to reset your password, you can ignore this email.</p>
    ${fallbackLink(resetLink)}
  `;

  await sendEmail({
    to: email,
    subject: `Reset your ${brandName} password`,
    text: `Reset your ${brandName} ${productName} password using this link (expires in 1 hour):\n${resetLink}\n\nIf you did not request this, you can ignore this email.`,
    html: emailLayout({
      preheader: 'Choose a new password. This link expires in 1 hour.',
      eyebrow: brandName,
      title: 'Reset your password',
      content,
      buttonText: 'Choose a new password',
      buttonHref: resetLink,
    }),
  });
};

export const sendVerificationEmail = async (email: string, token: string) => {
  const confirmLink = `${domain}/auth/new-verification?token=${encodeURIComponent(token)}`;

  const content = `
    <p style="margin:0 0 16px 0">Confirm this email address so we can keep your ${productName} account secure and send you important updates.</p>
    ${fallbackLink(confirmLink)}
  `;

  await sendEmail({
    to: email,
    subject: `Confirm your email for ${brandName}`,
    text: `Confirm your email for ${brandName} ${productName}:\n${confirmLink}`,
    html: emailLayout({
      preheader: 'One click confirms your email and keeps your account secure.',
      eyebrow: brandName,
      title: 'Confirm your email',
      content,
      buttonText: 'Verify email address',
      buttonHref: confirmLink,
    }),
  });
};

export const sendStudentCredentialsEmail = async (
  email: string,
  fullName: string,
  temporaryPassword: string
) => {
  const loginLink = `${domain}/auth/login`;
  const firstName = escapeHtml(firstNameFrom(fullName));
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(temporaryPassword);

  const content = `
    <p style="margin:0 0 16px 0">Hi ${firstName}, an administrator created your student portal account. Use the details below to sign in.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;background:${colors.iron};border-radius:12px">
      <tr>
        <td style="padding:16px 18px">
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${colors.muted}">Email</p>
          <p style="margin:0 0 14px 0;font-size:15px;color:${colors.charcoal}">${safeEmail}</p>
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${colors.muted}">Temporary password</p>
          <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:16px;font-weight:700;color:${colors.red}">${safePassword}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:${colors.muted}">Sign in with this temporary password. You will be required to choose a new password before you can use the portal. Do not share it with anyone.</p>
    ${fallbackLink(loginLink)}
  `;

  return sendEmail({
    to: email,
    subject: `Your ${brandName} student portal is ready`,
    text: `Hi ${firstNameFrom(fullName)}, your ${brandName} student portal account is ready.\n\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n\nSign in here: ${loginLink}\n\nYou must change this password before you can use the portal.`,
    html: emailLayout({
      preheader: 'Your student portal account is ready. Sign in and set a new password.',
      eyebrow: `${brandName} · Student Portal`,
      title: 'Your account is ready',
      content,
      buttonText: 'Open student portal',
      buttonHref: loginLink,
    }),
  });
};

export const sendHeadCredentialsEmail = async (
  email: string,
  fullName: string,
  temporaryPassword: string,
  departmentLabels: string[]
) => {
  const loginLink = `${domain}/auth/login`;
  const firstName = escapeHtml(firstNameFrom(fullName));
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(temporaryPassword);
  const departments = departmentLabels.length
    ? departmentLabels.map((label) => escapeHtml(label)).join(", ")
    : "your assigned departments";

  const content = `
    <p style="margin:0 0 16px 0">Hi ${firstName}, an administrator created your department head account. Use the details below to sign in.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;background:${colors.iron};border-radius:12px">
      <tr>
        <td style="padding:16px 18px">
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${colors.muted}">Email</p>
          <p style="margin:0 0 14px 0;font-size:15px;color:${colors.charcoal}">${safeEmail}</p>
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${colors.muted}">Temporary password</p>
          <p style="margin:0 0 14px 0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:16px;font-weight:700;color:${colors.red}">${safePassword}</p>
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${colors.muted}">Assigned departments</p>
          <p style="margin:0;font-size:15px;color:${colors.charcoal}">${departments}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:${colors.muted}">Sign in with this temporary password. You will be required to choose a new password before you can use the dashboard. You will only see students and records for your assigned departments.</p>
    ${fallbackLink(loginLink)}
  `;

  return sendEmail({
    to: email,
    subject: `Your ${brandName} department head account is ready`,
    text: `Hi ${firstNameFrom(fullName)}, your ${brandName} department head account is ready.\n\nEmail: ${email}\nTemporary password: ${temporaryPassword}\nAssigned departments: ${departmentLabels.join(", ") || "none"}\n\nSign in here: ${loginLink}\n\nYou must change this password before you can use the dashboard.`,
    html: emailLayout({
      preheader: "Your department head account is ready. Sign in and set a new password.",
      eyebrow: `${brandName} · Department Head`,
      title: "Your account is ready",
      content,
      buttonText: "Open dashboard",
      buttonHref: loginLink,
    }),
  });
};

export const sendAdminCredentialsEmail = async (
  email: string,
  fullName: string,
  temporaryPassword: string
) => {
  const loginLink = `${domain}/auth/login`;
  const firstName = escapeHtml(firstNameFrom(fullName));
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(temporaryPassword);

  const content = `
    <p style="margin:0 0 16px 0">Hi ${firstName}, an administrator created your ${productName} admin account. Use the details below to sign in.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px 0;background:${colors.iron};border-radius:12px">
      <tr>
        <td style="padding:16px 18px">
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${colors.muted}">Email</p>
          <p style="margin:0 0 14px 0;font-size:15px;color:${colors.charcoal}">${safeEmail}</p>
          <p style="margin:0 0 4px 0;font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${colors.muted}">Temporary password</p>
          <p style="margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;font-size:16px;font-weight:700;color:${colors.red}">${safePassword}</p>
        </td>
      </tr>
    </table>
    <p style="margin:0;font-size:14px;color:${colors.muted}">Sign in with this temporary password. You will be required to choose a new password before you can use the dashboard. Do not share it with anyone.</p>
    ${fallbackLink(loginLink)}
  `;

  return sendEmail({
    to: email,
    subject: `Your ${brandName} administrator account is ready`,
    text: `Hi ${firstNameFrom(fullName)}, your ${brandName} ${productName} administrator account is ready.\n\nEmail: ${email}\nTemporary password: ${temporaryPassword}\n\nSign in here: ${loginLink}\n\nYou must change this password before you can use the dashboard.`,
    html: emailLayout({
      preheader: "Your administrator account is ready. Sign in and set a new password.",
      eyebrow: `${brandName} · Administrator`,
      title: "Your account is ready",
      content,
      buttonText: "Open dashboard",
      buttonHref: loginLink,
    }),
  });
};

export const sendGradeSubmissionCopyEmail = async ({
  to,
  studentName,
  studentId,
  termLabel,
  htmlBody,
  text,
  htmlAttachment,
}: {
  to: string;
  studentName: string;
  studentId: string;
  termLabel: string;
  htmlBody: string;
  text: string;
  htmlAttachment: string;
}) => {
  const firstName = escapeHtml(firstNameFrom(studentName));
  const content = `
    <p style="margin:0 0 16px 0">Hi ${firstName}, here is a copy of your grade submission form for <strong>${escapeHtml(termLabel)}</strong>.</p>
    ${htmlBody}
    <p style="margin:18px 0 0 0;font-size:14px;color:${colors.muted}">A printable copy is attached to this email. Keep it for your records. This copy was sent only to your student portal email.</p>
  `;

  return sendEmail({
    to,
    subject: `Your grade submission copy — ${studentId}`,
    text,
    html: emailLayout({
      preheader: `Your grade submission copy for ${termLabel}.`,
      eyebrow: `${brandName} · Student Portal`,
      title: 'Your grade submission copy',
      content,
    }),
    attachments: [
      {
        filename: `grade-submission-${studentId}.html`,
        content: htmlAttachment,
        contentType: 'text/html; charset=utf-8',
      },
    ],
  });
};
