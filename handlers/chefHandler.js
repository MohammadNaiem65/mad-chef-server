const express = require('express');

// internal imports
const { getChef, getChefs } = require('../controllers/chefController');
const checkAuth = require('../middlewares/checkAuth');

// create router instance
const router = express.Router();

router.get('/', getChefs);
router.get(['/chef/:chefId', '/:chefId'], getChef);

module.exports = router;
