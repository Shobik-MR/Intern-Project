// ──────────────────────────────────────────────────────────────
// scripts/seed.js  –  Idempotent seed script for EventHub
//
// Run with:   npm run seed
//
// Safe to run multiple times – it checks for existing records
// by email (users) and title (events) before inserting.
// ──────────────────────────────────────────────────────────────
require('dotenv').config();

const mongoose     = require('mongoose');
const bcrypt       = require('bcrypt');
const User         = require('../models/User');
const Event        = require('../models/Event');
const Registration = require('../models/Registration');

const SALT_ROUNDS = 10;

// ── Sample Users ────────────────────────────────────────────
const sampleUsers = [
  // Administrators
  {
    name:       'Dr. Priya Sharma',
    email:      'priya.sharma@college.edu',
    password:   'Admin@123',
    role:       'admin',
    department: 'Computer Science',
    phone:      '9876543210',
  },
  {
    name:       'Prof. Rajesh Kumar',
    email:      'rajesh.kumar@college.edu',
    password:   'Admin@123',
    role:       'admin',
    department: 'Electronics',
    phone:      '9876543211',
  },
  // Students
  {
    name:       'Aarav Mehta',
    email:      'aarav.mehta@student.college.edu',
    password:   'Student@123',
    role:       'student',
    department: 'Computer Science',
    phone:      '9123456780',
  },
  {
    name:       'Sneha Reddy',
    email:      'sneha.reddy@student.college.edu',
    password:   'Student@123',
    role:       'student',
    department: 'Information Technology',
    phone:      '9123456781',
  },
  {
    name:       'Mohammed Irfan',
    email:      'irfan.m@student.college.edu',
    password:   'Student@123',
    role:       'student',
    department: 'Mechanical Engineering',
    phone:      '9123456782',
  },
  {
    name:       'Kavya Nair',
    email:      'kavya.nair@student.college.edu',
    password:   'Student@123',
    role:       'student',
    department: 'Computer Science',
    phone:      '9123456783',
  },
  {
    name:       'Rohit Deshmukh',
    email:      'rohit.d@student.college.edu',
    password:   'Student@123',
    role:       'student',
    department: 'Civil Engineering',
    phone:      '9123456784',
  },
];

// ── Sample Events ───────────────────────────────────────────
const sampleEvents = [
  {
    title:           'TechFest 2026 – Annual Hackathon',
    description:     'A 24‑hour coding marathon where teams build innovative solutions to real‑world problems. Prizes worth ₹50,000 for top three teams. Open to all branches.',
    date:            new Date('2026-11-15'),
    time:            '09:00 AM',
    venue:           'Main Auditorium, Block A',
    category:        'Hackathon',
    maxParticipants: 200,
  },
  {
    title:           'AI & Machine Learning Workshop',
    description:     'Hands‑on workshop covering Python, TensorFlow, and real‑world ML model building. Bring your own laptop. Certificates will be provided.',
    date:            new Date('2026-11-08'),
    time:            '10:00 AM',
    venue:           'Seminar Hall 2, Block C',
    category:        'Workshop',
    maxParticipants: 60,
  },
  {
    title:           'Cultural Night – Tarang 2026',
    description:     'An evening of music, dance, and drama performances by students. Food stalls and photo booths available. Families welcome!',
    date:            new Date('2026-12-01'),
    time:            '05:00 PM',
    venue:           'Open Air Theatre',
    category:        'Cultural',
    maxParticipants: 500,
  },
  {
    title:           'Inter‑Department Cricket Tournament',
    description:     'T20 format cricket tournament between all departments. Register your team of 11 players. Trophies and individual awards for best performances.',
    date:            new Date('2026-11-20'),
    time:            '07:00 AM',
    venue:           'College Cricket Ground',
    category:        'Sports',
    maxParticipants: 120,
  },
  {
    title:           'Web Development Bootcamp',
    description:     'Three‑day intensive bootcamp on HTML, CSS, JavaScript, React, and Node.js. Build and deploy a full‑stack app by the end of day three.',
    date:            new Date('2026-11-25'),
    time:            '09:30 AM',
    venue:           'Computer Lab 3, Block B',
    category:        'Workshop',
    maxParticipants: 40,
  },
  {
    title:           'Cloud Computing Seminar',
    description:     'Industry experts from AWS and Google Cloud discuss cloud architecture, serverless computing, and career opportunities in cloud engineering.',
    date:            new Date('2026-12-05'),
    time:            '02:00 PM',
    venue:           'Conference Hall, Admin Block',
    category:        'Seminar',
    maxParticipants: 150,
  },
  {
    title:           'Robotics Exhibition & Competition',
    description:     'Showcase your robotics projects or participate in the line‑follower and maze‑solver bot competitions. Exciting prizes for winners!',
    date:            new Date('2026-12-10'),
    time:            '10:00 AM',
    venue:           'Innovation Lab, Block D',
    category:        'Technical',
    maxParticipants: 80,
  },
  {
    title:           'Photography Walk & Contest',
    description:     'Guided photography walk around campus followed by a contest. Theme: "Campus Life". Top 5 photos will be featured in the college magazine.',
    date:            new Date('2026-11-30'),
    time:            '04:00 PM',
    venue:           'Main Gate (Starting Point)',
    category:        'Cultural',
    maxParticipants: 50,
  },
];

// ── Main Seed Function ──────────────────────────────────────
async function seed() {
  try {
    console.log('🌱  Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅  Connected to MongoDB\n');

    // ─── Seed Users ──────────────────────────────────────────
    console.log('👤  Seeding users...');
    const createdUsers = [];

    for (const userData of sampleUsers) {
      const exists = await User.findOne({ email: userData.email });
      if (exists) {
        console.log(`   ↳ Skipped (exists): ${userData.email}`);
        createdUsers.push(exists);
      } else {
        const user = await User.create(userData);     // password hashed by pre‑save hook
        console.log(`   ↳ Created: ${userData.email}  [${userData.role}]`);
        createdUsers.push(user);
      }
    }

    // Separate admins and students
    const admins   = createdUsers.filter((u) => u.role === 'admin');
    const students = createdUsers.filter((u) => u.role === 'student');

    // ─── Seed Events ─────────────────────────────────────────
    console.log('\n📅  Seeding events...');
    const createdEvents = [];

    for (let i = 0; i < sampleEvents.length; i++) {
      const eventData = sampleEvents[i];
      const exists = await Event.findOne({ title: eventData.title });
      if (exists) {
        console.log(`   ↳ Skipped (exists): ${eventData.title}`);
        createdEvents.push(exists);
      } else {
        // Alternate which admin created the event
        const creator = admins[i % admins.length];
        const event   = await Event.create({ ...eventData, createdBy: creator._id });
        console.log(`   ↳ Created: ${eventData.title}`);
        createdEvents.push(event);
      }
    }

    // ─── Seed Registrations ──────────────────────────────────
    console.log('\n📝  Seeding registrations...');

    // Each student registers for 2–3 events
    const registrationPairs = [
      { studentIdx: 0, eventIdx: 0 },   // Aarav → Hackathon
      { studentIdx: 0, eventIdx: 1 },   // Aarav → AI Workshop
      { studentIdx: 1, eventIdx: 0 },   // Sneha → Hackathon
      { studentIdx: 1, eventIdx: 2 },   // Sneha → Cultural Night
      { studentIdx: 1, eventIdx: 4 },   // Sneha → Web Dev Bootcamp
      { studentIdx: 2, eventIdx: 3 },   // Irfan → Cricket
      { studentIdx: 2, eventIdx: 6 },   // Irfan → Robotics
      { studentIdx: 3, eventIdx: 1 },   // Kavya → AI Workshop
      { studentIdx: 3, eventIdx: 4 },   // Kavya → Web Dev Bootcamp
      { studentIdx: 3, eventIdx: 5 },   // Kavya → Cloud Seminar
      { studentIdx: 4, eventIdx: 2 },   // Rohit → Cultural Night
      { studentIdx: 4, eventIdx: 3 },   // Rohit → Cricket
      { studentIdx: 4, eventIdx: 7 },   // Rohit → Photography Walk
    ];

    for (const pair of registrationPairs) {
      const student = students[pair.studentIdx];
      const event   = createdEvents[pair.eventIdx];

      if (!student || !event) continue;

      const exists = await Registration.findOne({
        student: student._id,
        event:   event._id,
      });

      if (exists) {
        console.log(`   ↳ Skipped (exists): ${student.name} → ${event.title}`);
      } else {
        await Registration.create({
          student: student._id,
          event:   event._id,
        });

        // Increment participant count
        await Event.findByIdAndUpdate(event._id, {
          $inc: { currentParticipants: 1 },
        });

        console.log(`   ↳ Registered: ${student.name} → ${event.title}`);
      }
    }

    console.log('\n✅  Seeding complete!');
    console.log('───────────────────────────────────────');
    console.log(`   Users:         ${createdUsers.length}`);
    console.log(`   Events:        ${createdEvents.length}`);
    console.log(`   Registrations: ${registrationPairs.length}`);
    console.log('───────────────────────────────────────');
    console.log('\n📌  Login credentials:');
    console.log('   Admin:   priya.sharma@college.edu / Admin@123');
    console.log('   Student: aarav.mehta@student.college.edu / Student@123');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌  Seed error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
}

seed();
