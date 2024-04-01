const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const { getRecipe, postRecipe } = require('../controllers/recipeController');

// Create router instance
const router = express.Router();

router.post('/recipe', checkAuth, postRecipe);
router.get(['/recipe/:recipeId', '/:recipeId'], getRecipe);

module.exports = router;
