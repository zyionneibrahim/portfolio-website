const mongoose = require('mongoose');

// Define the Project schema with fields for title, description, image URL, and project URL
const projectSchema = new mongoose.Schema({
       title: { type: String, required: true },
    description: { type: String, required: true },
    techStack: { type: [String], required: true },
    liveLink: { type: String },
    githubLink: { type: String },
    createdAt: { type: Date, default: Date.now } // Automatically set the createdAt field to the current date and time when a new project is created            
});

// Create a Mongoose model for the Project schema, which will be used to interact with the projects collection in MongoDB
const Project = mongoose.model('Project', projectSchema);

module.exports = Project; // Export the Project model so it can be used in other parts of the application, such as in route handlers for creating, reading, updating, and deleting projects.