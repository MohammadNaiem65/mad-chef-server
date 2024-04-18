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

			res.json({
				message: 'Successful',
				data: result,
			});
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

async function searchRecipes(req, res) {
	const {
		p,
		page = 0,
		l,
		limit = process.env.RECIPES_PER_PAGE,
		data_filter,
		sort = 'updatedAt',
		order = 'desc',
		include = '',
		exclude = '',
	} = req.query;

	// parse the data_filter query string, _page and _limit
	const parsedDataFilter =
		data_filter && JSON.parse(decodeURIComponent(data_filter));
	const _page = parseInt(p || page) - 1;
	const _limit = parseInt(l || limit) <= 0 ? 1 : parseInt(l || limit);

	// Initialize pipeline options as an empty object
	let projection = {};
	let includesObj = {};
	let excludesObj = {};
	const sortObj = {};

	// Set sort order field based on query
	sort.split(',').map((el) => (sortObj[el] = order === 'desc' ? -1 : 1));

	// Only create projection objects if include or exclude is not an empty string
	if (exclude && !include) {
		excludesObj = createProjectionObject(exclude, {}, 0);
		projection = { ...projection, ...excludesObj };
	}
	if (include && !exclude) {
		includesObj = createProjectionObject(include, {}, 1);
		projection = { ...projection, ...includesObj };
	}

	// ! Create the initial aggregation pipeline
	let pipeline = [
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

	// Add projection stage if needed
	if (Object.keys(projection).length > 0) {
		// Check if parsedDataFilter?.searchQuery exists and the first key's value is 0
		if (
			parsedDataFilter?.searchQuery &&
			Object.values(projection)[0] === 0
		) {
			pipeline.push({ $project: { chef_info: 0, ...projection } });
		} else {
			pipeline.push({ $project: projection });
		}
	}

	// ! Add filter stages to Filter documents
	let filterPipeline = [];

	// parsedDataFilter = {searchQuery: 'string', chefId: _id, region: 'string', uploadDate: 'today' || 'thisMonth' || 'thisYear'}
	if (parsedDataFilter) {
		const { searchQuery, chefId, region, uploadDate } =
			parsedDataFilter || {};
		const multistageFilters = [];
		const singleStageFilters = [];

		// Search with recipe title or chef name
		if (searchQuery) {
			multistageFilters.push(
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
							{
								title: {
									$regex: parsedDataFilter.searchQuery,
									$options: 'i',
								},
							},
							{
								'chef_info.name': {
									$regex: parsedDataFilter.searchQuery,
									$options: 'i',
								},
							},
						],
					},
				}
			);
		}

		// Filter with chef Id
		if (chefId) {
			singleStageFilters.push({
				$eq: ['$author', new ObjectId(chefId)],
			});
		}

		// Filter with upload date
		if (uploadDate && typeof uploadDate === 'string') {
			const date = new Date();

			// Add stage to filter by upload date
			switch (uploadDate.toLowerCase()) {
				case 'today': {
					const year = date.getFullYear();
					const month = `0${date.getMonth() + 1}`.slice(-2); // Ensures two digits for month
					const day = `0${date.getDate()}`.slice(-2); // Ensures two digits for day

					const formattedDate = `${year}-${month}-${day}`;
					singleStageFilters.push({
						$eq: [
							{
								$dateToString: {
									format: '%Y-%m-%d',
									date: '$createdAt',
								},
							},
							formattedDate,
						],
					});
					break;
				}

				case 'this month':
					const month = date.getMonth() + 1;

					singleStageFilters.push({
						$eq: [{ $month: '$createdAt' }, month],
					});
					break;

				case 'this year':
					const year = date.getFullYear();

					singleStageFilters.push({
						$eq: [{ $year: '$createdAt' }, year],
					});
					break;

				default:
					break;
			}
		}

		// Filter by region
		if (region) {
			singleStageFilters.push({
				$eq: ['$region', region],
			});
		}

		// Evaluate the final filterPipeline
		if (singleStageFilters.length > 0) {
			filterPipeline = [
				...multistageFilters,
				{
					$match: {
						$expr: {
							$and: singleStageFilters,
						},
					},
				},
			];
		} else {
			filterPipeline = [...multistageFilters];
		}
	}

	try {
		// Search recipes with a combination of filter and main pipeline
		const recipes = await Recipe.aggregate([
			...filterPipeline,
			...pipeline,
		]);

		// Count total number of documents match the filter	pipeline
		const totalRecipes = await Recipe.aggregate([
			...filterPipeline,
			{
				$count: 'totalRecipes',
			},
		]);

		const currPage = getCurrPage(
			_page <= 0 ? 1 : _page + 1,
			_limit,
			totalRecipes[0]?.totalRecipes
		);

		res.json({
			data: recipes,
			meta: {
				page: currPage,
				totalCount:
					totalRecipes?.length > 0 ? totalRecipes[0].totalRecipes : 0,
			},
		});
	} catch (error) {
		console.log(error);
		res.json(error);
	}
}

async function getRecipeRatings(req, res) {
	const {
		p,
		page = 0,
		l,
		limit = process.env.RECIPES_PER_PAGE,
		data_filter,
		sort = 'rating',
		order = 'desc',
		include = '',
		exclude = '',
	} = req.query;

	// parse the data_filter query string, _page and _limit
	const parsedDataFilter =
		data_filter && JSON.parse(decodeURIComponent(data_filter));
	const _page = parseInt(p || page) - 1;
	const _limit = parseInt(l || limit) <= 0 ? 1 : parseInt(l || limit);

	// Initialize pipeline options as an empty object
	let projection = {};
	let includesObj = {};
	let excludesObj = {};
	const sortObj = {};

	// Set sort order field based on query
	sort.split(',').map((el) => (sortObj[el] = order === 'desc' ? -1 : 1));

	// Only create projection objects if include or exclude is not an empty string
	if (exclude && !include) {
		excludesObj = createProjectionObject(exclude, {}, 0);
		projection = { ...projection, ...excludesObj };
	}
	if (include && !exclude) {
		includesObj = createProjectionObject(include, {}, 1);
		projection = { ...projection, ...includesObj };
	}

	// ! Create the initial aggregation pipeline
	let pipeline = [
		{ $sort: sortObj },
		{ $skip: (_page <= 0 ? 0 : _page) * _limit },
		{ $limit: _limit },
	];

	// Match the specified filters
	if (Object.keys(parsedDataFilter).length > 0) {
		if (parsedDataFilter?.recipeId) {
			pipeline.unshift({
				$match: new ObjectId(parsedDataFilter?.recipeId),
			});
		}
	}

	// Include extra data if include has been specified
	if (includesObj) {
		const addFields = {};
		if (includesObj?.username) {
			addFields.username = {
				$arrayElemAt: ['$userDetails.name', 0],
			};
		}
		if (includesObj?.userImg) {
			addFields.userImg = {
				$arrayElemAt: ['$userDetails.img', 0],
			};
		}

		if (Object.keys(addFields).length > 0) {
			pipeline.push(
				{
					$lookup: {
						from: 'users',
						localField: 'userId',
						foreignField: '_id',
						as: 'userDetails',
					},
				},
				{
					$addFields: addFields,
				},
				{
					$project: {
						userDetails: 0,
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
		const ratings = await Rating.aggregate(pipeline);

		// Aggregate the total rating count the the filter
		const totalRatings = await Rating.aggregate([
			{ $sort: sortObj },
			{
				$count: 'totalRatings',
			},
		]);

		// Calculate current page count of total rating count
		const currPage = getCurrPage(
			_page <= 0 ? 1 : _page + 1,
			_limit,
			totalRatings[0]?.totalRatings
		);

		res.json({
			data: ratings,
			meta: {
				page: currPage,
				totalCount:
					totalRatings?.length > 0 ? totalRatings[0].totalRatings : 0,
			},
		});
	} catch (error) {
		console.log(error);
		res.json(error);
	}
}

module.exports = { getRecipe, postRecipe, searchRecipes, getRecipeRatings };
