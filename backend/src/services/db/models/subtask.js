const mongoose = require('mongoose');

// mongoose object representing a snippet of code with an id, name, type, filePath, repoName, embedding, and hash of the code's contents
const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  status: { type: String, required: true },
  userTaskId: { type: mongoose.Schema.Types.ObjectId, ref: 'UserTask', required: true },
  error: String,
}, { timestamps: true });

const SubtaskModel = mongoose.model('Subtask', subtaskSchema);

module.exports = SubtaskModel;