const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost/dtpl');

var userSchema = new mongoose.Schema({
  name: String,
  email: {type: String, required: true, unique: true},
  profilepic: {
    type: String,
    default: '../images/Uploads/def.webp'
  },
  contact: String,
  password: String
}, {timestamps: true});

module.exports = mongoose.model('users', userSchema);