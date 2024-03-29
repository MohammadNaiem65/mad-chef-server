const mongoose = require('mongoose');
const admin = require('firebase-admin');

const User = require('../models/User');
const RolePromotionApplicants = require('../models/RolePromotionApplicants');
const Chef = require('../models/Chef');

// utility functions
/**
 * @description This function is used validate if a id is a valid mongodb id
 *
 * @param {string} id - mongodb id string
 * @returns - if the id is invalid, returns an 400 error
 */
function validateMongoDBId(id) {
	if (!mongoose.Types.ObjectId.isValid(id)) {
		// Send a 400 response indicating the ID is invalid
		return res.status(400).send({ error: 'Invalid MongoDB ID provided.' });
	}
}

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

	// check if the id is valid
	validateMongoDBId(id);

	const user = await User.findOne({ _id: id });
	res.json({ msg: 'Successful', data: user });
}

async function applyToBeChef(req, res) {
	const id = req.params.id;

	// Check if the id is valid
	validateMongoDBId(id);

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
		res.sendStatus(500);
	}
}

module.exports = { getUser, applyToBeChef, handleUserRolePromotion };
