const express = require('express');

// internal imports
const { getChef, getChefs } = require('../controllers/chefController');

// create router instance
const router = express.Router();

router.get('/', getChefs);
router.get(['/chef/:chefId', '/:chefId'], getChef);

module.exports = router;
