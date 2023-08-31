const express = require("express");
const router = express.Router();
const Patient = require("../models/Patient");
const Message = require("../models/Blog");
const Payments = require("../models/Payment");
const Time = require("../models/Time");

// Payment CRUD
router.post("/payments", async (req, res) => {
  try {
    const postedPayments = new Payments({
      paymentName: req.body.paymentName,
      service: req.body.service,
      price: req.body.price,
      date: req.body.date,
      note: req.body.note,
    });
    const savedPostPayments = await postedPayments.save();
    res.json(savedPostPayments);
  } catch (error) {
    console.log(error);
    res.status(500).send("Post Uncompleted!");
  }
});

router.get("/getPayments", async (req, res) => {
  try {
    const getPayments = await Payments.find(
      {},
      "paymentName service price note date"
    );
    res.json(getPayments);
  } catch (error) {
    console.log(error);
    res.status(500).send("Get Doesn't Work!");
  }
});
router.put("/:id", async (req, res) => {
  try {
    const payment = await Payments.findById(req.params.id);
    payment.paymentName = req.body.paymentName || payment.paymentName;
    payment.service = req.body.service || payment.service;
    payment.price = req.body.price || payment.price;
    payment.date = req.body.date || payment.date;
    payment.note = req.body.note || payment.note;

    const savedPayment = await payment.save();
    res.json(savedPayment);
  } catch (error) {
    console.log("Edited Payment Gives An Error", { error });
  }
});

// GET income payments for each month

router.get("/income", async (req, res) => {
  try {
    const income = await Payments.aggregate([
      {
        $group: {
          _id: { $month: "$date" },
          totalIncome: { $sum: "$price" },
        },
      },
    ]);

    res.json(income);
  } catch (error) {
    console.log(error);
    res.status(500).send("Failed to fetch income payments");
  }
});

router.get("/getallpatients", async (req, res) => {
  const { date } = req.query;

  try {
    let patients;

    if (date) {
      // find all patients whose next date matches the query date
      patients = await Patient.find({ last: new Date(date) });
    } else {
      // find all patients if no date is provided
      patients = await Patient.find({});
    }

    return res.json({ patients });
  } catch (err) {
    return res.status(404).json({ message: err });
  }
});

router.post("/patients", async (req, res) => {
  try {
    const patient = new Patient({
      name: req.body.name,
      number: req.body.number,
      city: req.body.city,
      next: req.body.next,
      last: req.body.last,
      message: req.body.message,
      service: req.body.service,
      timeSlot: req.body.timeSlot,
      appointmentTime: req.body.appointmentTime,
    });

    const savedPatient = await patient.save();
    res.json(savedPatient);
  } catch (err) {
    console.error(err);
  }
});

// Send Admin Time In Select option
router.post("/time", async (req, res) => {
  try {
    const postTime = new Time({
      time: req.body.time,
    });
    const postedTime = await postTime.save();
    res.json(postedTime);
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
});

// Get Admin Time In Select option

router.get("/getTime", async (req, res) => {
  try {
    const times = await Time.find({}, "time");
    res.json(times);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error retrieving times");
  }
});

router.put("/:id", async (req, res) => {
  try {
    // Find the patient with the specified ID in the database
    const patient = await Patient.findById(req.params.id);

    // Update the patient's information with data from the request body
    patient.name = req.body.name || patient.name;
    patient.number = req.body.number || patient.number;
    patient.city = req.body.city || patient.city;
    patient.next = req.body.next || patient.next;
    patient.last = req.body.last || patient.last;
    patient.appointmentTime =
      req.body.appointmentTime || patient.appointmentTime;

    // Save the updated patient information to the database
    const updatedPatient = await patient.save();

    // Return the updated patient information as a response
    res.json(updatedPatient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    // Find the patient with the specified ID in the database
    const patient = await Patient.findById(req.params.id);

    // If the patient doesn't exist, return a 404 error
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Remove the patient from the database
    await Patient.deleteOne({ _id: req.params.id });
    // Return a success message as a response
    res.json({ message: "Patient removed successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

router.get("/search", async (req, res) => {
  let query = req.query.query;
  if (query) {
    query = decodeURIComponent(query);
  }

  try {
    const results = await Patient.find({ $text: { $search: query } });
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/getmonthpatients", async (req, res) => {
  try {
    const pipeline = [
      {
        $group: {
          _id: { $month: "$last" }, // Group appointments by month
          totalAppointments: { $sum: 1 }, // Count the number of appointments in each group
        },
      },
    ];

    const appointmentsByMonth = await Patient.aggregate(pipeline);

    return res.json({ appointmentsByMonth });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
