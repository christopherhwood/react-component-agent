const mongoose = require('mongoose');

const editSchema = new mongoose.Schema({
  originalCode: { type: String },
  edit: {
    replacedCode: { type: String },
    newCode: { type: String },
  },
  newCode: { type: String, required: true },
  subtaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Subtask', required: true },
}, { timestamps: true });

const EditModel = mongoose.model('Edit', editSchema);

module.exports = EditModel;