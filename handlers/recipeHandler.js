const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const {
	getRecipe,
	postRecipe,
	getRecipes,
	searchRecipes,
} = require('../controllers/recipeController');

// Create router instance
const router = express.Router();

router.get('/', getRecipes);
router.get('/search', searchRecipes);
router.get(['/recipe/:recipeId', '/:recipeId'], getRecipe);
router.post('/recipe', checkAuth, postRecipe);

module.exports = router;
