const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const RolePromotionApplicant = require('../models/RolePromotionApplicant');
const validateMongoDBId = require('../utility/validateMongoDBId');
const createSortObject = require('../utility/createSortObject');
const getCurrPage = require('../utility/getCurrPage');

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

    // Check if the user ID is valid
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
        return res.json({
            msg: 'User has not applied for promotion',
            data: { status: false },
        });
    }

    res.json({ msg: 'User has applied for promotion', data: { status: true } });
}

async function getRolePromotionApplications(req, res) {
    const {
        p,
        page = 0,
        l,
        limit = process.env.CHEFS_PER_PAGE,
        sort = 'updatedAt',
        order = 'desc',
    } = req.query;

    const _page = parseInt(p || page) - 1;
    const _limit = parseInt(l || limit) <= 0 ? 10 : parseInt(l || limit);

    // Create sort object based on query
    const sortObj = createSortObject(sort, order);

    // Create the aggregation pipeline
    const pipeline = [
        { $sort: sortObj },
        { $skip: (_page <= 0 ? 0 : _page) * _limit },
        { $limit: _limit },
    ];

    try {
        const result = await RolePromotionApplicant.aggregate(pipeline);

        const totalRecipes = await RolePromotionApplicant.countDocuments({});
        const currPage = getCurrPage(
            _page <= 0 ? 1 : _page + 1,
            _limit,
            totalRecipes
        );

        res.json({
            data: result,
            meta: {
                page: currPage,
                totalCount: totalRecipes,
            },
        });
    } catch (err) {
        res.status(500).json(err);
    }
}

async function getRolePromotionApplication(req, res) {
    const { applicationId } = req.params;

    // Validate the application Id
    if (!validateMongoDBId(applicationId, res)) {
        return;
    }

    try {
        const application = await RolePromotionApplicant.findById(
            applicationId
        );

        if (application?._id) {
            return res.json({
                msg: 'Successful',
                data: application,
            });
        } else {
            return res.json({
                msg: 'Successful',
                data: {},
            });
        }
    } catch (err) {
        res.status(500).json(err);
    }
}

module.exports = {
    applyForPromotion,
    hasAppliedForPromotion,
    getRolePromotionApplication,
    getRolePromotionApplications,
};
