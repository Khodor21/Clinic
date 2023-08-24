const mongoose = require("mongoose");

const TimeSchema = mongoose.Schema({
  time: {
    type: String,
  },
});

const TimeModel = mongoose.model("Time", TimeSchema);
module.exports = TimeModel;
