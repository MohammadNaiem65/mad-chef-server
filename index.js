// External imports
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cloudinary = require('cloudinary').v2;
const cookieParser = require('cookie-parser');
const { initializeApp, cert } = require('firebase-admin/app');
require('dotenv').config();

// Internal imports
// ? TODO: download firebase service account configuration and name firebase.config.json
const serviceAccountConfig = require('./firebase.config.json');

// Request handlers
const authHandler = require('./handlers/authHandler');
const userHandler = require('./handlers/userHandler');
const chefHandler = require('./handlers/chefHandler');
const adminHandler = require('./handlers/adminHandler');
const recipeHandler = require('./handlers/recipeHandler');
const consultHandler = require('./handlers/consultHandler');
const paymentHandler = require('./handlers/paymentHandler');
const roleHandler = require('./handlers/roleHandler');

// Create app instance
const app = express();

const port = process.env.PORT || 3999;

// Request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
    cors({
        origin: ['http://localhost:5173', 'https://mad-chef.web.app'],
        credentials: true,
    })
);
app.use(cookieParser(process.env.COOKIE_SECRET));

// Connect to MongoDB
mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => console.log('Connected to database'))
    .catch((err) => console.log(err));

// Connect to Firebase
initializeApp({
    credential: cert(serviceAccountConfig),
});

// Configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Mad Chef Server' });
});

// Request endpoints
app.use('/auth', authHandler);
app.use('/users', userHandler);
app.use('/chefs', chefHandler);
app.use('/admins', adminHandler);
app.use('/recipes', recipeHandler);
app.use('/consults', consultHandler);
app.use('/payments', paymentHandler);
app.use('/roles', roleHandler);

// Listen app
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
