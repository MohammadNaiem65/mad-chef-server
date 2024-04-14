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

async function searchRecipes(req, res) {
	const {
		p,
		page = 0,
		l,
		limit = process.env.RECIPES_PER_PAGE,
		data_filter,
		chef_id = '',
		sort = 'updatedAt',
		order = 'desc',
		include = '',
		exclude = '',
	} = req.query;

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
	if (exclude) {
		excludesObj = createProjectionObject(exclude, {}, 0);
		projection = { ...projection, ...excludesObj };
	}
	if (include) {
		includesObj = createProjectionObject(include, {}, 1);
		projection = { ...projection, ...includesObj };
	}

	// ! Create the initial aggregation pipeline
	let pipeline = [
		{ $sort: sortObj },
		{ $skip: (_page <= 0 ? 0 : _page) * _limit },
		{ $limit: _limit },
	];
	const filterPipeline = [];

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
		if (parsedDataFilter) {
			pipeline.push({ $project: { chef_info: 0, ...projection } });
		}
		pipeline.push({ $project: projection });
	}
	if (parsedDataFilter && Object.keys(projection).length === 0) {
		pipeline.push({ $project: { chef_info: 0 } });
	}

	// ! Add stages to Filter documents
	if (parsedDataFilter) {
		// Search with recipe title or chef name
		if (parsedDataFilter?.searchQuery) {
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

		// Filter with upload date and region and chef_id
		if (parsedDataFilter?.uploadDate) {
			let completeFilterStage;
			let filterByDateStage;
			const date = new Date();

			// Add stage to filter by upload date
			switch (parsedDataFilter.uploadDate) {
				case 'today': {
					const year = date.getFullYear();
					const month = `0${date.getMonth() + 1}`.slice(-2); // Ensures two digits for month
					const day = `0${date.getDate()}`.slice(-2); // Ensures two digits for day

					const formattedDate = `${year}-${month}-${day}`;
					filterByDateStage = {
						$eq: [
							{
								$dateToString: {
									format: '%Y-%m-%d',
									date: '$createdAt',
								},
							},
							formattedDate,
						],
					};
					break;
				}

				case 'this month':
					const month = date.getMonth() + 1;

					filterByDateStage = {
						$eq: [{ $month: '$createdAt' }, month],
					};
					break;

				case 'this year':
					const year = date.getFullYear();

					filterByDateStage = {
						$eq: [{ $year: '$createdAt' }, year],
					};
					break;

				default:
					break;
			}

			// Create complete filter stage with region if region exists in the data_filter
			if (parsedDataFilter?.region) {
				completeFilterStage = {
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$region', parsedDataFilter.region] },
								filterByDateStage,
							],
						},
					},
				};
			} else if (chef_id) {
				// Create complete filter stage with chef_id if region exists in the data_filter
				completeFilterStage = {
					$match: {
						$expr: {
							$and: [
								{ $eq: ['$author', new ObjectId(chef_id)] },
								filterByDateStage,
							],
						},
					},
				};
			} else {
				// Create complete filter stage without region
				completeFilterStage = {
					$match: {
						$expr: filterByDateStage,
					},
				};
			}

			filterPipeline.push(completeFilterStage);
		}

		// Filter with only region
		if (
			parsedDataFilter?.region &&
			!chef_id &&
			parsedDataFilter?.uploadDate === undefined
		) {
			filterPipeline.push({
				$match: {
					region: parsedDataFilter.region,
				},
			});
		}

		// Filter with only chef_id
		if (
			chef_id &&
			parsedDataFilter?.region === undefined &&
			parsedDataFilter?.uploadDate === undefined
		) {
			filterPipeline.push({
				$match: {
					author: new ObjectId(chef_id),
				},
			});
		}
	}

	// Filter with only chef_id
	if (chef_id && !parsedDataFilter) {
		filterPipeline.push({
			$match: {
				author: new ObjectId(chef_id),
			},
		});
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
			totalRecipes[0].totalRecipes
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

module.exports = { getRecipe, postRecipe, searchRecipes };
