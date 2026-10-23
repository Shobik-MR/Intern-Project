// ──────────────────────────────────────────────────────────────
// routes/registrations.js  –  Event registration endpoints
// ──────────────────────────────────────────────────────────────
const express      = require('express');
const Registration = require('../models/Registration');
const Event        = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ── POST /api/registrations  –  register for an event ───────
router.post('/', protect, authorize('student'), async (req, res) => {
  try {
    const { eventId } = req.body;

    // 1. Check the event exists
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // 2. Check the event is not full
    if (event.currentParticipants >= event.maxParticipants) {
      return res.status(400).json({ message: 'Event is full – registration closed' });
    }

    // 3. Check for duplicate (active) registration
    const existing = await Registration.findOne({
      student: req.user._id,
      event:   eventId,
      status:  'registered',
    });
    if (existing) {
      return res.status(400).json({ message: 'You are already registered for this event' });
    }

    // 4. Check if user previously cancelled – re-activate instead of creating a new doc
    const cancelled = await Registration.findOne({
      student: req.user._id,
      event:   eventId,
      status:  'cancelled',
    });

    let registration;
    if (cancelled) {
      cancelled.status = 'registered';
      cancelled.registrationDate = new Date();
      registration = await cancelled.save();
    } else {
      registration = await Registration.create({
        student: req.user._id,
        event:   eventId,
      });
    }

    // 5. Increment participant count
    event.currentParticipants += 1;
    await event.save();

    res.status(201).json({ message: 'Registration successful', registration });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Duplicate registration is not allowed' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── PUT /api/registrations/:id/cancel  –  cancel registration
router.put('/:id/cancel', protect, authorize('student'), async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);

    if (!registration) {
      return res.status(404).json({ message: 'Registration not found' });
    }

    // Ensure the student owns the registration
    if (registration.student.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to cancel this registration' });
    }

    if (registration.status === 'cancelled') {
      return res.status(400).json({ message: 'Registration is already cancelled' });
    }

    registration.status = 'cancelled';
    await registration.save();

    // Decrement participant count
    await Event.findByIdAndUpdate(registration.event, {
      $inc: { currentParticipants: -1 },
    });

    res.json({ message: 'Registration cancelled successfully', registration });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── GET /api/registrations/my  –  student's own registrations
router.get('/my', protect, authorize('student'), async (req, res) => {
  try {
    const registrations = await Registration.find({
      student: req.user._id,
      status:  'registered',
    })
      .populate('event')
      .sort({ registrationDate: -1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ── GET /api/registrations/event/:eventId  –  participants list (admin)
router.get('/event/:eventId', protect, authorize('admin'), async (req, res) => {
  try {
    const registrations = await Registration.find({
      event:  req.params.eventId,
      status: 'registered',
    })
      .populate('student', 'name email department phone')
      .sort({ registrationDate: 1 });

    res.json(registrations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
