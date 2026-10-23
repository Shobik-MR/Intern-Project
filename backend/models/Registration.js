// ──────────────────────────────────────────────────────────────
// models/Registration.js  –  Student ↔ Event registration
// ──────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema(
  {
    student: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Student reference is required'],
    },

    event: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Event',
      required: [true, 'Event reference is required'],
    },

    registrationDate: {
      type:    Date,
      default: Date.now,
    },

    status: {
      type:    String,
      enum:    ['registered', 'cancelled'],
      default: 'registered',
    },
  },
  {
    timestamps: true,               // adds createdAt & updatedAt
    collection: 'registrations',    // explicit collection name
  }
);

// ── Unique compound index: one active registration per student per event ──
registrationSchema.index(
  { student: 1, event: 1 },
  { unique: true }
);

module.exports = mongoose.model('Registration', registrationSchema);
