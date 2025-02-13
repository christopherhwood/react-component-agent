const mongoose = require('mongoose');

// mongoose object representing a snippet of code with an id, name, type, filePath, repoName, embedding, and hash of the code's contents
const userTaskSchema = new mongoose.Schema({
  title: { type: String},
  category: {type: String},
  description: { type: String, required: true },
  status: { type: String, required: true },
  code: String,
  error: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const UserTaskModel = mongoose.model('UserTask', userTaskSchema);

module.exports = UserTaskModel;