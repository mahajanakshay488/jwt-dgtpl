const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/dtpl');

var userSchema = new mongoose.Schema({
  name: String,
  email: {type: String, unique: true},
  profilepic: String,
  contact: String,
  password: String
}, {timestamps: true});

module.exports = mongoose.model('users', userSchema);