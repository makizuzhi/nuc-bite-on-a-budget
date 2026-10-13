const { Schema, model } = require('mongoose');
const { CATEGORY_RULES } = require('./constants');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const transactionSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'User is required'], index: true },
    type: {
      type: String,
      enum: { values: ['expense', 'income'], message: '{VALUE} is not a valid type' },
      default: 'expense',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [CATEGORY_RULES.min, `Category must be at least ${CATEGORY_RULES.min} characters`],
      maxlength: [CATEGORY_RULES.max, `Category must be at most ${CATEGORY_RULES.max} characters`],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      max: [1000000, 'Amount is too large'],
    },
    description: { type: String, trim: true, maxlength: [120, 'Description must be at most 120 characters'], default: '' },
    // Date + time of the purchase (the form's date and time pickers are combined).
    occurredAt: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
      validate: {
        // Allow a 1-day grace period for timezone differences, but no far-future entries.
        validator: (d) => d.getTime() <= Date.now() + ONE_DAY_MS,
        message: 'Date cannot be in the future',
      },
    },
    // Set when the expense was logged from the Craving Randomizer ("Accept & log meal").
    meal: { type: Schema.Types.ObjectId, ref: 'WheelItem', default: null },
    stall: { type: String, trim: true, maxlength: [60, 'Stall name is too long'], default: '' },
  },
  { timestamps: true }
);

// Fast "this user's transactions in a date range" queries (calendar, charts).
transactionSchema.index({ user: 1, occurredAt: -1 });

module.exports = model('Transaction', transactionSchema);
