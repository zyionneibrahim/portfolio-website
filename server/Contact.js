const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({ // Define the Contact schema with fields for name, email, phone, organisation, message, and createdAt
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    organisation: { type: String },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contact', contactSchema);