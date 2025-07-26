const express = require("express");
const Razorpay = require("razorpay");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const {
  validateWebhookSignature,
} = require("razorpay/dist/utils/razorpay-utils");

const app = express();
const port = process.env.PAYMENT_PORT || 3001; // Different port

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_gJyeQ7PpskfU2x",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "VySL1IsLhWq7CXfmCbmOUAZG",
});

// Your existing Razorpay endpoints...
// (Keep all your existing payment logic here)

app.listen(port, () => {
  console.log(`💳 Payment Server running on port ${port}`);
  console.log("Payment server started successfully!");
});

module.exports = app;
