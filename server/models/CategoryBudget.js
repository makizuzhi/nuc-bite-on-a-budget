const { Schema, model } = require('mongoose');
const { CATEGORY_RULES } = require('./constants');

/** Per-category spending limit for the allowance cycle ("Category budgets" + "Low-budget alerts"). */
const categoryBudgetSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'User is required'], index: true },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [CATEGORY_RULES.min, `Category must be at least ${CATEGORY_RULES.min} characters`],
      maxlength: [CATEGORY_RULES.max, `Category must be at most ${CATEGORY_RULES.max} characters`],
    },
    limit: {
      type: Number,
      required: [true, 'Limit is required'],
      min: [1, 'Limit must be at least 1'],
      max: [1000000, 'Limit is too large'],
    },
    // Fraction of the limit at which a low-budget alert fires (0.8 = at 80% spent).
    alertThreshold: {
      type: Number,
      min: [0.1, 'Threshold must be at least 0.1'],
      max: [1, 'Threshold must be at most 1'],
      default: 0.8,
    },
  },
  { timestamps: true }
);

// One budget per category per student.
categoryBudgetSchema.index({ user: 1, category: 1 }, { unique: true });

module.exports = model('CategoryBudget', categoryBudgetSchema);
