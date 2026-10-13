const { Schema, model } = require('mongoose');
const { STALL_NAMES } = require('./constants');

/**
 * One slice-candidate on a student's Food Wheel.
 * A student's wheel starts as a copy of every stall menu (isCustom = false) and can then be
 * customized: add their own foods, edit names / prices, remove items, or reset to the defaults.
 */
const wheelItemSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'User is required'], index: true },
    stall: {
      type: String,
      required: [true, 'Stall is required'],
      enum: { values: STALL_NAMES, message: '{VALUE} is not one of the campus food stalls' },
    },
    name: {
      type: String,
      required: [true, 'Food name is required'],
      trim: true,
      minlength: [2, 'Food name must be at least 2 characters'],
      maxlength: [60, 'Food name must be at most 60 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Estimated cost is required'],
      min: [1, 'Cost must be at least 1'],
      max: [5000, 'Cost is too high for a student meal'],
    },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// A student cannot have the same dish twice for the same stall.
wheelItemSchema.index({ user: 1, stall: 1, name: 1 }, { unique: true });

module.exports = model('WheelItem', wheelItemSchema);
