/**
 * Email Service
 *
 * Handles all email sending functionality using Nodemailer with Gmail SMTP.
 *
 * What this does:
 * - Send password reset emails with reset link
 * - Send contact form submission notification to owner
 * - Send welcome emails (future)
 *
 * Why Nodemailer + Gmail?
 * - Free and simple setup
 * - No external API calls needed
 * - Works reliably
 * - Easy to switch to SendGrid later
 */

import nodemailer from 'nodemailer';
import ApiError, { ErrorTypes } from '../utils/errorHandler.js';

/**
 * Create email transporter
 * This is the connection to Gmail's SMTP server
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

/**
 * Send password reset email
 *
 * @param {string} recipientEmail - User's email
 * @param {string} resetLink - Full URL to reset page
 * @param {string} userName - User's name
 */
export const sendPasswordResetEmail = async (
  recipientEmail,
  resetLink,
  userName
) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: 'Password Reset Request - Mad Over Tiramisu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2C1810; padding: 20px; text-align: center;">
            <h1 style="color: #F5EFE0; margin: 0;">Mad Over Tiramisu</h1>
          </div>

          <div style="padding: 30px; background-color: #F5EFE0;">
            <h2 style="color: #2C1810;">Password Reset Request</h2>

            <p>Hi ${userName},</p>

            <p>We received a request to reset your password. Click the button below to set a new password.</p>

            <div style="margin: 30px 0; text-align: center;">
              <a href="${resetLink}"
                 style="background-color: #C0633A; color: #F5EFE0; padding: 12px 30px;
                        text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>

            <p style="font-size: 12px; color: #666;">
              Or copy and paste this link in your browser:<br>
              <a href="${resetLink}" style="color: #C0633A;">${resetLink}</a>
            </p>

            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              This link will expire in 1 hour.<br>
              If you didn't request a password reset, please ignore this email.
            </p>
          </div>

          <div style="background-color: #2C1810; padding: 20px; text-align: center; color: #C9A87C; font-size: 12px;">
            <p>&copy; 2024 Mad Over Tiramisu. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Password reset email sent' };
  } catch (error) {
    console.error('Email Error:', error);
    throw ErrorTypes.INTERNAL_SERVER_ERROR(
      'Failed to send password reset email'
    );
  }
};

/**
 * Send contact form notification email to owner
 *
 * @param {string} ownerEmail - Owner's email
 * @param {object} contactData - Contact form data
 */
export const sendContactFormEmail = async (ownerEmail, contactData) => {
  try {
    const transporter = createTransporter();

    const { name, email, phone, message } = contactData;

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: ownerEmail,
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2C1810; padding: 20px; text-align: center;">
            <h1 style="color: #F5EFE0; margin: 0;">Mad Over Tiramisu</h1>
          </div>

          <div style="padding: 30px; background-color: #F5EFE0;">
            <h2 style="color: #2C1810;">New Contact Form Submission</h2>

            <div style="background-color: #fff; padding: 20px; border-left: 4px solid #C0633A; margin: 20px 0;">
              <p><strong>From:</strong> ${name}</p>
              <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
              <p><strong>Message:</strong></p>
              <p style="white-space: pre-wrap;">${message}</p>
            </div>

            <p style="margin-top: 20px;">
              <a href="mailto:${email}" style="background-color: #C0633A; color: #F5EFE0; padding: 10px 20px;
                     text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reply to ${name}
              </a>
            </p>

            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              Submitted at: ${new Date().toLocaleString()}
            </p>
          </div>

          <div style="background-color: #2C1810; padding: 20px; text-align: center; color: #C9A87C; font-size: 12px;">
            <p>&copy; 2024 Mad Over Tiramisu. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Contact email sent to owner' };
  } catch (error) {
    console.error('Email Error:', error);
    throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to send contact email');
  }
};

/**
 * Send welcome email to new admin
 *
 * @param {string} email - Admin email
 * @param {string} name - Admin name
 * @param {string} tempPassword - Temporary password
 */
export const sendAdminWelcomeEmail = async (email, name, tempPassword) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Welcome to Mad Over Tiramisu Admin Panel',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2C1810; padding: 20px; text-align: center;">
            <h1 style="color: #F5EFE0; margin: 0;">Mad Over Tiramisu Admin Panel</h1>
          </div>

          <div style="padding: 30px; background-color: #F5EFE0;">
            <h2 style="color: #2C1810;">Welcome, ${name}!</h2>

            <p>Your admin account has been created. Use the credentials below to log in:</p>

            <div style="background-color: #fff; padding: 20px; border-left: 4px solid #C0633A; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Temporary Password:</strong> ${tempPassword}</p>
            </div>

            <p style="margin: 20px 0; color: #C0633A; font-weight: bold;">
              ⚠️ Please change your password on first login!
            </p>

            <div style="margin: 30px 0; text-align: center;">
              <a href="http://localhost:5173/admin/login"
                 style="background-color: #C0633A; color: #F5EFE0; padding: 12px 30px;
                        text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Go to Admin Panel
              </a>
            </div>

            <p style="margin-top: 30px; font-size: 12px; color: #666;">
              You can now manage products, content, and view activity logs.
            </p>
          </div>

          <div style="background-color: #2C1810; padding: 20px; text-align: center; color: #C9A87C; font-size: 12px;">
            <p>&copy; 2024 Mad Over Tiramisu. All rights reserved.</p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true, message: 'Welcome email sent' };
  } catch (error) {
    console.error('Email Error:', error);
    throw ErrorTypes.INTERNAL_SERVER_ERROR('Failed to send welcome email');
  }
};
