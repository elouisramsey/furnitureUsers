const mongoose = require('mongoose')
const userSchema = new mongoose.Schema(
  {
    nameofvendor: {
      type: String,
      required: [true, 'Enter your name'],
      trim: true,
      minlength: 3
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    state: { type: String },
    sex: { type: String },
    phone: {
      type: String,
      trim: true,
      minlength: 10,
      maxlength: 10
    },
    avatar: {
      type: String
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model('users', userSchema)
