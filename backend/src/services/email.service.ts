import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

interface SendInvitationEmailInput {
  to: string;
  username: string;
  role: string;
  invitationToken: string;
}

export const sendInvitationEmail = async ({
  to,
  username,
  role,
  invitationToken
}: SendInvitationEmailInput) => {
  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not configured");
  }

  const activationUrl =
    `${frontendUrl}/activate-account?token=${invitationToken}`;
      

    console.log("Sending invitation email to:", to); 
    console.log("SMTP user:", env.SMTP_USER);
    
  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject: "HMS Account Invitation",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Hospital Management System</h2>

        <p>Hello <strong>${username}</strong>,</p>

        <p>
          An account has been created for you in the
          Hospital Management System.
        </p>

        <p>
          <strong>Username:</strong> ${username}<br />
          <strong>Role:</strong> ${role}
        </p>

        <p>
          Please click the button below to activate your account
          and set your password.
        </p>

        <p>
          <a
            href="${activationUrl}"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #2563eb;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Activate Account
          </a>
        </p>

        <p>
          This invitation link will expire in 24 hours.
        </p>

        <p>
          If you did not expect this invitation, you can ignore
          this email.
        </p>

        <p>
          Regards,<br />
          Hospital Management System
        </p>
      </div>
    `
  });
};