// external imports
const express = require('express');
const mongoose = require('mongoose');
const { initializeApp, cert } = require('firebase-admin/app');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// internal imports
// ? TODO: download firebase service account configuration and name firebase.config.json
const serviceAccountConfig = require('./firebase.config.json');

// request handlers
const authHandler = require('./handlers/authHandler');
const userHandler = require('./handlers/userHandler');
const chefHandler = require('./handlers/chefHandler');
const adminHandler = require('./handlers/adminHandler');
const recipeHandler = require('./handlers/recipeHandler');
const consultHandler = require('./handlers/consultHandler');
const paymentHandler = require('./handlers/paymentHandler');
const roleHandler = require('./handlers/roleHandler');

// create app instance
const app = express();

const port = process.env.PORT || 3999;

// request parsers
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(
    cors({
        origin: ['http://localhost:5173', 'https://mad-chef.web.app'],
        credentials: true,
    })
);
app.use(cookieParser(process.env.COOKIE_SECRET));

// connect to MongoDB
mongoose
    .connect(process.env.MONGODB_CONNECTION_STRING)
    .then(() => console.log('Connected to database'))
    .catch((err) => console.log(err));

// connect to Firebase
initializeApp({
    credential: cert(serviceAccountConfig),
});

// configure cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// request endpoints
app.use('/auth', authHandler);
app.use('/users', userHandler);
app.use('/chefs', chefHandler);
app.use('/admins', adminHandler);
app.use('/recipes', recipeHandler);
app.use('/consults', consultHandler);
app.use('/payments', paymentHandler);
app.use('/roles', roleHandler);

// listen app
app.listen(port, () => {
    console.log(`App listening on port ${port}`);
});
