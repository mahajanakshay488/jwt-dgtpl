const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/dtpl');

var userSchema = new mongoose.Schema({
  email: {type: String, required: true, unique: true},
  password: String
}, {timestamps: true});

module.exports = mongoose.model('users', userSchema);