import { createTransport } from "nodemailer";

const hasSmtpConfig = process.env.SMTP_USER && process.env.SMTP_PASS && process.env.SENDER_EMAIL;

// Create a transporter using SMTP
const transporter = hasSmtpConfig ? createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
}) : null;

const sendEmail = async ({to, subject, body}) => {
    if (!transporter) {
        console.warn(`Skipping email "${subject}" to ${to} because SMTP credentials are not configured.`);
        return { skipped: true };
    }

    const response = await transporter.sendMail({
        from: process.env.SENDER_EMAIL,
        to,
        subject,
        html: body
    })
    return response;
}

export default sendEmail
