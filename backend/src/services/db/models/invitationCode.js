const mongoose = require('mongoose');

const invitationCodeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true },
  maxUses: { type: Number, required: true },
  uses: { type: Number, required: true },
}, { timestamps: true });

const InvitationCodeModel = mongoose.model('InvitationCode', invitationCodeSchema);

module.exports = InvitationCodeModel;