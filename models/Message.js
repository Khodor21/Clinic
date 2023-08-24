const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  room: String,
  author: String,
  message: String,
  time: Date, // Change the type to Date
});

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
