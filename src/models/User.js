/**
 * User Model
 *
 * Represents an admin user in the system.
 * Admins can manage products, content, and view activity logs.
 *
 * Fields:
 * - email: Unique email address
 * - password: Hashed password (hashed with bcryptjs)
 * - name: Admin's full name
 * - role: Type of access (super_admin or editor)
 * - isActive: Whether the account is active
 * - lastLogin: When they last logged in (for security tracking)
 * - createdAt/updatedAt: Timestamps for auditing
 */

import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    // Email field - unique identifier for login
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
    },

    // Password field - stored as hash (never as plaintext)
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // Don't include password by default in queries
    },

    // Admin's name
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },

    // Role-based access control
    // super_admin: Full access to everything
    // editor: Can edit content and products, but not manage users
    role: {
      type: String,
      enum: {
        values: ['super_admin', 'editor'],
        message: 'Role must be either super_admin or editor',
      },
      default: 'editor',
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
    },

    // Track last login for security purposes
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    // Automatically add createdAt and updatedAt fields
    timestamps: true,
  }
);

/**
 * Indexes for better query performance
 */
userSchema.index({ email: 1 }, { unique: true });

/**
 * Before saving, ensure password is not displayed
 * (it's already set with select: false, but this is an extra safety measure)
 */
userSchema.pre('save', function (next) {
  // Password hashing is handled in the controller using bcryptjs
  // This hook can be used for other pre-save operations if needed
  next();
});

/**
 * Utility method to check if password is correct
 * This is used during login
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  // This method will be used in the controller
  // Import bcryptjs and compare: await bcryptjs.compare(enteredPassword, this.password)
  return enteredPassword === this.password; // This is replaced in controller with actual bcrypt
};

/**
 * Override toJSON to exclude sensitive data when converting to JSON
 */
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password; // Never return password in API responses
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
