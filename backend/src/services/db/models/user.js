const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  identity: {
    id: { type: String, required: true },
    name: { type: String, required: true },
  },
  provider: { type: String, required: true },
  inviteCode: { type: mongoose.Schema.Types.ObjectId, ref: 'InvitationCode'},
  activated: { type: Boolean, required: true, default: false},
}, { timestamps: true });

const UserModel = mongoose.model('User', userSchema);

module.exports = UserModel;