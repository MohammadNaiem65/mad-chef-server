const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const RolePromotionApplicant = require('../models/RolePromotionApplicant');
const validateMongoDBId = require('../utility/validateMongoDBId');

/**
 * Creates a new RolePromotionApplicant document in the database.
 *
 * @param {string} id - The unique identifier of the user.
 * @param {string} role - The role to be promoted.
 * @returns {Promise<RolePromotionApplicant>} - A promise that resolves to the created RolePromotionApplicant document.
 */
function createRolePromotionDoc(id, role) {
	return RolePromotionApplicant.create({
		usersId: id,
		role: role,
	});
}

async function applyForPromotion(req, res) {
	const { userId } = req.user;
	const { role } = req.query;

	// Check if the user is authenticated
	if (!validateMongoDBId(userId, res)) {
		return;
	}

	// Check if the role has value
	if (!(role === 'chef' || role === 'admin')) {
		res.status(400).json({ msg: 'A valid role is required' });
		return;
	}

	// Check if the user has already been applied
	const doc = await RolePromotionApplicant.findOne({
		usersId: new ObjectId(userId),
	});
	if (doc?._id) {
		res.status(400).json({ msg: 'User already applied' });
		return;
	}

	const result = await createRolePromotionDoc(userId, role);

	res.json({ msg: 'Successful', data: result });
}

async function hasAppliedForPromotion(req, res) {
	const { userId } = req.user;
	const { role } = req.query;

	// Check if the user is authenticated
	if (!validateMongoDBId(userId, res)) {
		return;
	}

	// Check if the role has value
	if (!role) {
		res.status(400).json({ msg: 'Role is required' });
		return;
	}

	// Check if the user has applied
	const doc = await RolePromotionApplicant.findOne({
		usersId: new ObjectId(userId),
		role,
	});

	if (!doc?._id) {
		res.json({
			msg: 'User has not applied for promotion',
			data: { status: false },
		});
		return;
	}

	res.json({ msg: 'User has applied for promotion', data: { status: true } });
}

module.exports = { applyForPromotion, hasAppliedForPromotion };
