const { default: mongoose, isValidObjectId } = require('mongoose');
const { ObjectId } = mongoose.Types;

const getCurrPage = require('../utility/getCurrPage');
const createProjectionObject = require('../utility/createProjectionObject');

const Chef = require('../models/Chef');
const ChefReview = require('../models/ChefReview');
const createSortObject = require('../utility/createSortObject');

async function getChef(req, res) {
	const { chefId } = req.params;
	const { include = '', exclude = '' } = req.query;

	// Check if chefId exists and is valid
	if (!chefId || !isValidObjectId(chefId)) {
		return res.status(400).json({ message: 'Provide valid chef id.' });
	}

	// Create initial pipeline
	const pipeline = [
		{
			$match: {
				_id: new ObjectId(chefId),
			},
		},
	];

	// Initialize projection options as an empty object
	let projection = {};
	let includesObj = {};
	let excludesObj = {};

	// Only create projection objects if include or exclude is not an empty string
	if (include && !exclude) {
		includesObj = createProjectionObject(include, {}, 1);
		projection = { ...projection, ...includesObj };
	}
	if (exclude && !include) {
		excludesObj = createProjectionObject(exclude, {}, 0);
		projection = { ...projection, ...excludesObj };
	}

	// Calculate rating if no projection field exists or includeObj has value 1 for rating field
	if (Object.keys(projection).length === 0 || includesObj?.rating === 1) {
		pipeline.push(
			{
				$lookup: {
					from: 'chefreviews',
					localField: '_id',
					foreignField: 'chefId',
					as: 'rating',
				},
			},
			{
				$addFields: {
					rating: {
						$round: [{ $avg: '$rating.rating' }, 2],
					},
				},
			}
		);
	}

	// Add projection stage if needed
	if (Object.keys(projection).length > 0) {
		pipeline.push({ $project: projection });
	}

	try {
		const chef = await Chef.aggregate(pipeline);

		res.json({ message: 'Successful', data: chef?.length > 0 && chef[0] });
	} catch (err) {
		console.log(err);
		res.status(500).json(err);
	}
}

async function getChefs(req, res) {
	const {
		p,
		page = 0,
		l,
		limit = process.env.CHEFS_PER_PAGE,
		sort = 'updatedAt',
		order = 'desc',
		include = '',
		exclude = '',
	} = req.query;

	const _page = parseInt(p || page) - 1;
	const _limit = parseInt(l || limit) <= 0 ? 10 : parseInt(l || limit);

	// Initialize pipeline options as an empty object
	let projection = {};
	let includesObj = {};
	let excludesObj = {};

	// Create sort object based on query
	const sortObj = createSortObject(sort, order);

	// Only create projection objects if include or exclude is not an empty string
	if (include) {
		includesObj = createProjectionObject(include, {}, 1);
		projection = { ...projection, ...includesObj };
	}
	if (exclude) {
		excludesObj = createProjectionObject(exclude, {}, 0);
		projection = { ...projection, ...excludesObj };
	}

	// Create the aggregation pipeline
	const pipeline = [
		{ $sort: sortObj },
		{ $skip: (_page <= 0 ? 0 : _page) * _limit },
		{ $limit: _limit },
	];

	// Add stage to calculate average rating
	if (includesObj?.rating || !excludesObj?.rating) {
		if (sortObj?.rating) {
			pipeline.unshift(
				{
					$lookup: {
						from: 'chefreviews',
						localField: '_id',
						foreignField: 'chefId',
						as: 'rating',
					},
				},
				{
					$addFields: {
						rating: {
							$round: [{ $avg: '$rating.rating' }, 2],
						},
					},
				}
			);
		} else if (includesObj?.rating) {
			pipeline.push(
				{
					$lookup: {
						from: 'chefreviews',
						localField: '_id',
						foreignField: 'chefId',
						as: 'rating',
					},
				},
				{
					$addFields: {
						rating: {
							$round: [{ $avg: '$rating.rating' }, 2],
						},
					},
				}
			);
		}
	}

	// Add projection stage if needed
	if (Object.keys(projection).length > 0) {
		pipeline.push({ $project: projection });
	}

	try {
		const result = await Chef.aggregate(pipeline);

		const totalRecipes = await Chef.countDocuments({});
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

async function getChefReviews(req, res) {
	const { chefId } = req.params;
	const {
		p,
		page = 0,
		l,
		limit = process.env.CHEF_REVIEWS_PER_PAGE,
		sort = 'updatedAt',
		order = 'desc',
	} = req.query;

	const _page = parseInt(p || page) - 1;
	const _limit = parseInt(l || limit) <= 0 ? 10 : parseInt(l || limit);

	// Create sort object based on query
	const sortObj = createSortObject(sort, order);

	try {
		const result = await ChefReview.find({ chefId })
			.sort(sortObj)
			.skip((_page <= 0 ? 0 : _page) * _limit)
			.limit(_limit);

		const totalReviews = await ChefReview.countDocuments({ chefId });
		const currPage = getCurrPage(
			_page <= 0 ? 1 : _page + 1,
			_limit,
			totalReviews
		);

		res.json({
			data: result,
			meta: {
				page: currPage,
				totalCount: totalReviews,
			},
		});
	} catch (err) {
		console.log(err);
		res.status(500).json(err);
	}
}

module.exports = { getChef, getChefs, getChefReviews };
