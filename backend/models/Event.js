// ──────────────────────────────────────────────────────────────
// models/Event.js  –  Event schema (college events)
// ──────────────────────────────────────────────────────────────
const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Event title is required'],
      trim:      true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    description: {
      type:      String,
      required:  [true, 'Event description is required'],
      trim:      true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    date: {
      type:     Date,
      required: [true, 'Event date is required'],
    },

    time: {
      type:     String,
      required: [true, 'Event time is required'],
      trim:     true,
    },

    venue: {
      type:     String,
      required: [true, 'Venue is required'],
      trim:     true,
    },

    category: {
      type:     String,
      required: [true, 'Category is required'],
      enum:     [
        'Technical',
        'Cultural',
        'Sports',
        'Workshop',
        'Seminar',
        'Hackathon',
        'Other',
      ],
    },

    maxParticipants: {
      type:     Number,
      required: [true, 'Maximum participant count is required'],
      min:      [1, 'At least 1 participant is required'],
    },

    currentParticipants: {
      type:    Number,
      default: 0,
      min:     0,
    },

    createdBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Event must have a creator'],
    },

    status: {
      type:    String,
      enum:    ['upcoming', 'ongoing', 'completed', 'cancelled'],
      default: 'upcoming',
    },

    image: {
      type:    String,
      default: '',
    },
  },
  {
    timestamps: true,          // adds createdAt & updatedAt
    collection: 'events',      // explicit collection name
  }
);

// ── Virtual: check if event is full ─────────────────────────
eventSchema.virtual('isFull').get(function () {
  return this.currentParticipants >= this.maxParticipants;
});

// Ensure virtuals are included when converting to JSON / Object
eventSchema.set('toJSON',   { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);
