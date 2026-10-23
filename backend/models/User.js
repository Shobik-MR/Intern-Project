// ──────────────────────────────────────────────────────────────
// models/User.js  –  User schema (students & administrators)
// ──────────────────────────────────────────────────────────────
const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,                         // one account per email
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },

    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false,   // never return password by default in queries
    },

    role: {
      type:    String,
      enum:    ['student', 'admin'],
      default: 'student',
    },

    department: {
      type: String,
      trim: true,
    },

    phone: {
      type:  String,
      trim:  true,
      match: [/^\d{10}$/, 'Phone number must be 10 digits'],
    },
  },
  {
    timestamps: true,          // adds createdAt & updatedAt
    collection: 'users',       // explicit collection name
  }
);

// ── Pre‑save hook: hash password before storing ─────────────
userSchema.pre('save', async function () {
  // Only hash if the password field was modified
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  this.password = await bcrypt.hash(this.password, salt);
});

// ── Instance method: compare candidate password with hash ───
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Transform: strip password from JSON output ──────────────
userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.password;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
