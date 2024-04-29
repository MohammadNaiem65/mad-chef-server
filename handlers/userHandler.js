// external imports
const express = require('express');

// internal imports
const checkAuth = require('../middlewares/checkAuth');
const {
	getUser,
	applyToBeChef,
	handleUserRolePromotion,
	getUserBookmarks,
	addUserBookmark,
	removeUserBookmark,
	getUserLikes,
	addUserLike,
	removeUserLike,
	addRecipeRating,
	getRecipeRatings,
	removeRecipeRating,
} = require('../controllers/userController');

const router = express.Router();

router.get(['/user/:id', '/:id'], checkAuth, getUser);
router.get(['/user/:id/bookmarks', '/:id/bookmarks'], checkAuth, getUserBookmarks);
router.post(['/user/:id/bookmarks', '/:id/bookmarks'], checkAuth, addUserBookmark);
router.delete(['/user/:id/bookmarks', '/:id/bookmarks'], checkAuth, removeUserBookmark);
router.get(['/user/:id/likes', '/:id/likes'], checkAuth, getUserLikes);
router.post(['/user/:id/likes', '/:id/likes'], checkAuth, addUserLike);
router.delete(['/user/:id/likes', '/:id/likes'], checkAuth, removeUserLike);
router.get(['/user/:id/rating/recipe', '/:id/rating/recipe'], checkAuth, getRecipeRatings);
router.post(['/user/:id/rating/recipe', '/:id/rating/recipe'], checkAuth, addRecipeRating);
router.delete(['/user/:id/rating/recipe', '/:id/rating/recipe'], checkAuth, removeRecipeRating);
router.post('/user/:id/apply-to-be-chef', checkAuth, applyToBeChef);
router.post('/user/:id/requests/:requestId/action', checkAuth, handleUserRolePromotion);

module.exports = router;
