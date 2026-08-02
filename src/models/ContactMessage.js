/**
 * Contact Message Model
 *
 * Stores messages submitted through the contact form on the landing page.
 * Admins can view these messages and see if an email was sent to the owner.
 */

import mongoose from 'mongoose';

const contactMessageSchema = new mongoose.Schema(
  {
    // Sender's name
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    // Sender's email (for reply)
    email: {
      type: String,
      required: [true, 'Email is required'],
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },

    // Sender's phone number (optional)
    phone: {
      type: String,
      default: null,
      trim: true,
    },

    // The message content
    message: {
      type: String,
      required: [true, 'Message is required'],
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },

    // Whether the email was successfully sent to the owner
    emailSent: {
      type: Boolean,
      default: false,
    },

    // If email failed, store the error message
    emailError: {
      type: String,
      default: null,
    },

    // Whether the admin has read this message
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt for when message was submitted
  }
);

/**
 * Indexes for better query performance
 */
contactMessageSchema.index({ email: 1 });
contactMessageSchema.index({ createdAt: -1 });
contactMessageSchema.index({ isRead: 1 });

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

export default ContactMessage;
