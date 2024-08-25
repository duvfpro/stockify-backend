const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  storeName:String,
  username: String,
  email:String,
  profilePicture: {type:String,default:''},
  isAdmin: Boolean,
  password: String,
  token:String,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
});

const User = mongoose.model('users', userSchema);

module.exports = User;