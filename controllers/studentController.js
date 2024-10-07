const { default: mongoose } = require('mongoose');
const admin = require('firebase-admin');
const { ObjectId } = mongoose.Types;

const validateMongoDBId = require('../utility/validateMongoDBId');
const createProjectionObject = require('../utility/createProjectionObject');
const generateJwtToken = require('../utility/generateJwtToken');
const createSortObject = require('../utility/createSortObject');
const getCurrPage = require('../utility/getCurrPage');

const Student = require('../models/Student');
const Bookmark = require('../models/Bookmark');
const Like = require('../models/Like');
const Rating = require('../models/Rating');
const ChefReview = require('../models/ChefReview');
const PaymentReceipt = require('../models/PaymentReceipt');
const RefreshToken = require('../models/RefreshToken');
const Recipe = require('../models/Recipe');

// Custom error creation function
function createError(message, statusCode) {
    return { message, statusCode };
}

/**
 * Helper function to handle database operations with transaction
 * @param {function} dbOperation - The database operation to perform
 * @param {Object} res - Express response object
 * @returns {Promise<*>} The result of the database operation
 */
async function withTransaction(dbOperation) {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const result = await dbOperation(session);
        await session.commitTransaction();
        return result;
    } catch (error) {
        await session.abortTransaction();
        throw error; // Re-throw the error to be handled in the middleware
    } finally {
        session.endSession();
    }
}

// Middleware functions
async function getStudent(req, res) {
    const { id } = req.params;
    const { include, exclude } = req.query;

    // Validate MongoDB ID
    if (!validateMongoDBId(id, res)) {
        return;
    }

    // Create projection object based on include/exclude parameters
    const projection = createProjectionObject(include, exclude);

    try {
        const user = await Student.findById(id, projection);

        if (!user) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.json({ message: 'Successful', data: user });
    } catch (error) {
        console.error('Error fetching getStudent:', error);
        res.status(500).json({
            message: 'An error occurred',
            error: error?.message,
        });
    }
}

async function getStudents(req, res) {
    const {
        p,
        page = 1,
        l,
        limit = process.env.USERS_PER_PAGE,
        sort = 'name',
        order = 'asc',
        include = '',
        exclude = '',
    } = req.query;

    // Ensure page and limit are positive integers
    const _page = Math.max(0, parseInt(p || page) - 1);
    const _limit = Math.max(1, parseInt(l || limit));

    // Create sort object based on query
    const sortObj = createSortObject(sort, order);

    // Create projection object based on include/exclude parameters
    const projection = createProjectionObject(include, exclude);

    const pipeline = [
        { $sort: sortObj },
        { $skip: _page * _limit },
        { $limit: _limit },
    ];

    // Only add $project stage if projection is not empty
    if (Object.keys(projection).length > 0) {
        pipeline.push({ $project: projection });
    }

    try {
        const [users, totalUsersResult] = await Promise.all([
            Student.aggregate(pipeline),
            Student.aggregate([{ $count: 'total' }]),
        ]);

        const totalUsers = totalUsersResult[0]?.total || 0;
        const currPage = getCurrPage(_page + 1, _limit, totalUsers);

        res.json({
            data: users,
            meta: {
                page: currPage,
                totalCount: totalUsers,
            },
        });
    } catch (error) {
        console.error('Error in getStudents:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error?.message,
        });
    }
}

async function verifyStudentEmail(req, res) {
    const { uid: firebaseId } = req.query;

    try {
        // Verify the Firebase user and get their details
        const { uid, customClaims } = await admin.auth().getUser(firebaseId);

        // If no uid is returned, the Firebase user doesn't exist
        if (!uid) {
            console.error(
                'Error in verifyStudentEmail: Firebase user not found'
            );
            return res.status(404).send('User not found');
        }

        // Find the corresponding user in our database
        const user = await Student.findById(customClaims._id);

        // If no user is found in our database, return an error
        if (!user) {
            console.error(
                'Error in verifyStudentEmail: Database user not found'
            );
            return res.status(404).send('User not found in database');
        }

        // Update the user's emailVerified status in our database
        user.emailVerified = true;
        await user.save();

        // TODO: UPDATE the URL before hosting it
        // Redirect to the user's profile page
        res.redirect('http://localhost:5173/profile/student/my-profile');
    } catch (error) {
        console.error('Error in verifyStudentEmail:', error);
        res.status(500).send('Internal server error');
    }
}

async function updateStudentData(req, res) {
    const { userId } = req.user;
    const updateData = req.body;

    try {
        // Check if the request body is empty
        if (!updateData || Object.keys(updateData).length === 0) {
            throw createError('No update data provided.', 400);
        }

        // Find the student document
        const student = await Student.findById(userId);

        if (!student) {
            throw createError('Student not found.', 404);
        }

        // Apply the updates to the student document
        Object.assign(student, updateData);

        // Run validation and save the document
        const updatedStudent = await student.save();

        res.json({
            data: updatedStudent,
            message: 'Successfully updated student data',
        });
    } catch (error) {
        console.error('Error in updateStudentData:', error);

        if (error.statusCode) {
            return res.status(error.statusCode || 500).json({
                message:
                    error?.message ||
                    'An error occurred while updating student data',
            });
        }
    }
}

async function updateStudentPackage(req, res) {
    const { userId, firebaseId, userEmail, emailVerified, role } = req.user;
    const session = await mongoose.startSession();

    try {
        await session.withTransaction(async () => {
            // Check if the user paid for the package
            const paymentExists = await PaymentReceipt.exists({
                studentId: userId,
                pkg: 'student/pro-pkg',
                status: 'succeeded',
            }).session(session);

            if (!paymentExists) {
                throw createError('No payment receipt found', 400);
            }

            // Update user's package in the DB
            const result = await Student.updateOne(
                { _id: userId },
                { pkg: 'pro' },
                { session }
            );

            if (result.modifiedCount === 0) {
                throw createError('Student package already up to date', 200);
            }

            // Update the user's package in Firebase
            await admin.auth().setCustomUserClaims(firebaseId, {
                _id: userId,
                role,
                pkg: 'pro',
            });

            // Prepare user data for token generation
            const userData = {
                userEmail,
                userId,
                firebaseId,
                emailVerified,
                role,
                pkg: 'pro',
            };

            // Generate access and refresh tokens
            const [accessToken, refreshToken] = await Promise.all([
                generateJwtToken(userData, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: '1h',
                }),
                generateJwtToken(userData, process.env.REFRESH_TOKEN_SECRET, {
                    expiresIn: '30 days',
                }),
            ]);

            // Update refresh token in the database
            await RefreshToken.findOneAndUpdate(
                { userId: userData.userId },
                { token: refreshToken },
                { upsert: true, new: true, session }
            );

            // Send response to user
            res.cookie(process.env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: 'None',
            }).json({
                message: 'Package successfully updated to pro',
                data: { user: userData, accessToken },
            });
        });
    } catch (error) {
        console.error('Error in updateStudentPackage:', error);
        res.status(
            error?.message === 'No payment receipt found' ? 400 : 500
        ).json({
            message:
                error?.message === 'No payment receipt found'
                    ? error?.message
                    : 'Internal server error',
        });
    } finally {
        session.endSession();
    }
}

// ! Bookmarks related routes
async function getStudentBookmark(req, res) {
    const { id } = req.params;
    const { recipeId } = req.query;

    // validate user id and recipe id
    if (!validateMongoDBId(id, res) || !validateMongoDBId(recipeId, res)) {
        return;
    }

    try {
        const bookmarkedDoc = await Bookmark.findOne({
            studentId: new ObjectId(id),
            recipeId: new ObjectId(recipeId),
        });

        if (!bookmarkedDoc) {
            return res.json({
                message: "You didn't bookmark the recipe.",
                data: {},
            });
        }

        res.json({ message: 'Successful', data: bookmarkedDoc });
    } catch (error) {
        console.error('Error in getStudentBookmark:', error);
        res.status(500).json({
            message: error?.message || 'An error occurred',
        });
    }
}

async function getStudentBookmarks(req, res) {
    const { id } = req.params;

    if (!validateMongoDBId(id, res)) {
        return;
    }

    try {
        // Find bookmarks for the user
        const bookmarks = await Bookmark.find({ studentId: id });

        res.json({
            message: 'Successful',
            data: bookmarks,
        });
    } catch (error) {
        console.error('Error in getStudentBookmarks:', error);
        res.status(500).json({
            message: 'An error occurred while fetching bookmarks',
        });
    }
}

async function markRecipeAsBookmark(req, res) {
    const { id } = req.params;
    const { recipeId } = req.query;
    const { userId } = req.user;

    try {
        if (id !== userId) {
            throw createError('Unauthorized access', 403);
        }

        // validate user id and recipe id
        if (!validateMongoDBId(id, res) || !validateMongoDBId(recipeId, res)) {
            return;
        }

        const bookmarkExists = await Bookmark.exists({
            studentId: new ObjectId(id),
            recipeId: new ObjectId(recipeId),
        });

        if (bookmarkExists) {
            throw createError('You already bookmarked it.', 400);
        }

        const newBookmark = await Bookmark.create({
            studentId: new ObjectId(id),
            recipeId: new ObjectId(recipeId),
        });

        res.json({ message: 'Successful', data: newBookmark });
    } catch (error) {
        console.error('Error in markRecipeAsBookmark:', error);
        res.status(error.statusCode || 500).json({
            message: error?.message || 'An unexpected error occurred',
        });
    }
}

async function removeRecipeAsBookmark(req, res) {
    const { id } = req.params;
    const { recipeId } = req.query;
    const { userId } = req.user;

    try {
        if (id !== userId) {
            throw createError('Unauthorized access', 403);
        }

        // validate user id and recipe id
        if (!validateMongoDBId(id, res) || !validateMongoDBId(recipeId, res)) {
            return;
        }

        const bookmarkExists = await Bookmark.exists({
            studentId: new ObjectId(id),
            recipeId: new ObjectId(recipeId),
        });

        if (!bookmarkExists) {
            throw createError("You didn't bookmarked it.", 400);
        }

        const result = await Bookmark.deleteOne({
            studentId: new ObjectId(id),
            recipeId: new ObjectId(recipeId),
        });

        res.json({ message: 'Successfully removed bookmark', data: result });
    } catch (error) {
        console.error('Error in markRecipeAsBookmark:', error);
        res.status(error.statusCode || 500).json({
            message: error?.message || 'An unexpected error occurred',
        });
    }
}

// ! Likes related routes
async function getStudentLike(req, res) {
    const { id } = req.params;
    const { recipeId } = req.query;
    const { userId } = req.user;

    // Ensure authorization
    if (id !== userId) {
        throw createError('Unauthorized access', 403);
    }

    // Validate user id and recipe id
    if (!validateMongoDBId(id, res) || !validateMongoDBId(recipeId, res)) {
        return;
    }

    try {
        const likedDoc = await Like.findOne({
            studentId: new ObjectId(id),
            recipeId: new ObjectId(recipeId),
        });

        if (!likedDoc) {
            return res.json({
                message: "You didn't like the recipe.",
                data: {},
            });
        }

        res.json({ message: 'Successful', data: likedDoc });
    } catch (error) {
        console.error('Error in getStudentLike:', error);
        res.status(error?.status || 500).json({
            message: error?.message || 'An error occurred',
        });
    }
}

async function getStudentLikes(req, res) {
    const { id } = req.params;
    const { userId } = req.user;

    // Ensure authorization
    if (id !== userId) {
        throw createError('Unauthorized access', 403);
    }

    // validate user id
    if (!validateMongoDBId(id, res)) {
        return;
    }

    try {
        const likes = await Like.find({
            studentId: new ObjectId(id),
        });

        res.json({ message: 'Successful', data: likes });
    } catch (error) {
        res.status(error?.status || 500).json({
            message: error?.message || 'An error occurred',
        });
    }
}

async function addLikeToRecipe(req, res) {
    const { id } = req.params;
    const { recipeId } = req.query;
    const { userId } = req.user;

    try {
        if (id !== userId) {
            throw createError('Unauthorized access', 403);
        }

        // validate user id and recipe id
        if (!validateMongoDBId(id, res) || !validateMongoDBId(recipeId, res)) {
            return;
        }

        const result = await withTransaction(async (session) => {
            const likeExists = await Like.exists({
                studentId: new ObjectId(id),
                recipeId: new ObjectId(recipeId),
            });

            if (likeExists) {
                throw createError('Like already exists', 400);
            }

            const newLike = await Like.create(
                [
                    {
                        studentId: new ObjectId(id),
                        recipeId: new ObjectId(recipeId),
                    },
                ],
                { session }
            );

            const updatedRecipe = await Recipe.findByIdAndUpdate(
                recipeId,
                { $inc: { like: 1 } },
                { new: true, session }
            );

            if (!updatedRecipe) {
                throw createError('Recipe not found', 404);
            }

            return { like: newLike[0], recipe: updatedRecipe };
        });

        res.json({
            message: 'Successfully added like and updated recipe',
            data: result.like,
        });
    } catch (error) {
        console.error('Error in addLikeToRecipe:', error);
        res.status(error.statusCode || 500).json({
            message: error?.message || 'An unexpected error occurred',
        });
    }
}

async function removeLikeFromRecipe(req, res) {
    const { id } = req.params;
    const { recipeId } = req.query;
    const { userId } = req.user;

    if (id !== userId) {
        throw createError('Unauthorized access', 403);
    }

    if (!validateMongoDBId(id, res) || !validateMongoDBId(recipeId, res)) {
        return;
    }

    try {
        const result = await withTransaction(async (session) => {
            const removedLike = await Like.findOneAndDelete(
                {
                    studentId: new ObjectId(id),
                    recipeId: new ObjectId(recipeId),
                },
                { session }
            );

            if (!removedLike) {
                throw createError('This recipe is not liked', 400);
            }

            const updatedRecipe = await Recipe.findByIdAndUpdate(
                recipeId,
                { $inc: { like: -1 } },
                { new: true, session }
            );

            if (!updatedRecipe) {
                throw createError('Recipe not found', 400);
            }

            return { like: removedLike, recipe: updatedRecipe };
        }, res);

        if (result) {
            res.json({
                message: 'Successfully removed like.',
                data: {},
            });
        }
    } catch (error) {
        console.error('Error in removeLikeFromRecipe:', error);
        res.status(error.statusCode || 500).json({
            message: error?.message || 'An unexpected error occurred',
        });
    }
}

// ! Recipe ratings related routes
async function getRecipeRatings(req, res) {
    const { id } = req.params;

    // validate user id
    if (!validateMongoDBId(id, res)) {
        return;
    }

    try {
        const ratings = await Rating.find({
            studentId: new ObjectId(id),
        });

        res.json({ message: 'Successful', data: ratings });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

async function addRecipeRating(req, res) {
    const { userId } = req.user;
    const { recipeId, rating, message } = req.body;

    // validate user id and recipe id
    if (!validateMongoDBId(userId, res)) {
        return;
    } else if (!validateMongoDBId(recipeId, res)) {
        return;
    }
    try {
        const result = await Rating.create({
            recipeId: new ObjectId(recipeId),
            studentId: new ObjectId(userId),
            rating,
            message,
        });

        res.json({ message: 'Successful', data: result });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

async function editRecipeRating(req, res) {
    const { docId } = req.query;
    const { rating, message } = req.body;

    // validate docId of rating document
    if (!validateMongoDBId(docId, res)) {
        return;
    }

    try {
        // Check if the document exists and fetch it
        const existingRating = await Rating.findById(docId);
        if (!existingRating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        // Update only the fields that are provided
        if (rating !== undefined) existingRating.rating = rating;
        if (message !== undefined) existingRating.message = message;

        // Save the updated document
        const updatedRating = await existingRating.save();

        res.json({
            message: 'Rating updated successfully',
            data: updatedRating,
        });
    } catch (error) {
        console.error('Error updating rating:', error);
        if (error.name === 'ValidationError') {
            return res
                .status(400)
                .json({ message: 'Validation error', errors: error.errors });
        }
        res.status(500).json({
            message: 'An error occurred while updating the rating',
        });
    }
}

async function removeRecipeRating(req, res) {
    const { docId } = req.query;

    // validate recipe id
    if (!validateMongoDBId(docId, res)) {
        return;
    }

    try {
        // Check if the document exists and fetch it
        const existingRating = await Rating.findById(docId);
        if (!existingRating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        const result = await Rating.deleteOne({
            _id: new ObjectId(docId),
        });

        res.json({ message: 'Successful', data: result });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

// ! Chef reviews related routes
async function getChefReviewsByStudent(req, res) {
    const { id } = req.params;

    // validate user id
    if (!validateMongoDBId(id, res)) {
        return;
    }

    try {
        const reviews = await ChefReview.find({
            studentId: new ObjectId(id),
        });

        res.json({ message: 'Successful', data: reviews });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred' });
    }
}

async function addChefReview(req, res) {
    const { userId } = req.user;
    const { chefId, rating, message } = req.body;

    // validate user id and recipe id
    if (!validateMongoDBId(userId, res)) {
        return;
    } else if (validateMongoDBId(chefId, res)) {
        return;
    }

    try {
        const result = await ChefReview.create({
            chefId: new ObjectId(chefId),
            studentId: new ObjectId(userId),
            rating,
            message,
        });

        res.json({ message: 'Successful', data: result });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

async function editChefReview(req, res) {
    const { docId } = req.query;
    const { rating, message } = req.body;

    // validate docId of review document
    if (!validateMongoDBId(docId, res)) {
        return;
    }

    try {
        const review = await ChefReview.findOne({ _id: new ObjectId(docId) });

        review.rating = rating;
        review.message = message;

        review.save();

        res.json({ message: 'Successful', data: review });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

async function deleteChefReview(req, res) {
    const { docId } = req.query;

    // validate recipe id
    if (!validateMongoDBId(docId, res)) {
        return;
    }

    try {
        const result = await ChefReview.deleteOne({
            _id: new ObjectId(docId),
        });

        res.json({ message: 'Successful', data: result });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

module.exports = {
    getStudent,
    getStudents,
    verifyStudentEmail,
    updateStudentData,
    updateStudentPackage,
    markRecipeAsBookmark,
    getStudentBookmark,
    getStudentBookmarks,
    removeRecipeAsBookmark,
    getStudentLike,
    getStudentLikes,
    addLikeToRecipe,
    removeLikeFromRecipe,
    getRecipeRatings,
    addRecipeRating,
    editRecipeRating,
    removeRecipeRating,
    getChefReviewsByStudent,
    addChefReview,
    editChefReview,
    deleteChefReview,
};
