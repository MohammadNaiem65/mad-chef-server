const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const {
	getRecipe,
	postRecipe,
	searchRecipes,
	getRecipeRatings,
} = require('../controllers/recipeController');

// Create router instance
const router = express.Router();

router.get(['/', '/search'], searchRecipes);
router.get('/ratings', getRecipeRatings);
router.get(['/recipe/:recipeId', '/:recipeId'], getRecipe);
router.post('/recipe', checkAuth, postRecipe);

module.exports = router;
