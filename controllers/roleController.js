const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const RolePromotionApplicant = require('../models/RolePromotionApplicant');
const validateMongoDBId = require('../utility/validateMongoDBId');
const createSortObject = require('../utility/createSortObject');
const getCurrPage = require('../utility/getCurrPage');

const APPLICATION_STATUS = {
    202: 'accepted',
    400: 'rejected',
};

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
        res.status(400).json({ message: 'A valid role is required' });
        return;
    }

    try {
        // Check if the user has already been applied
        const doc = await RolePromotionApplicant.findOne({
            usersId: new ObjectId(userId),
            role,
        });

        if (doc?._id) {
            res.status(400).json({ message: 'User already applied' });
            return;
        }

        const result = await createRolePromotionDoc(userId, role);

        res.json({ message: 'Successful', data: result });
    } catch (error) {
        console.error('Error fetching applyForPromotion:', error);
        res.status(500).json({
            message: 'An error occurred',
            error: error.message,
        });
    }
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
        res.status(400).json({ message: 'Role is required' });
        return;
    }

    try {
        // Check if the user has applied
        const applicationExists = await RolePromotionApplicant.exists({
            usersId: new ObjectId(userId),
            role,
        });

        res.json({
            message: applicationExists
                ? 'User has applied for promotion'
                : 'User has not applied for promotion',
            data: { status: applicationExists },
        });
    } catch (error) {
        console.error('Error fetching hasAppliedForPromotion:', error);
        res.status(500).json({
            message: 'An error occurred',
            error: error.message,
        });
    }
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
        const [result, totalRecipes] = await Promise.all([
            RolePromotionApplicant.aggregate(pipeline),
            RolePromotionApplicant.countDocuments({}),
        ]);

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
    } catch (error) {
        console.error('Error fetching getRolePromotionApplications:', error);
        res.status(500).json({
            message: 'An error occurred',
            error: error.message,
        });
    }
}

async function getRolePromotionApplication(req, res) {
    const { applicationId } = req.params;

    // Validate the application Id
    if (!validateMongoDBId(applicationId, res)) {
        return;
    }

    try {
        const document = await RolePromotionApplicant.findById(applicationId);

        res.json({
            message: 'Successful',
            data: document,
        });
    } catch (error) {
        console.error('Error fetching getRolePromotionApplication:', error);
        res.status(500).json({
            message: 'An error occurred',
            error: error.message,
        });
    }
}

async function updatePromotionApplicationStatus(req, res) {
    const { id, status } = req.query;

    // Check if the document ID is valid
    if (!validateMongoDBId(id, res)) {
        return;
    }

    // Check if the status code is valid
    if (!Object.keys(APPLICATION_STATUS).includes(status)) {
        return res.status(400).json({ message: 'Invalid status code' });
    }

    try {
        const application = await RolePromotionApplicant.findById(id);

        // Validate if the application already have at the requested status
        if (Object.values(APPLICATION_STATUS).includes(application.status)) {
            return res.status(400).json({
                message: `Status has already been ${application.status}`,
            });
        }

        application.status = APPLICATION_STATUS[status];

        const result = await application.save();

        res.json({
            message: 'Successfully updated the status',
            data: result,
        });
    } catch (error) {
        console.error(
            'Error fetching updatePromotionApplicationStatus:',
            error
        );
        res.status(500).json({
            message: 'An error occurred',
            error: error.message,
        });
    }
}

async function deletePromotionApplication(req, res) {
    const { id: queryId } = req.query;
    const { id: paramId } = req.params;

    const id = queryId || paramId;

    // Check if the document ID is valid
    if (!validateMongoDBId(id, res)) {
        return;
    }

    try {
        const application = await RolePromotionApplicant.findById(id);

        // Validate not to update accepted or rejected application
        if (
            application.status !== APPLICATION_STATUS[202] ||
            application.status !== APPLICATION_STATUS[400]
        ) {
            return res.status(400).json({
                message: `A ${application.status} document can not be deleted`,
            });
        }

        const result = await RolePromotionApplicant.deleteOne({ _id: id });

        return res.json({
            message: 'Successfully deleted the application',
            data: result,
        });
    } catch (error) {
        console.error('Error fetching deletePromotionApplication:', error);
        res.status(500).json({
            message: 'An error occurred',
            error: error.message,
        });
    }
}

module.exports = {
    applyForPromotion,
    hasAppliedForPromotion,
    getRolePromotionApplication,
    getRolePromotionApplications,
    updatePromotionApplicationStatus,
    deletePromotionApplication,
};
