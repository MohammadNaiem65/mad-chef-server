const { default: mongoose } = require('mongoose');
const { ObjectId } = mongoose.Types;

const getCurrPage = require('../utility/getCurrPage');
const createProjectionObject = require('../utility/createProjectionObject');
const Recipe = require('../models/Recipe');
const Rating = require('../models/Rating');

async function getRecipe(req, res) {
	const { recipeId } = req.params;

	if (!recipeId) {
		return res
			.status(400)
			.json({ message: 'An ID is required to get a recipe.' });
	}

	try {
		const recipe = await Recipe.findById(recipeId);
		const rating = await Rating.aggregate([
			{
				$match: {
					recipeId: new ObjectId(recipeId),
				},
			},
			{
				$group: {
					_id: '$recipeId',
					rating: {
						$avg: '$rating',
					},
					totalCount: {
						$sum: 1,
					},
				},
			},
		]);

		if (recipe?._id) {
			const result = {
				...recipe?._doc,
				rating: rating?.length
					? Number.parseFloat(rating[0]?.rating.toFixed(1))
					: null,
				totalRating: rating?.length ? rating[0]?.totalCount : null,
			};

			res.json(result);
		} else {
			res.status(404).send('Something went wrong. Kindly try again!');
		}
	} catch (err) {
		console.log(err);
		res.status(500).json(err);
	}
}

async function postRecipe(req, res) {
	const { userId, role } = req.user;
	const { title, ingredients, method, img, author } = req.body;

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

async function getRecipes(req, res) {
	const {
		p,
		page = 0,
		l,
		chef_id = '',
		limit = process.env.RECIPES_PER_PAGE,
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
						from: 'ratings',
						localField: '_id',
						foreignField: 'recipeId',
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
						from: 'ratings',
						localField: '_id',
						foreignField: 'recipeId',
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

	// add stage to match chef id if given
	if (chef_id) {
		pipeline.unshift({
			$match: {
				author: new ObjectId(chef_id),
			},
		});
	}

	// add projection stage if needed
	if (Object.keys(projection).length > 0) {
		pipeline.push({ $project: projection });
	}

	try {
		const result = await Recipe.aggregate(pipeline);

		const totalRecipes = await Recipe.countDocuments({
			author: new ObjectId(chef_id),
		});
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

module.exports = { getRecipe, postRecipe, getRecipes };
