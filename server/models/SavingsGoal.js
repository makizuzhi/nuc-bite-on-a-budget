const { Schema, model } = require('mongoose');

/** A savings target (e.g. "New laptop"). Progress is derived from its SavingsEntry documents. */
const savingsGoalSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'User is required'], index: true },
    name: {
      type: String,
      required: [true, 'Goal name is required'],
      trim: true,
      minlength: [2, 'Goal name must be at least 2 characters'],
      maxlength: [60, 'Goal name must be at most 60 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target must be at least 1'],
      max: [10000000, 'Target is too large'],
    },
    deadline: { type: Date, default: null },
    status: {
      type: String,
      enum: { values: ['active', 'achieved', 'archived'], message: '{VALUE} is not a valid status' },
      default: 'active',
    },
  },
  { timestamps: true }
);

savingsGoalSchema.index({ user: 1, name: 1 }, { unique: true });

module.exports = model('SavingsGoal', savingsGoalSchema);
