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
    getStudent,
    getStudents,
    getStudentBookmarks,
    markRecipeAsBookmark,
    removeRecipeAsBookmark,
    getStudentLikes,
    addLikeToRecipe,
    removeLikeFromRecipe,
    addRecipeRating,
    getRecipeRatings,
    removeRecipeRating,
    getChefReviewsByStudent,
    addChefReview,
    deleteChefReview,
    editRecipeRating,
    editChefReview,
    verifyStudentEmail,
    updateStudentPackage,
    updateStudentData,
    getStudentLike,
    getStudentBookmark,
} = require('../controllers/studentController');
const checkStudent = require('../middlewares/checkStudent');

const router = express.Router();

router.get('/', checkAuth, checkAdmin, getStudents);
router.get('/student/verify-email', verifyStudentEmail);
router.get(['/student/:id', '/:id'], checkAuth, getStudent);
router.patch(
    '/student/update-data',
    checkAuth,
    checkStudent,
    updateStudentData
);
router.patch(
    '/student/update-package',
    checkAuth,
    checkStudent,
    updateStudentPackage
);
router.post(
    '/student/upload-profile-picture',
    checkAuth,
    checkStudent,
    upload.single('profile-image'),
    uploadImage,
    updateStudentData
);

// ! Bookmarks related routes
router.get(
    ['/student/:id/bookmark', '/:id/bookmark'],
    checkAuth,
    checkStudent,
    getStudentBookmark
);
router.get(
    ['/student/:id/bookmarks', '/:id/bookmarks'],
    checkAuth,
    checkStudent,
    getStudentBookmarks
);
router.post(
    ['/student/:id/add-bookmark', '/:id/add-bookmark'],
    checkAuth,
    checkStudent,
    markRecipeAsBookmark
);
router.delete(
    ['/student/:id/remove-bookmark', '/:id/remove-bookmark'],
    checkAuth,
    checkStudent,
    removeRecipeAsBookmark
);

// ! Likes related routes
router.get(
    ['/student/:id/like', '/:id/like'],
    checkAuth,
    checkStudent,
    getStudentLike
);
router.get(
    ['/student/:id/likes', '/:id/likes'],
    checkAuth,
    checkStudent,
    getStudentLikes
);
router.post(
    ['/student/:id/add-like', '/:id/add-like'],
    checkAuth,
    checkStudent,
    addLikeToRecipe
);
router.delete(
    ['/student/:id/remove-like', '/:id/remove-like'],
    checkAuth,
    checkStudent,
    removeLikeFromRecipe
);

// ! Recipe ratings related routes
router.get(
    ['/student/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    checkStudent,
    getRecipeRatings
);
router.post(
    ['/student/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    checkStudent,
    addRecipeRating
);
router.patch(
    ['/student/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    checkStudent,
    editRecipeRating
);
router.delete(
    ['/student/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    checkStudent,
    removeRecipeRating
);

// ! Chef reviews related routes
router.get(
    ['/student/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    checkStudent,
    getChefReviewsByStudent
);
router.post(
    ['/student/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    checkStudent,
    addChefReview
);
router.patch(
    ['/student/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    checkStudent,
    editChefReview
);
router.delete(
    ['/student/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    checkStudent,
    deleteChefReview
);

module.exports = router;
