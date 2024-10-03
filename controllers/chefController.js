const { default: mongoose, isValidObjectId } = require('mongoose');
const { ObjectId } = mongoose.Types;

const getCurrPage = require('../utility/getCurrPage');
const createProjectionObject = require('../utility/createProjectionObject');
const createSortObject = require('../utility/createSortObject');
const validateMongoDBId = require('../utility/validateMongoDBId');

const Chef = require('../models/Chef');
const ChefReview = require('../models/ChefReview');
const Student = require('../models/Student');

async function getChef(req, res) {
    const { chefId } = req.params;
    const { include = '', exclude = '' } = req.query;

    // Check if chefId is valid
    if (!validateMongoDBId(chefId, res)) {
        return;
    }

    // Create initial pipeline
    const pipeline = [
        {
            $match: {
                _id: new ObjectId(chefId),
            },
        },
    ];

    // Create projection object
    const projection = createProjectionObject(include, exclude);

    // Add rating calculation if needed
    if (Object.keys(projection).length === 0 || projection.rating === 1) {
        pipeline.push(
            {
                $lookup: {
                    from: 'chefreviews',
                    localField: '_id',
                    foreignField: 'chefId',
                    as: 'reviews',
                },
            },
            {
                $addFields: {
                    rating: {
                        $round: [{ $avg: '$reviews.rating' }, 2],
                    },
                },
            },
            {
                $project: { reviews: 0 }, // Remove the reviews array
            }
        );
    }

    // Add projection stage if needed
    if (Object.keys(projection).length > 0) {
        pipeline.push({ $project: projection });
    }

    try {
        const [chef] = await Chef.aggregate(pipeline);

        res.json({
            message: 'Successful',
            data: chef || {},
        });
    } catch (err) {
        console.error('Error in getChef:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getChefs(req, res) {
    const {
        p,
        page = 1,
        l,
        limit = process.env.CHEFS_PER_PAGE,
        sort = 'updatedAt',
        order = 'desc',
        include = '',
        exclude = '',
        role = 'student',
    } = req.query;
    const _page = Math.max(0, parseInt(p || page) - 1);
    const _limit = Math.max(1, parseInt(l || limit));
    const _role = role === 'student' ? 'user' : role;

    // Create projection object
    const projection = createProjectionObject(include, exclude);

    // Create sort object
    const sortObj = createSortObject(sort, order);

    // Create filter object based on role
    const filterObj =
        _role !== 'admin' ? { recipes: { $exists: true, $ne: [] } } : {};

    // Add rating calculation if needed
    const includeRating =
        Object.keys(projection).length === 0 || projection.rating === 1;
    const pipeline = [
        { $match: filterObj },
        ...(includeRating
            ? [
                  {
                      $lookup: {
                          from: 'chefreviews',
                          localField: '_id',
                          foreignField: 'chefId',
                          as: 'reviews',
                      },
                  },
                  {
                      $addFields: {
                          rating: {
                              $round: [{ $avg: '$reviews.rating' }, 2],
                          },
                      },
                  },
                  {
                      $project: { reviews: 0 }, // Remove the reviews array
                  },
              ]
            : []),
        { $sort: sortObj },
        { $skip: _page * _limit },
        { $limit: _limit },
        { $project: projection },
    ];

    try {
        const [result, totalCount] = await Promise.all([
            Chef.aggregate(pipeline),
            Chef.countDocuments(filterObj),
        ]);
        const currPage = getCurrPage(_page + 1, _limit, totalCount);

        res.json({
            data: result,
            meta: {
                page: currPage,
                totalCount,
            },
        });
    } catch (err) {
        console.error('Error in getChefs:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
}

async function getChefReviews(req, res) {
    const { chefId } = req.params;
    const {
        p,
        page = 1,
        l,
        limit = process.env.CHEF_REVIEWS_PER_PAGE,
        sort = 'updatedAt',
        order = 'desc',
        include = '',
        exclude = '',
    } = req.query;

    // Ensure page and limit are positive integers
    const _page = Math.max(0, parseInt(p || page) - 1);
    const _limit = Math.max(1, parseInt(l || limit));

    // Create projection object based on include/exclude parameters
    const projection = createProjectionObject(include, exclude);

    // Create sort object based on query
    const sortObj = createSortObject(sort, order);

    // Use aggregation pipeline for more flexibility
    const pipeline = [
        { $match: { chefId: new ObjectId(chefId) } },
        { $sort: sortObj },
        { $skip: _page * _limit },
        { $limit: _limit },
    ];

    if (Object.keys(projection).length > 0) {
        pipeline.push({ $project: projection });
    }

    try {
        const [reviews, totalReviews] = await Promise.all([
            ChefReview.aggregate(pipeline),
            ChefReview.countDocuments({ chefId }),
        ]);

        const currPage = getCurrPage(_page + 1, _limit, totalReviews);

        res.json({
            data: reviews,
            meta: {
                page: currPage,
                totalCount: totalReviews,
            },
        });
    } catch (err) {
        console.error('Error in getChefReviews:', err);
        res.status(500).json({
            message: 'Internal server error',
            error: err.message,
        });
    }
}

async function createChefReview(req, res) {
    const { chefId } = req.params;
    const { studentId, rating, message } = req.body;

    // Check if chefId exists and is valid
    if (!chefId || !isValidObjectId(chefId)) {
        return res.status(400).json({ message: 'Provide valid chef id.' });
    }

    // Check if studentId exists and is valid
    if (!studentId || !isValidObjectId(studentId)) {
        return res.status(400).json({ message: 'Provide valid user id.' });
    }

    try {
        const student = await Student.findById(studentId).select('pkg');

        if (student?.pkg === 'pro') {
            const result = await ChefReview.create({
                chefId,
                studentId,
                rating,
                message,
            });

            res.json({ message: 'Successful', data: result });
        } else {
            res.status(400).json({
                message: 'Only pro users can give chef reviews.',
            });
        }
    } catch (err) {
        if (err?.code === 11000) {
            res.status(400).json({
                message: 'You have already given a review to this chef.',
            });
        } else {
            console.log(err.code);
            res.status(500).json(err);
        }
    }
}

async function updateChefData(req, res) {
    const { userId } = req.user;
    const data = req.body;

    if (!data) {
        return res.status(400).json({ message: 'No payload found.' });
    }

    try {
        const result = await Chef.updateOne({ _id: userId }, data);

        res.json({
            data: result,
            message: 'Successfully updated data',
        });
    } catch (error) {
        console.log(error);
        res.json(error);
    }
}

module.exports = {
    getChef,
    getChefs,
    getChefReviews,
    createChefReview,
    updateChefData,
};
