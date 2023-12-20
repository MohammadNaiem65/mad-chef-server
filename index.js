// external dependencies
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// create instance
const app = express();

const port = process.env.PORT || 3999;

// request parsers
app.use(express.json());
app.use(cors());
app.use(cookieParser(process.env.COOKIE_SECRET));

// request handlers
app.get('/', (req, res) => {
	console.log('object');
});

// listen app
app.listen(port, () => {
	console.log(`App listening on port ${port}`);
});
