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

	// Initialize projection as an empty object
	let projection = {};
	const sortObj = {};

	// Only create projection objects if include or exclude is not an empty string
	if (include) {
		const includesObj = createProjectionObject(include, {}, 1);
		projection = { ...projection, ...includesObj };
	}
	if (exclude) {
		const excludesObj = createProjectionObject(exclude, {}, 0);
		projection = { ...projection, ...excludesObj };
	}
	// set sort order field based on query
	sortObj[sort] = order;

	try {
		const result = await Chef.find()
			.sort(sortObj)
			.skip((_page <= 0 ? 0 : _page) * _limit)
			.limit(_limit)
			.select(projection);

		const totalChefs = await Chef.countDocuments({});
		const currPage = getCurrPage(
			_page <= 0 ? 1 : _page + 1,
			_limit,
			totalChefs
		);

		res.json({
			data: result,
			meta: {
				page: currPage,
				totalCount: totalChefs,
			},
		});
	} catch (error) {
		console.log(error);
	}
}

module.exports = { getChef, getChefs };
