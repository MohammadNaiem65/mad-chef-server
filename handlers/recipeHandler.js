const express = require('express');
const multer = require('multer');

const checkAuth = require('../middlewares/checkAuth');
const checkRoles = require('../middlewares/checkRoles');
const checkChef = require('../middlewares/checkChef');
const {
    getRecipe,
    postRecipe,
    searchRecipes,
    getRecipeRatings,
    updateRecipeStatus,
    deleteRecipe,
    editRecipe,
} = require('../controllers/recipeController');
const uploadImage = require('../middlewares/uploadImage');

// Create router instance
const router = express.Router();

// Multer setup
const upload = multer({ dest: '/tmp/uploads/' });

router.get(['/', '/search'], searchRecipes);
router.get('/ratings', getRecipeRatings);
router.get(['/recipe/:recipeId', '/:recipeId'], getRecipe);
router.post(
    '/post-recipe',
    checkAuth,
    checkChef,
    upload.single('recipe-image'),
    uploadImage,
    postRecipe
);
router.patch(
    '/edit-recipe/:recipeId',
    checkAuth,
    checkChef,
    upload.single('recipe-image'),
    uploadImage,
    editRecipe
);
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
