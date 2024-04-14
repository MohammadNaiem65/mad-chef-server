const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const {
	getRecipe,
	postRecipe,
	searchRecipes,
} = require('../controllers/recipeController');

// Create router instance
const router = express.Router();

router.get(['/', '/search'], searchRecipes);
router.get(['/recipe/:recipeId', '/:recipeId'], getRecipe);
router.post('/recipe', checkAuth, postRecipe);

module.exports = router;
