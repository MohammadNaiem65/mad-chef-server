const admin = require('firebase-admin');
const { Types } = require('mongoose');

const validateMongoDBId = require('../utility/validateMongoDBId');
const createProjectionObject = require('../utility/createProjectionObject');
const User = require('../models/User');
const Chef = require('../models/Chef');
const Bookmark = require('../models/Bookmark');
const Like = require('../models/Like');
const Rating = require('../models/Rating');
const ChefReview = require('../models/ChefReview');
const RolePromotionApplicants = require('../models/RolePromotionApplicants');

// utility functions
/**
 * @description Creates a new mongodb document of promoting the role of a user
 *
 * @param {string} id
 * @param {string} role
 * @returns {object}
 */
function createRolePromotionDoc(id, role) {
	return RolePromotionApplicants.create({
		usersId: id,
		role: role,
	});
}

// middleware functions
async function getUser(req, res) {
	const id = req.params.id;
	const { include, exclude } = req.query;

	// check if the id is valid and send 400 status if invalid
	if (!validateMongoDBId(id, res)) {
		return; // Stop execution if the ID is invalid
	}

	// Initialize projection options as an empty object
	let projection = {};

	// Only create projection objects if include or exclude is not an empty string
	if (include && !exclude) {
		includesObj = createProjectionObject(include, {}, 1);
		projection = { ...projection, ...includesObj };
	}
	if (exclude && !include) {
		excludesObj = createProjectionObject(exclude, {}, 0);
		projection = { ...projection, ...excludesObj };
	}

	try {
		const user = await User.findById(id, projection);

		res.json({ msg: 'Successful', data: user });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
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

// ! Bookmarks related routes
async function getUserBookmarks(req, res) {
	const { id } = req.params;

	// validate user id
	validateMongoDBId(id, res);

	try {
		const bookmarks = await Bookmark.find({
			userId: new Types.ObjectId(id),
		});

		res.json({ msg: 'Successful', data: bookmarks });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

async function addUserBookmark(req, res) {
	const { id } = req.params;
	const { recipeId } = req.query;

	// validate user id and recipe id
	validateMongoDBId(id, res);
	validateMongoDBId(recipeId, res);

	try {
		const result = await Bookmark.create({
			userId: new Types.ObjectId(id),
			recipeId: new Types.ObjectId(recipeId),
		});

		res.json({ msg: 'Successful', data: result });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

async function removeUserBookmark(req, res) {
	const { docId } = req.query;

	// validate user id and recipe id
	validateMongoDBId(docId, res);

	try {
		const result = await Bookmark.deleteOne({
			_id: new Types.ObjectId(docId),
		});

		res.json({ msg: 'Successful', data: result });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

// ! Likes related routes
async function getUserLikes(req, res) {
	const { id } = req.params;

	// validate user id
	validateMongoDBId(id, res);

	try {
		const likes = await Like.find({
			userId: new Types.ObjectId(id),
		});

		res.json({ msg: 'Successful', data: likes });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

async function addUserLike(req, res) {
	const { id } = req.params;
	const { recipeId } = req.query;

	// validate user id and recipe id
	validateMongoDBId(id, res);
	validateMongoDBId(recipeId, res);

	try {
		const result = await Like.create({
			userId: new Types.ObjectId(id),
			recipeId: new Types.ObjectId(recipeId),
		});

		res.json({ msg: 'Successful', data: result });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

async function removeUserLike(req, res) {
	const { docId } = req.query;

	// validate recipe id
	validateMongoDBId(docId, res);

	try {
		const result = await Like.deleteOne({
			_id: new Types.ObjectId(docId),
		});

		res.json({ msg: 'Successful', data: result });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

// ! Recipe ratings related routes
async function getRecipeRatings(req, res) {
	const { id } = req.params;

	// validate user id
	validateMongoDBId(id, res);

	try {
		const ratings = await Rating.find({
			userId: new Types.ObjectId(id),
		});

		res.json({ msg: 'Successful', data: ratings });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
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
			recipeId: new Types.ObjectId(recipeId),
			userId: new Types.ObjectId(userId),
			rating,
			message,
		});

		res.json({ msg: 'Successful', data: result });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

async function editRecipeRating(req, res) {
	const { docId } = req.query;
	const { rating, message } = req.body;

	// validate docId of rating document
	validateMongoDBId(docId, res);

	try {
		const result = await Rating.updateOne(
			{ _id: new Types.ObjectId(docId) },
			{
				rating,
				message,
			},
			{ runValidators: true }
		);

		res.json({ msg: 'Successful', data: result });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

async function removeRecipeRating(req, res) {
	const { docId } = req.query;

	// validate recipe id
	validateMongoDBId(docId, res);

	try {
		const result = await Rating.deleteOne({
			_id: new Types.ObjectId(docId),
		});

		res.json({ msg: 'Successful', data: result });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

// ! Chef reviews related routes
async function getChefReviews(req, res) {
	const { id } = req.params;

	// validate user id
	validateMongoDBId(id, res);

	try {
		const reviews = await ChefReview.find({
			userId: new Types.ObjectId(id),
		});

		res.json({ msg: 'Successful', data: reviews });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
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
			chefId: new Types.ObjectId(chefId),
			userId: new Types.ObjectId(userId),
			rating,
			message,
		});

		res.json({ msg: 'Successful', data: result });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

async function editChefReview(req, res) {
	const { docId } = req.query;
	const { rating, message } = req.body;

	// validate docId of review document
	validateMongoDBId(docId, res);

	try {
		const result = await ChefReview.updateOne(
			{ _id: new Types.ObjectId(docId) },
			{
				rating,
				message,
			},
			{ runValidators: true }
		);

		res.json({ msg: 'Successful', data: result });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

async function removeChefReview(req, res) {
	const { docId } = req.query;

	// validate recipe id
	validateMongoDBId(docId, res);

	try {
		const result = await ChefReview.deleteOne({
			_id: new Types.ObjectId(docId),
		});

		res.json({ msg: 'Successful', data: result });
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

// ! Role promotion related routes
async function applyToBeChef(req, res) {
	const id = req.params.id;

	// check if the id is valid and send 400 status if invalid
	validateMongoDBId(id, res);

	const result = await createRolePromotionDoc(id, 'chef');

	res.json({ msg: 'Successful', data: result });
}

async function handleUserRolePromotion(req, res) {
	const { requestId } = req.params;
	const actionResult = req.query.result;
	const { userId, firebaseId } = req.user;

	if (!actionResult) {
		return res.status(400).json({ msg: 'No action parameter found!' });
	} else if (!requestId) {
		return res.status(400).json({ msg: 'Request id is required!' });
	}

	validateMongoDBId(userId, res);

	try {
		const requestedDocument = await RolePromotionApplicants.findById(
			requestId
		);

		if (requestedDocument?._id) {
			if (actionResult === 'accepted') {
				const { name, email, emailVerified, img } = await User.findById(
					userId
				);

				if (!emailVerified) {
					requestedDocument.status = 'rejected';
					// update RolePromotionApplicants document
					await requestedDocument.save();

					res.json({
						msg: 'Your email is not verified! kindly verify your email first.',
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

					// update RolePromotionApplicants document
					await requestedDocument.save();

					// send response
					res.status(200).json({
						msg: 'Successfully upgraded the role.',
					});
				}
			} else {
				requestedDocument.status = 'rejected';
				// update RolePromotionApplicants document
				await requestedDocument.save();

				// send response
				res.status(200).json({
					msg: 'Successfully rejected the request.',
				});
			}
		} else {
			res.json({ msg: 'User promotion request not found' });
		}
	} catch (error) {
		res.status(500).json({ msg: 'An error occurred', data: error });
	}
}

module.exports = {
	getUser,
	verifyUserEmail,
	addUserBookmark,
	getUserBookmarks,
	removeUserBookmark,
	addUserLike,
	getUserLikes,
	removeUserLike,
	getRecipeRatings,
	addRecipeRating,
	editRecipeRating,
	removeRecipeRating,
	getChefReviews,
	addChefReview,
	editChefReview,
	removeChefReview,
	applyToBeChef,
	handleUserRolePromotion,
};
