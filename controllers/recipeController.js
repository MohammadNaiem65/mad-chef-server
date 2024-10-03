const { default: mongoose } = require('mongoose');
const { ObjectId } = mongoose.Types;

const Recipe = require('../models/Recipe');
const Rating = require('../models/Rating');
const getCurrPage = require('../utility/getCurrPage');
const validateMongoDBId = require('../utility/validateMongoDBId');
const createProjectionObject = require('../utility/createProjectionObject');

/**
A function to generate a MongoDB query filter for recipe upload dates.
@param {string} uploadDate - The type of upload date filter to apply.
@returns {Object|null} - A MongoDB query filter object or null if the input is invalid.

@example
const todayFilter = getUploadDateFilter('today');
// todayFilter = {
//   $eq: [
//     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
//     '2022-01-01' // current date in 'YYYY-MM-DD' format
//   ]
// }
 */
function getUploadDateFilter(uploadDate) {
    const date = new Date();
    switch (uploadDate.toLowerCase()) {
        case 'today':
            return {
                $eq: [
                    {
                        $dateToString: {
                            format: '%Y-%m-%d',
                            date: '$createdAt',
                        },
                    },
                    date.toISOString().split('T')[0],
                ],
            };
        case 'this month':
            return { $eq: [{ $month: '$createdAt' }, date.getMonth() + 1] };
        case 'this year':
            return { $eq: [{ $year: '$createdAt' }, date.getFullYear()] };
        default:
            return null;
    }
}

async function searchRecipes(req, res) {
    const {
        p,
        page = 1,
        l,
        limit = process.env.RECIPES_PER_PAGE,
        data_filter,
        sort = 'updatedAt',
        order = 'desc',
        include = '',
        exclude = '',
        role = 'student',
    } = req.query;

    const parsedDataFilter = data_filter
        ? JSON.parse(decodeURIComponent(data_filter))
        : {};
    const _page = Math.max(0, parseInt(p || page) - 1);
    const _limit = Math.max(1, parseInt(l || limit));
    const _role = role === 'student' ? 'user' : role;

    if (parsedDataFilter?.chefId) {
        validateMongoDBId(parsedDataFilter.chefId, res);
    }

    const sortObj = Object.fromEntries(
        sort.split(',').map((el) => [el, order === 'desc' ? -1 : 1])
    );
    const projection = createProjectionObject(include, exclude);

    const pipeline = [];
    const filterPipeline = [];

    // Add role-based filter
    if (_role === 'user') {
        filterPipeline.push({ $match: { status: 'published' } });
    }

    // Add data filters
    if (Object.keys(parsedDataFilter).length > 0) {
        const { searchQuery, chefId, region, uploadDate } = parsedDataFilter;

        if (searchQuery) {
            filterPipeline.push(
                {
                    $lookup: {
                        from: 'chefs',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'chef_info',
                    },
                },
                {
                    $match: {
                        $or: [
                            { title: { $regex: searchQuery, $options: 'i' } },
                            {
                                'chef_info.name': {
                                    $regex: searchQuery,
                                    $options: 'i',
                                },
                            },
                        ],
                    },
                }
            );
        }

        const singleStageFilters = [];

        if (chefId)
            singleStageFilters.push({ $eq: ['$author', new ObjectId(chefId)] });
        if (region) singleStageFilters.push({ $eq: ['$region', region] });

        if (uploadDate) {
            const dateFilter = getUploadDateFilter(uploadDate);
            if (dateFilter) singleStageFilters.push(dateFilter);
        }

        if (singleStageFilters.length > 0) {
            filterPipeline.push({
                $match: { $expr: { $and: singleStageFilters } },
            });
        }
    }

    // Add rating calculation if needed
    const shouldIncludeRating = projection.rating !== 0;
    if (shouldIncludeRating) {
        pipeline.push(
            {
                $lookup: {
                    from: 'ratings',
                    localField: '_id',
                    foreignField: 'recipeId',
                    as: 'rating',
                },
            },
            {
                $addFields: {
                    rating: { $round: [{ $avg: '$rating.rating' }, 2] },
                },
            }
        );
    }

    // Add main pipeline stages
    pipeline.push(
        { $sort: sortObj },
        { $skip: _page * _limit },
        { $limit: _limit }
    );

    // Add projection if needed
    if (Object.keys(projection).length > 0) {
        pipeline.push({ $project: projection });
    }

    try {
        const [recipes, totalRecipes] = await Promise.all([
            Recipe.aggregate([...filterPipeline, ...pipeline]),
            Recipe.aggregate([...filterPipeline, { $count: 'total' }]),
        ]);

        const totalCount = totalRecipes[0]?.total || 0;
        const currPage = getCurrPage(_page + 1, _limit, totalCount);

        res.json({
            data: recipes,
            meta: {
                page: currPage,
                totalCount: totalCount,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            error: 'An error occurred while searching recipes',
        });
    }
}

async function getRecipe(req, res) {
    const { recipeId } = req.params;
    const { include = '', exclude = '' } = req.query;

    // Check if recipeId is provided
    if (!recipeId) {
        return res
            .status(400)
            .json({ message: 'An ID is required to get a recipe.' });
    }

    // Validate the MongoDB ID
    if (!validateMongoDBId(recipeId, res)) {
        return;
    }

    const projection = createProjectionObject(include, exclude);

    const pipeline = [{ $match: { _id: new ObjectId(recipeId) } }];

    // Calculate rating if needed
    const projectionHasValueOne = Object.values(projection).includes(1);
    if (
        (projectionHasValueOne && projection.rating) ||
        (!projectionHasValueOne && projection.rating === undefined)
    ) {
        pipeline.push(
            {
                $lookup: {
                    from: 'ratings',
                    localField: '_id',
                    foreignField: 'recipeId',
                    as: 'ratings',
                },
            },
            {
                $addFields: {
                    rating: { $round: [{ $avg: '$ratings.rating' }, 2] },
                    ...((projectionHasValueOne && projection.ratingCount) ||
                    (!projectionHasValueOne &&
                        projection.ratingCount === undefined)
                        ? { ratingCount: { $size: '$ratings' } }
                        : {}),
                },
            }
        );
        projection.ratings = 0;
    }

    // Add projection if needed
    if (Object.keys(projection).length > 0) {
        pipeline.push({ $project: projection });
    }

    try {
        const recipe = await Recipe.aggregate(pipeline);

        // If recipe not found, return 404
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found.' });
        }

        res.json({
            message: 'Successful',
            data: recipe[0],
        });
    } catch (err) {
        console.error('Error in getRecipe:', err);
        res.status(500).json({
            message: 'Internal server error',
            error: err.message,
        });
    }
}

async function postRecipe(req, res) {
    const { userId, role } = req.user;
    const { title, ingredients, method, img, author } = req.body;

    // Validate the userId
    validateMongoDBId(userId, res);

    if (userId && role === 'chef') {
        const doc = await Recipe.create({
            title,
            ingredients,
            method,
            img,
            author,
        });

        res.json({ message: 'Successful', data: doc });
    } else {
        res.status(401).json({ message: 'Only chef can post recipe.' });
    }
}

async function getRecipeRatings(req, res) {
    // Extract and parse query parameters
    const {
        p,
        page = 1,
        l,
        limit = process.env.RECIPES_PER_PAGE,
        data_filter,
        order = 'desc',
        include = '',
        exclude = '',
    } = req.query;

    // Parse data filter and set pagination parameters
    const parsedDataFilter = data_filter
        ? JSON.parse(decodeURIComponent(data_filter))
        : {};
    const _page = Math.max(0, parseInt(p || page) - 1); // Ensure page is not negative
    const _limit = Math.max(1, parseInt(l || limit)); // Ensure limit is at least 1

    // Validate MongoDB IDs if present in the filter
    if (parsedDataFilter?.recipeId) {
        if (!validateMongoDBId(parsedDataFilter.recipeId, res)) {
            return;
        }
    }
    if (parsedDataFilter?.studentId) {
        if (!validateMongoDBId(parsedDataFilter.studentId, res)) {
            return;
        }
    }

    // Create projection object based on include/exclude parameters
    const projection = createProjectionObject(include, exclude);

    // Initialize aggregation pipeline
    const pipeline = [
        { $sort: { rating: order === 'desc' ? -1 : 1 } },
        { $skip: _page * _limit },
        { $limit: _limit },
    ];

    // Add $match stage if filters are provided
    if (Object.keys(parsedDataFilter).length > 0) {
        const match = {};
        if (parsedDataFilter.recipeId)
            match.recipeId = new ObjectId(parsedDataFilter.recipeId);
        if (parsedDataFilter.studentId)
            match.studentId = new ObjectId(parsedDataFilter.studentId);
        if (Object.keys(match).length > 0) pipeline.unshift({ $match: match });
    }

    // Add $lookup stage if username or userImg is requested
    if (include.includes('username') || include.includes('userImg')) {
        pipeline.push(
            {
                $lookup: {
                    from: 'users',
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'userDetails',
                },
            },
            {
                $addFields: {
                    ...(include.includes('username') && {
                        username: { $arrayElemAt: ['$userDetails.name', 0] },
                    }),
                    ...(include.includes('userImg') && {
                        userImg: { $arrayElemAt: ['$userDetails.img', 0] },
                    }),
                },
            },
            { $project: { userDetails: 0 } } // Remove userDetails array after extracting required fields
        );
    }

    // Add projection stage if needed
    if (Object.keys(projection).length > 0) {
        pipeline.push({ $project: projection });
    }

    try {
        // Execute aggregation pipeline and count total documents concurrently
        const [ratings, totalRatings] = await Promise.all([
            Rating.aggregate(pipeline),
            Rating.countDocuments(parsedDataFilter),
        ]);

        // Send response with ratings data and metadata
        res.json({
            data: ratings,
            meta: {
                page: getCurrPage(_page + 1, _limit, totalRatings),
                totalCount: totalRatings,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function updateRecipeStatus(req, res) {
    const { recipeId: paramId } = req.params;
    const { status, recipeId: queryId } = req.query;

    const recipeId = paramId || queryId;

    if (!validateMongoDBId(recipeId, res)) {
        return;
    }

    try {
        const doc = await Recipe.findById(recipeId);

        doc.status = status;

        const result = await doc.save();

        res.json({ message: 'Successful', data: result });
    } catch (error) {
        console.log(error);
        res.json(error);
    }
}

async function deleteRecipe(req, res) {
    const { recipeId: paramId } = req.params;
    const { recipeId: queryId } = req.query;
    const { userId, role } = req.user;

    const recipeId = paramId || queryId;

    if (!validateMongoDBId(recipeId, res)) {
        return;
    }

    try {
        const doc = await Recipe.findById(recipeId);

        if (
            (role === 'admin' && doc.status === 'rejected') ||
            (role === 'chef' && new ObjectId(userId).equals(doc.author))
        ) {
            const result = await Recipe.deleteOne({ _id: recipeId });

            res.json({ message: 'Successfully deleted.', data: result });
        } else {
            res.status(400).json({
                message: 'Only rejected recipes can be deleted.',
            });
        }
    } catch (error) {
        console.log(error);
        res.json(error);
    }
}

module.exports = {
    getRecipe,
    postRecipe,
    searchRecipes,
    getRecipeRatings,
    updateRecipeStatus,
    deleteRecipe,
};
