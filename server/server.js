require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');
const Project = require('./Project');
const Contact = require('./Contact');
const Skill = require('./Skill');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 3000;

const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    },
    transports: ['polling', 'websocket']
});
io.on('connection', (socket) => {
    console.log('Admin connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Admin disconnected:', socket.id);
    });
});

app.use(express.json());
app.use(cors({
    origin: '*'
}));

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Error connecting to MongoDB:', err));

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'portfolio-documents',
        allowed_formats: ['pdf'],
        resource_type: 'raw'
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files are allowed'), false);
    }
};

const upload = multer({ storage, fileFilter });

app.get('/', (req, res) => {
    res.send('Hello, Portfolio Server is Running!');
});

app.get('/ping', (req, res) => {
    res.json({ status: 'awake' })
})

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

// DELETE a project
app.delete('/api/projects/:id', async (req, res) => {
    try {
        await Project.findByIdAndDelete(req.params.id);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT - update a project
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

// GET all skills
app.get('/api/skills', async (req, res) => {
    try {
        const skills = await Skill.find().sort({ order: 1 });
        res.json(skills);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST a new skill category
app.post('/api/skills', async (req, res) => {
    try {
        const skill = new Skill(req.body);
        await skill.save();
        res.status(201).json(skill);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// DELETE a skill category
app.delete('/api/skills/:id', async (req, res) => {
    try {
        await Skill.findByIdAndDelete(req.params.id);
        res.json({ message: 'Skill deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin login
app.post('/api/admin/login', async (req, res) => {
    try {
        const { password } = req.body;

        const isMatch = await bcrypt.compare(
            password,
            await bcrypt.hash(process.env.ADMIN_PASSWORD, 10)
        );

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        const token = jwt.sign(
            { admin: true },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Middleware to protect admin routes
const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.admin = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// GET all messages (protected)
app.get('/api/admin/messages', verifyToken, async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH mark a message as read (protected)
app.patch('/api/admin/messages/:id/read', verifyToken, async (req, res) => {
    try {
        await Contact.findByIdAndUpdate(req.params.id, { read: true });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE a message (protected)
app.delete('/api/admin/messages/:id', verifyToken, async (req, res) => {
    try {
        await Contact.findByIdAndDelete(req.params.id);
        res.json({ message: 'Message deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST contact form submission
app.post('/api/contact', async (req, res) => {
    try {
        const contact = new Contact(req.body);
        await contact.save();

        // Emit real-time notification to admin dashboard
        io.emit('newMessage', {
            name: req.body.name,
            email: req.body.email,
            createdAt: new Date()
        });

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

app.post('/api/documents', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        res.status(201).json({
            message: 'File uploaded successfully',
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            url: req.file.path
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

app.get('/api/documents', async (req, res) => {
    try {
        const result = await cloudinary.api.resources({
            type: 'upload',
            prefix: 'portfolio-documents',
            resource_type: 'raw'
        });
        const files = result.resources.map(file => ({
            filename: file.public_id,
            originalname: file.public_id.replace('portfolio-documents/', ''),
            path: file.secure_url,
            url: file.secure_url
        }));
        res.json(files);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/documents/:filename', verifyToken, async (req, res) => {
    try {
        const publicId = decodeURIComponent(req.params.filename);
        await cloudinary.uploader.destroy(publicId, {
            resource_type: 'raw'
        });
        res.json({ message: 'File deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});