require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Project = require('./Project');
const Contact = require('./Contact');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

// Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('Hello, Portfolio Server is Running!');
});

// GET all projects
app.get('/api/projects', async (req, res) => {
    try {
        const projects = await Project.find();
        res.json(projects);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// POST a new project
app.post('/api/projects', async (req, res) => {
    try {
        const project = new Project(req.body);
        await project.save();
        res.status(201).json(project);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE a project by ID
app.delete('/api/projects/:id', async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT - update a project by ID
app.put('/api/projects/:id', async (req, res) => {
    try {
        const project = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(project);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// POST contact form submission
app.post('/api/contact', async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_TO,
            subject: `Portfolio Contact from ${req.body.name}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0D0F0E; color: #E8EDE9; padding: 40px; border-radius: 8px;">
                    <div style="border-bottom: 2px solid #7A9E7E; padding-bottom: 20px; margin-bottom: 30px;">
                        <h1 style="color: #7A9E7E; margin: 0; font-size: 24px;">New Portfolio Message</h1>
                        <p style="color: #8A9E8D; margin: 8px 0 0;">Someone reached out via your portfolio</p>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1A1F1B; color: #8A9E8D; width: 140px; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Name</td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1A1F1B; color: #E8EDE9; font-weight: bold;">${req.body.name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1A1F1B; color: #8A9E8D; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Email</td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1A1F1B;"><a href="mailto:${req.body.email}" style="color: #7A9E7E;">${req.body.email}</a></td>
                        </tr>
                        ${req.body.phone ? `
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1A1F1B; color: #8A9E8D; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Phone</td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1A1F1B; color: #E8EDE9;">${req.body.phone}</td>
                        </tr>` : ''}
                        ${req.body.organisation ? `
                        <tr>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1A1F1B; color: #8A9E8D; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Organisation</td>
                            <td style="padding: 12px 0; border-bottom: 1px solid #1A1F1B; color: #E8EDE9;">${req.body.organisation}</td>
                        </tr>` : ''}
                    </table>
                    <div style="margin-top: 30px;">
                        <p style="color: #8A9E8D; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">Message</p>
                        <p style="color: #E8EDE9; line-height: 1.8; background: #131714; padding: 20px; border-left: 3px solid #6B4C3B;">${req.body.message}</p>
                    </div>
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #1A1F1B; text-align: center;">
                        <p style="color: #4A6E4E; font-size: 12px;">Zyionne Aderinola — Portfolio</p>
                    </div>
                </div>
            `
        });

        res.status(201).json({ message: 'Message received!' });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET all contact submissions
app.get('/api/contact', async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});