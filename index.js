// external imports
const express = require('express');
const mongoose = require('mongoose');
const { initializeApp, cert } = require('firebase-admin/app');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// internal imports
// ? TODO: download firebase service account configuration and name firebase.config.json
const serviceAccountConfig = require('./firebase.config.json');
const authHandler = require('./handlers/authHandler');

// create app instance
const app = express();

const port = process.env.PORT || 3999;

// request parsers
app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173' }));
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

// request handlers
app.use('/auth', authHandler);

// listen app
app.listen(port, () => {
	console.log(`App listening on port ${port}`);
});
