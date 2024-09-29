const admin = require('firebase-admin');
const { default: mongoose } = require('mongoose');
const { ObjectId } = mongoose.Types;

const validateMongoDBId = require('../utility/validateMongoDBId');
const createProjectionObject = require('../utility/createProjectionObject');
const generateJwtToken = require('../utility/generateJwtToken');
const createSortObject = require('../utility/createSortObject');
const getCurrPage = require('../utility/getCurrPage');

const User = require('../models/User');
const Chef = require('../models/Chef');
const Bookmark = require('../models/Bookmark');
const Like = require('../models/Like');
const Rating = require('../models/Rating');
const ChefReview = require('../models/ChefReview');
const RolePromotionApplicant = require('../models/RolePromotionApplicant');
const PaymentReceipt = require('../models/PaymentReceipt');
const RefreshToken = require('../models/RefreshToken');
const Recipe = require('../models/Recipe');

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

// middleware functions
async function getUser(req, res) {
    const { id } = req.params;
    const { include, exclude } = req.query;

    // Validate MongoDB ID
    if (!validateMongoDBId(id)) {
        return;
    }

    // Create projection object based on include/exclude parameters
    const projection = createProjectionObject(include, exclude);

    try {
        const user = await User.findById(id, projection);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'Successful', data: user });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            message: 'An error occurred',
            error: error.message,
        });
    }
}

async function getUsers(req, res) {
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
            User.aggregate(pipeline),
            User.aggregate([{ $count: 'total' }]),
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
        console.error('Error in getUsers:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
}

async function verifyUserEmail(req, res) {
    const { uid: firebaseId } = req.query;

    try {
        // Verify the ID token
        const user = await admin.auth().getUser(firebaseId);
        const { uid, emailVerified, customClaims } = user;

        if (uid) {
            // Find the user from DB
            const user = await User.findById(customClaims._id);

            if (user?._id) {
                // Update the user's emailVerified status
                user.emailVerified = emailVerified;
                await user.save();

                res.redirect('http://localhost:5173/profile/user/my-profile');
            } else {
                res.status(400).send('Email verification failed');
            }
        } else {
            res.status(400).send('Email verification failed');
        }
    } catch (error) {
        console.error('Error verifying ID token:', error);
        res.status(500).send('Internal server error');
    }
}

async function updateUserData(req, res) {
    const { userId } = req.user;
    const data = req.body;

    if (!data) {
        return res.status(400).json({ message: 'No payload found.' });
    }

    try {
        const result = await User.updateOne({ _id: userId }, data);

        res.json({
            data: result,
            message: 'Successfully updated data',
        });
    } catch (error) {
        console.log(error);
        res.json(error);
    }
}

async function updateUserPackage(req, res) {
    const { userId, firebaseId, userEmail, emailVerified, role } = req.user;

    try {
        // Check if the user paid for the package
        const paymentExists = await PaymentReceipt.exists({
            userId,
            pkg: 'student/pro-pkg',
            status: 'succeeded',
        });

        if (!paymentExists) {
            return res
                .status(400)
                .json({ message: 'No payment receipt found' });
        }

        // Update user's package in the DB
        const result = await User.updateOne({ _id: userId }, { pkg: 'pro' });

        if (result.modifiedCount === 0) {
            return res
                .status(304)
                .json({ message: 'User package already up to date' });
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
            { upsert: true, new: true }
        );

        // Send response to user
        return res
            .cookie(process.env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
                maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: 'None',
            })
            .json({
                message: 'Package successfully updated to pro',
                data: { user: userData, accessToken },
            });
    } catch (error) {
        console.error('Error in updateUserPackage:', error);
        res.status(500).json({
            message: 'Internal server error',
            error: error.message,
        });
    }
}

// ! Bookmarks related routes
async function getUserBookmark(req, res) {
    const { id } = req.params;
    const { recipeId } = req.query;

    // validate user id and recipe id
    if (!validateMongoDBId(id, res) || !validateMongoDBId(recipeId, res)) {
        return;
    }

    try {
        const bookmarkedDoc = await Bookmark.findOne({
            userId: new ObjectId(id),
            recipeId: new ObjectId(recipeId),
        });

        if (!bookmarkedDoc) {
            return res.json({
                message: "You didn't like the recipe.",
                data: {},
            });
        }

        res.json({ message: 'Successful', data: bookmarkedDoc });
    } catch (error) {
        console.error('Error in getUserBookmark:', error);
        res.status(500).json({
            message: 'An error occurred',
            error: error.message,
        });
    }
}

async function getUserBookmarks(req, res) {
    const { id } = req.params;

    if (!validateMongoDBId(id)) {
        return;
    }

    try {
        // Find bookmarks for the user
        const bookmarks = await Bookmark.find({ userId: id });

        res.json({
            message: 'Bookmarks retrieved successfully',
            data: bookmarks,
        });
    } catch (error) {
        console.error('Error in getUserBookmarks:', error);
        res.status(500).json({
            message: 'An error occurred while fetching bookmarks',
            data: null,
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
            userId: new ObjectId(id),
            recipeId: new ObjectId(recipeId),
        });

        if (bookmarkExists) {
            throw createError('You already bookmarked it.', 400);
        }

        const newBookmark = await Bookmark.create({
            userId: new ObjectId(id),
            recipeId: new ObjectId(recipeId),
        });

        res.json({ message: 'Successful', data: newBookmark });
    } catch (error) {
        console.error('Error in markRecipeAsBookmark:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'An unexpected error occurred',
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
            userId: new ObjectId(id),
            recipeId: new ObjectId(recipeId),
        });

        if (!bookmarkExists) {
            throw createError("You didn't bookmarked it.", 400);
        }

        const result = await Bookmark.deleteOne({
            userId: new ObjectId(id),
            recipeId: new ObjectId(recipeId),
        });

        res.json({ message: 'Successfully removed bookmark', data: {} });
    } catch (error) {
        console.error('Error in markRecipeAsBookmark:', error);
        res.status(error.statusCode || 500).json({
            message: error.message || 'An unexpected error occurred',
        });
    }
}

// ! Likes related routes
async function getUserLike(req, res) {
    const { id } = req.params;
    const { recipeId } = req.query;
    const { userId } = req.user;

    // Ensure authorization
    if (id !== userId) {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    // Validate user id and recipe id
    if (!validateMongoDBId(id) || !validateMongoDBId(recipeId)) {
        return;
    }

    try {
        const likedDoc = await Like.findOne({
            userId: new ObjectId(id),
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
        console.error('Error in getUserLike:', error);
        res.status(500).json({
            message: 'An error occurred',
            error: error.message,
        });
    }
}

async function getUserLikes(req, res) {
    const { id } = req.params;
    const { userId } = req.user;

    // Ensure authorization
    if (id !== userId) {
        return res.status(403).json({ message: 'Unauthorized access' });
    }

    // validate user id
    if (!validateMongoDBId(id, res)) {
        return;
    }

    try {
        const likes = await Like.find({
            userId: new ObjectId(id),
        });

        res.json({ message: 'Successful', data: likes });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
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
        if (!validateMongoDBId(id) || !validateMongoDBId(recipeId)) {
            return;
        }

        const result = await withTransaction(async (session) => {
            const likeExists = await Like.exists({
                userId: new ObjectId(id),
                recipeId: new ObjectId(recipeId),
            });

            if (likeExists) {
                throw createError('Like already exists', 400);
            }

            const newLike = await Like.create(
                [
                    {
                        userId: new ObjectId(id),
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
            message: error.message || 'An unexpected error occurred',
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

    if (!validateMongoDBId(id) || !validateMongoDBId(recipeId)) {
        return;
    }

    try {
        const result = await withTransaction(async (session) => {
            const removedLike = await Like.findOneAndDelete(
                { userId: new ObjectId(id), recipeId: new ObjectId(recipeId) },
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
            message: error.message || 'An unexpected error occurred',
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
            userId: new ObjectId(id),
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
    validateMongoDBId(userId, res);
    validateMongoDBId(recipeId, res);

    try {
        const result = await Rating.create({
            recipeId: new ObjectId(recipeId),
            userId: new ObjectId(userId),
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
    validateMongoDBId(docId, res);

    try {
        const result = await Rating.updateOne(
            { _id: new ObjectId(docId) },
            {
                rating,
                message,
            },
            { runValidators: true }
        );

        res.json({ message: 'Successful', data: result });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

async function removeRecipeRating(req, res) {
    const { docId } = req.query;

    // validate recipe id
    validateMongoDBId(docId, res);

    try {
        const result = await Rating.deleteOne({
            _id: new ObjectId(docId),
        });

        res.json({ message: 'Successful', data: result });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

// ! Chef reviews related routes
async function getChefReviews(req, res) {
    const { id } = req.params;

    // validate user id
    validateMongoDBId(id, res);

    try {
        const reviews = await ChefReview.find({
            userId: new ObjectId(id),
        });

        res.json({ message: 'Successful', data: reviews });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

async function addChefReview(req, res) {
    const { userId } = req.user;
    const { chefId, rating, message } = req.body;

    // validate user id and recipe id
    validateMongoDBId(userId, res);
    validateMongoDBId(chefId, res);

    try {
        const result = await ChefReview.create({
            chefId: new ObjectId(chefId),
            userId: new ObjectId(userId),
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
    validateMongoDBId(docId, res);

    try {
        const result = await ChefReview.updateOne(
            { _id: new ObjectId(docId) },
            {
                rating,
                message,
            },
            { runValidators: true }
        );

        res.json({ message: 'Successful', data: result });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

async function removeChefReview(req, res) {
    const { docId } = req.query;

    // validate recipe id
    validateMongoDBId(docId, res);

    try {
        const result = await ChefReview.deleteOne({
            _id: new ObjectId(docId),
        });

        res.json({ message: 'Successful', data: result });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

// ! Role promotion related routes
async function handleUserRolePromotion(req, res) {
    const { requestId } = req.params;
    const actionResult = req.query.result;
    const { userId, firebaseId } = req.user;

    if (!actionResult) {
        return res.status(400).json({ message: 'No action parameter found!' });
    } else if (!requestId) {
        return res.status(400).json({ message: 'Request id is required!' });
    }

    validateMongoDBId(userId, res);

    try {
        const requestedDocument = await RolePromotionApplicant.findById(
            requestId
        );

        if (requestedDocument?._id) {
            if (actionResult === 'accepted') {
                const { name, email, emailVerified, img } = await User.findById(
                    userId
                );

                if (!emailVerified) {
                    requestedDocument.status = 'rejected';
                    // update RolePromotionApplicant document
                    await requestedDocument.save();

                    res.json({
                        message:
                            'Your email is not verified! kindly verify your email first.',
                    });
                } else {
                    requestedDocument.status = 'accepted';

                    let roleUpgradedUser;

                    // if the requested role is Chef - create new Chef document
                    if (requestedDocument.role === 'chef') {
                        roleUpgradedUser = new Chef({
                            name,
                            email,
                            emailVerified,
                            img,
                            bio: 'Best cook in the town',
                            yearsOfExperience: 3,
                        });

                        // delete User document from database
                        await User.findByIdAndDelete(userId);
                    }

                    // update firebase custom claims
                    await admin.auth().setCustomUserClaims(firebaseId, {
                        _id: roleUpgradedUser._id,
                        role: roleUpgradedUser.role,
                    });

                    // save Chef document
                    await roleUpgradedUser.save();

                    // update RolePromotionApplicant document
                    await requestedDocument.save();

                    // send response
                    res.status(200).json({
                        message: 'Successfully upgraded the role.',
                    });
                }
            } else {
                requestedDocument.status = 'rejected';
                // update RolePromotionApplicant document
                await requestedDocument.save();

                // send response
                res.status(200).json({
                    message: 'Successfully rejected the request.',
                });
            }
        } else {
            res.json({ message: 'User promotion request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'An error occurred', data: error });
    }
}

module.exports = {
    getUser,
    getUsers,
    verifyUserEmail,
    updateUserData,
    updateUserPackage,
    markRecipeAsBookmark,
    getUserBookmark,
    getUserBookmarks,
    removeRecipeAsBookmark,
    getUserLike,
    getUserLikes,
    addLikeToRecipe,
    removeLikeFromRecipe,
    getRecipeRatings,
    addRecipeRating,
    editRecipeRating,
    removeRecipeRating,
    getChefReviews,
    addChefReview,
    editChefReview,
    removeChefReview,
    handleUserRolePromotion,
};
