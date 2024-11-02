const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
const { collection, subscription } = require("./mongo");

require("dotenv").config();

const app = express();
const PORT = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 3000;

// Middleware to parse incoming JSON data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
app.use(cors({
  origin: '*', // Your domain
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true // Allow credentials if needed
}));

// Handle preflight requests


// Alternative CORS Middleware if needed


// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.Email_user,
    pass: process.env.Email_pass,
  },
});

// Verify mail configuration
transporter.verify((error, success) => {
  if (error) {
    console.log("Error occurred while sending mail", error);
  } else {
    console.log("Mail setup verified successfully", success);
  }
});

// Contact Form Route
app.post("/contact", async (req, res) => {
  const { name, email, message } = req.body;

  const data = {
    name,
    email,
    message,
  };

  // Store the data in your MongoDB collection
  await collection.insertMany([data]);

  // Send response
  res.status(200).json({
    message: "Thank you for contacting us! A reply email has been sent to you.",
  });

  // Send email to user
  const mailOptions = {
    from: process.env.Email_user,
    to: email,
    subject: `Thanks for contacting Coderz Academy, ${name}`,
    text: `Dear ${name},\n\nThank you for reaching out to Adiz Codez! We appreciate your interest.\n\nOur team is reviewing
     your message and will get back to you soon.\n\nBest regards,\nThe Adiz Team`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Reply email sent:", info.response);
  } catch (error) {
    console.error("Error sending reply email:", error);
    res.status(500).json({
      message: "There was an error sending your message. Please try again later.",
    });
  }
});

// Subscription Route
app.post("/subscribe", async (req, res) => {

  console.log('Received a subscription request:', req.body); 
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const existingSubscription = await subscription.findOne({ email });
    if (existingSubscription) {
      return res.status(200).json({ message: 'You are already supporting Adiz.' });
    }

    const newSubscription = new subscription({ email });
    await newSubscription.save();

    res.status(200).json({ message: 'Thanks for supporting Coderz academy!' });
  } catch (error) {
    console.error('Error handling subscription:', error);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }

  const mailOptions = {
    from: process.env.Email_user,
    to: email,
    subject: `Thanks for subscribing to Adiz Codez`,
    text: `Thank you for subscribing to Adiz! We're thrilled to have you onboard.\n\nWelcome aboard, and thank you for choosing Adiz!\n\nBest regards,\nThe Adiz Team`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Subscription email sent:", info.response);
  } catch (error) {
    console.error("Error sending subscription email:", error);
    res.status(500).json({
      message: "There was an error sending your message. Please try again later.",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
