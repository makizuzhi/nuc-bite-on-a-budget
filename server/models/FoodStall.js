const { Schema, model } = require('mongoose');
const { STALL_NAMES } = require('./constants');

/** One dish on a stall's menu (embedded in the stall document). */
const menuItemSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Menu item name is required'],
      trim: true,
      minlength: [2, 'Menu item name must be at least 2 characters'],
      maxlength: [60, 'Menu item name must be at most 60 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [1, 'Price must be at least 1'],
      max: [5000, 'Price is too high for a student meal'],
    },
    description: { type: String, trim: true, maxlength: [120, 'Description must be at most 120 characters'], default: '' },
    available: { type: Boolean, default: true },
  },
  { timestamps: true }
);

/**
 * A campus / local food stall and its (made-up, seeded) menu.
 * Stalls are shared by every student; students customize their own wheel through WheelItem.
 */
const foodStallSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Stall name is required'],
      unique: true,
      trim: true,
      enum: { values: STALL_NAMES, message: '{VALUE} is not one of the campus food stalls' },
    },
    description: { type: String, trim: true, maxlength: [200, 'Description must be at most 200 characters'], default: '' },
    specialty: { type: String, trim: true, maxlength: [60, 'Specialty must be at most 60 characters'], default: '' },
    menu: {
      type: [menuItemSchema],
      validate: { validator: (m) => m.length > 0, message: 'A stall needs at least one menu item' },
    },
  },
  { timestamps: true }
);

module.exports = model('FoodStall', foodStallSchema);
