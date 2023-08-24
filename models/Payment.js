const mongoose = require("mongoose");

const PaymentsSchema = mongoose.Schema({
  paymentName: {
    type: String,
    required: true,
  },
  service: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: false,
  },
  note: {
    type: String,
    required: false,
  },
});

const PaymentsModel = mongoose.model("Payments", PaymentsSchema);
module.exports = PaymentsModel;
