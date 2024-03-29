const express = require('express');

// internal imports
const { getChef } = require('../controllers/chefController');

// create router instance
const router = express.Router();

router.get(['/chef/:chefId', '/:chefId'], getChef);

module.exports = router;
