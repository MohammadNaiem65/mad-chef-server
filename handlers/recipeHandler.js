const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const {
	getRecipe,
	postRecipe,
	getRecipes,
} = require('../controllers/recipeController');

// Create router instance
const router = express.Router();

router.get(['/recipe/:recipeId', '/:recipeId'], getRecipe);
router.post('/recipe', checkAuth, postRecipe);
router.get('/', getRecipes);

module.exports = router;
