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
router.patch('/student/update-data', checkAuth, updateStudentData);
router.patch('/student/update-package', checkAuth, updateStudentPackage);
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
    getStudentBookmark
);
router.get(
    ['/student/:id/bookmarks', '/:id/bookmarks'],
    checkAuth,
    getStudentBookmarks
);
router.post(
    ['/student/:id/add-bookmark', '/:id/add-bookmark'],
    checkAuth,
    markRecipeAsBookmark
);
router.delete(
    ['/student/:id/remove-bookmark', '/:id/remove-bookmark'],
    checkAuth,
    removeRecipeAsBookmark
);

// ! Likes related routes
router.get(['/student/:id/like', '/:id/like'], checkAuth, getStudentLike);
router.get(['/student/:id/likes', '/:id/likes'], checkAuth, getStudentLikes);
router.post(
    ['/student/:id/add-like', '/:id/add-like'],
    checkAuth,
    addLikeToRecipe
);
router.delete(
    ['/student/:id/remove-like', '/:id/remove-like'],
    checkAuth,
    removeLikeFromRecipe
);

// ! Recipe ratings related routes
router.get(
    ['/student/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    getRecipeRatings
);
router.post(
    ['/student/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    addRecipeRating
);
router.patch(
    ['/student/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    editRecipeRating
);
router.delete(
    ['/student/:id/rating/recipe', '/:id/rating/recipe'],
    checkAuth,
    removeRecipeRating
);

// ! Chef reviews related routes
router.get(
    ['/student/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    getChefReviewsByStudent
);
router.post(
    ['/student/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    addChefReview
);
router.patch(
    ['/student/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    editChefReview
);
router.delete(
    ['/student/:id/review/chef', '/:id/review/chef'],
    checkAuth,
    deleteChefReview
);

module.exports = router;
