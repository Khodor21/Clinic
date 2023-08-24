const mongoose = require("mongoose");

const PatientSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  number: {
    type: Number,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  next: {
    type: Date,
  },
  last: {
    type: Date,
  },
  message: {
    type: String,
  },
  service: {
    type: String,
  },
  timeSlot: {
    type: String,
    // required: true,
  },
  appointmentTime: {
    type: String,
  },
  price: {
    type: Number,
  },
  selectedTime: {
    type: String,
    default: "",
  },
});
PatientSchema.index({ name: "text" }); // Enable text search on 'title' and 'description' fields

const PatientModel = mongoose.model("Appointment", PatientSchema);

module.exports = PatientModel;
