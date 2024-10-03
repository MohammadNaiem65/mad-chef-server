const mongoose = require('mongoose');

// create user schema
const studentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            default: 'student',
        },
        pkg: {
            type: String,
            enum: ['basic', 'pro'],
            default: 'basic',
        },
        img: String,
    },
    {
        timestamps: true,
    }
);

// Created Student document model
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
