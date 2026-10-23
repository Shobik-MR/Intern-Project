// ──────────────────────────────────────────────────────────────
// routes/events.js  –  CRUD endpoints for events
// ──────────────────────────────────────────────────────────────
const express = require('express');
const Event   = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ── GET /api/events  –  list all events (public) ────────────
router.get('/', async (req, res) => {
  try {
    const { category, status, search } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (status)   filter.status   = status;
    if (search) {
      filter.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { venue:       { $regex: search, $options: 'i' } },
      ];
    }

    const events = await Event.find(filter)
      .populate('createdBy', 'name email')
      .sort({ date: 1 });

    res.json(events);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── GET /api/events/:id  –  single event details (public) ───
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── POST /api/events  –  create event (admin only) ──────────
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { title, description, date, time, venue, category, maxParticipants, image } = req.body;

    const event = await Event.create({
      title,
      description,
      date,
      time,
      venue,
      category,
      maxParticipants,
      image: image || '',
      createdBy: req.user._id,
    });

    res.status(201).json({ message: 'Event created successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── PUT /api/events/:id  –  update event (admin only) ───────
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    const allowedFields = [
      'title', 'description', 'date', 'time',
      'venue', 'category', 'maxParticipants', 'status', 'image',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });

    await event.save();

    res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── DELETE /api/events/:id  –  delete event (admin only) ────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
