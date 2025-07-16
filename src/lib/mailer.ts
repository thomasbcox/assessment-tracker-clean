import nodemailer from 'nodemailer';

// Factory for the default transporter
export function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.mailtrap.io',
    port: 587,
    auth: {
      user: process.env.MAILTRAP_USER,
      pass: process.env.MAILTRAP_PASS,
    },
  });
}

/**
 * Send an email using the provided transporter (or default if not provided)
 */
export function sendMail(
  options: Parameters<ReturnType<typeof createTransporter>["sendMail"]>[0],
  transporter?: ReturnType<typeof createTransporter>
) {
  const mailTransporter = transporter || createTransporter();
  return mailTransporter.sendMail(options);
} 