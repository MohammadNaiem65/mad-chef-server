const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const {
    getRecipe,
    postRecipe,
    searchRecipes,
    getRecipeRatings,
    updateRecipeStatus,
    deleteRecipe,
} = require('../controllers/recipeController');
const checkAdmin = require('../middlewares/checkAdmin');
const checkRoles = require('../middlewares/checkRoles');

// Create router instance
const router = express.Router();

router.get(['/', '/search'], searchRecipes);
router.get('/ratings', getRecipeRatings);
router.get(['/recipe/:recipeId', '/:recipeId'], getRecipe);
router.post('/recipe', checkAuth, postRecipe);
router.patch(
    '/recipe/:recipeId/update-status',
    [checkAuth, checkRoles('chef', 'admin')],
    updateRecipeStatus
);
router.delete(
    '/recipe/:recipeId',
    [checkAuth, checkRoles('chef', 'admin')],
    deleteRecipe
);

module.exports = router;
