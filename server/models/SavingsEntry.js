const { Schema, model } = require('mongoose');

/**
 * Money moved into (deposit) or out of (withdrawal) the savings pocket.
 * The pocket total is derived: sum(deposits) - sum(withdrawals).
 */
const savingsEntrySchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'User is required'], index: true },
    goal: { type: Schema.Types.ObjectId, ref: 'SavingsGoal', default: null },
    kind: {
      type: String,
      enum: { values: ['deposit', 'withdrawal'], message: '{VALUE} is not a valid kind' },
      default: 'deposit',
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
      max: [10000000, 'Amount is too large'],
    },
    note: { type: String, trim: true, maxlength: [120, 'Note must be at most 120 characters'], default: '' },
    savedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

savingsEntrySchema.index({ user: 1, savedAt: -1 });

module.exports = model('SavingsEntry', savingsEntrySchema);
