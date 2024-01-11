// external imports
const express = require('express');

// internal imports
const checkAuth = require('../middlewares/checkAuth');
const { getUser } = require('../controllers/userController');

const router = express.Router();

router.get('/:id', checkAuth, getUser);

module.exports = router;
