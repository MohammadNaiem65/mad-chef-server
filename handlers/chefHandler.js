const express = require('express');

// internal imports
const { getChef, getChefs } = require('../controllers/chefController');
const checkAuth = require('../middlewares/checkAuth');

// create router instance
const router = express.Router();

router.get('/', checkAuth, getChefs);
router.get(['/chef/:chefId', '/:chefId'], checkAuth, getChef);

module.exports = router;
