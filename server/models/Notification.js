const { Schema, model } = require('mongoose');

/** Items shown in the bell dropdown: budget alerts, low-allowance warnings, system updates, ... */
const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: [true, 'User is required'], index: true },
    type: {
      type: String,
      required: [true, 'Type is required'],
      enum: {
        values: ['weekly_summary', 'budget_alert', 'low_allowance', 'daily_budget', 'savings', 'system'],
        message: '{VALUE} is not a valid notification type',
      },
    },
    title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: [80, 'Title is too long'] },
    message: { type: String, trim: true, maxlength: [200, 'Message is too long'], default: '' },
    isRead: { type: Boolean, default: false },
    // Makes automatic alerts idempotent: one alert per (student, key), e.g. "low20:2026-10-01".
    dedupeKey: { type: String, default: null },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $type: 'string' } } });

module.exports = model('Notification', notificationSchema);
