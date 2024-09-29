// external imports
const express = require('express');
const multer = require('multer');

// Multer setup
const upload = multer({ dest: '/tmp/uploads/' });

// internal imports
const checkAuth = require('../middlewares/checkAuth');
const checkAdmin = require('../middlewares/checkAdmin');
const uploadImage = require('../middlewares/uploadImage');
const {
    getUser,
    getUsers,
    handleUserRolePromotion,
    getUserBookmarks,
    markRecipeAsBookmark,
    removeRecipeAsBookmark,
    getUserLikes,
    addLikeToRecipe,
    removeLikeFromRecipe,
    addRecipeRating,
    getRecipeRatings,
    removeRecipeRating,
    getChefReviews,
    addChefReview,
    removeChefReview,
    editRecipeRating,
    editChefReview,
    verifyUserEmail,
    updateUserPackage,
    updateUserData,
    getUserLike,
    getUserBookmark,
} = require('../controllers/userController');

const router = express.Router();

router.get('/', checkAuth, checkAdmin, getUsers);
router.get('/user/verify-email', verifyUserEmail);
router.get(['/user/:id', '/:id'], checkAuth, getUser);
router.patch('/user/update-data', checkAuth, updateUserData);
router.patch('/user/update-package', checkAuth, updateUserPackage);
router.post(
    '/user/upload-profile-picture',
    checkAuth,
    upload.single('profile-image'),
    uploadImage,
    updateUserData
);

// ! Bookmarks related routes
router.get(['/user/:id/bookmark', '/:id/bookmark'], checkAuth, getUserBookmark);
router.get(
    ['/user/:id/bookmarks', '/:id/bookmarks'],
    checkAuth,
    getUserBookmarks
);
router.post(
    ['/user/:id/add-bookmark', '/:id/add-bookmark'],
    checkAuth,
    markRecipeAsBookmark
);
router.delete(
    ['/user/:id/remove-bookmark', '/:id/remove-bookmark'],
    checkAuth,
    removeRecipeAsBookmark
);

// ! Likes related routes
router.get(['/user/:id/like', '/:id/like'], checkAuth, getUserLike);
router.get(['/user/:id/likes', '/:id/likes'], checkAuth, getUserLikes);
router.post(
    ['/user/:id/add-like', '/:id/add-like'],
    checkAuth,
    addLikeToRecipe
);
router.delete(
    ['/user/:id/remove-like', '/:id/remove-like'],
    checkAuth,
    removeLikeFromRecipe
);

// ! Recipe ratings related routes
router.get(
    ['/user/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    getRecipeRatings
);
router.post(
    ['/user/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    addRecipeRating
);
router.patch(
    ['/user/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    editRecipeRating
);
router.delete(
    ['/user/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    removeRecipeRating
);

// ! Chef reviews related routes
router.get(
    ['/user/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    getChefReviews
);
router.post(
    ['/user/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    addChefReview
);
router.patch(
    ['/user/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    editChefReview
);
router.delete(
    ['/user/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    removeChefReview
);

// ! Role promotion related routes
router.post(
    '/user/:id/requests/:requestId/action',
    checkAuth,
    handleUserRolePromotion
);

module.exports = router;
