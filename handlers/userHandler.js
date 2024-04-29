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
} = require('../controllers/userController');

const router = express.Router();

router.get(['/user/:id', '/:id'], checkAuth, getUser);
router.get(['/user/:id/bookmarks', '/:id/bookmarks'], getUserBookmarks);
router.post(['/user/:id/bookmarks', '/:id/bookmarks'], addUserBookmark);
router.delete(['/user/:id/bookmarks', '/:id/bookmarks'], removeUserBookmark);
router.get(['/user/:id/likes', '/:id/likes'], getUserLikes);
router.post(['/user/:id/likes', '/:id/likes'], addUserLike);
router.delete(['/user/:id/likes', '/:id/likes'], removeUserLike);
router.post('/user/:id/apply-to-be-chef', checkAuth, applyToBeChef);
router.post(
	'/user/:id/requests/:requestId/action',
	checkAuth,
	handleUserRolePromotion
);

module.exports = router;
