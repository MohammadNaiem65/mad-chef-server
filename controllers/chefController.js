const { default: mongoose } = require('mongoose');
const { ObjectId } = mongoose.Types;

const getCurrPage = require('../utility/getCurrPage');

const Chef = require('../models/Chef');
const ChefReview = require('../models/ChefReview');
const createProjectionObject = require('../utility/createProjectionObject');

async function getChef(req, res) {
	const { chefId } = req.params;

	if (!chefId) {
		return res.status(400).json({ message: 'Provide valid chef id.' });
	}

	try {
		const chef = await Chef.findById(chefId);

		const rating = await ChefReview.aggregate([
			{
				$match: {
					chefId: new ObjectId(chefId),
				},
			},
			{
				$group: {
					_id: '$chefId',
					rating: {
						$avg: '$rating',
					},
					totalCount: {
						$sum: 1,
					},
				},
			},
		]);

		if (chef?._id) {
			const result = {
				...chef?._doc,
				rating: rating?.length
					? Number.parseFloat(rating[0]?.rating.toFixed(1))
					: null,
				totalRating: rating?.length ? rating[0]?.totalCount : null,
			};

			res.json({ message: 'Successful', data: result });
		} else {
			res.status(404).send('Something went wrong. Kindly try again!');
		}
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
	const _limit = parseInt(l || limit) <= 0 ? 1 : parseInt(l || limit);

	// Initialize pipeline options as an empty object
	let projection = {};
	let includesObj = {};
	let excludesObj = {};
	const sortObj = {};

	// set sort order field based on query
	sort.split(',').map((el) => (sortObj[el] = order === 'desc' ? -1 : 1));

	// Only create projection objects if include or exclude is not an empty string
	if (include) {
		includesObj = createProjectionObject(include, {}, 1);
		projection = { ...projection, ...includesObj };
	}
	if (exclude) {
		excludesObj = createProjectionObject(exclude, {}, 0);
		projection = { ...projection, ...excludesObj };
	}

	// create the aggregation pipeline
	const pipeline = [
		{ $sort: sortObj },
		{ $skip: (_page <= 0 ? 0 : _page) * _limit },
		{ $limit: _limit },
	];

	// add stage to calculate average rating
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
		} else {
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

	// add projection stage if needed
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
	} catch (error) {
		console.log(error);
	}
}

module.exports = { getChef, getChefs };
