const { Schema, model } = require('mongoose');
const { STALL_NAMES, ALL_STALLS } = require('./constants');

/**
 * Student profile + allowance settings.
 *
 * NOTE: remaining balance, daily/weekly budget and the budget streak are NOT
 * stored here. They are derived from `allowance`, `cycleStart`, `cycleLengthDays`
 * and the user's transactions, so they can never get out of sync.
 */
const userSchema = new Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters'],
      maxlength: [80, 'Full name must be at most 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Student email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    // bcrypt hash of the password. Never the plain password, and never sent to the client.
    passwordHash: { type: String, required: [true, 'Password is required'], select: false },
    role: {
      type: String,
      enum: { values: ['Student', 'Working Student'], message: '{VALUE} is not a valid role' },
      default: 'Student',
    },
    // Total allowance for the current cycle (the "Set balance" button edits this).
    allowance: {
      type: Number,
      required: [true, 'Allowance is required'],
      min: [0, 'Allowance cannot be negative'],
      max: [1000000, 'Allowance is too large'],
      default: 0,
    },
    // Allowance cycle window, e.g. 30 days from the day the allowance arrived.
    cycleStart: { type: Date, required: true, default: Date.now },
    cycleLengthDays: {
      type: Number,
      min: [7, 'A cycle must be at least 7 days'],
      max: [62, 'A cycle can be at most 62 days'],
      default: 30,
    },
    program: { type: String, trim: true, maxlength: [80, 'Program must be at most 80 characters'], default: '' },
    studentNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Student number must be at most 20 characters'],
      match: [/^[A-Za-z0-9-]*$/, 'Student number may only contain letters, numbers and dashes'],
      default: '',
    },
    // True once the student's Food Wheel has been filled from the stall menus (see routes/wheel.js).
    wheelSeeded: { type: Boolean, default: false },
    preferences: {
      defaultMaxBudget: { type: Number, min: [1, 'Max budget must be at least 1'], default: 200 },
      defaultStall: {
        type: String,
        enum: { values: [ALL_STALLS, ...STALL_NAMES], message: '{VALUE} is not a valid stall' },
        default: ALL_STALLS,
      },
      lowAllowanceAlertPercent: {
        type: Number,
        min: [5, 'Alert threshold must be at least 5%'],
        max: [50, 'Alert threshold must be at most 50%'],
        default: 20,
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      // Safety net: even if the hash was loaded, it is removed from every JSON response.
      transform: (doc, ret) => { delete ret.passwordHash; delete ret.__v; return ret; },
    },
  }
);

module.exports = model('User', userSchema);
