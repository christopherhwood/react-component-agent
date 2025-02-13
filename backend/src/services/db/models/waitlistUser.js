const mongoose = require('mongoose');

const waitlistUserSchema = new mongoose.Schema({
  email: { type: String, required: true },
}, { timestamps: true });

const WaitlistUserModel = mongoose.model('WaitlistUser', waitlistUserSchema);

module.exports = WaitlistUserModel;