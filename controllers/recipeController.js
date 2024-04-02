const { default: mongoose } = require('mongoose');
const { ObjectId } = mongoose.Types;
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
				rating: rating?.length ? rating[0]?.rating : null,
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

module.exports = { getRecipe, postRecipe };
