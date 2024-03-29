const Chef = require('../models/Chef');
const getCurrPage = require('../utility/getCurrPage');

async function getChef(req, res) {
	const { chefId } = req.params;

	if (!chefId) {
		return res.status(400).json({ message: 'Provide valid chef id.' });
	}

	const result = await Chef.findById(chefId);
	res.json({ data: result });
}

async function getChefs(req, res) {
	const { p, page = 0, l, limit = process.env.CHEFS_PER_PAGE } = req.query;

	const _page = parseInt(p || page) - 1;
	const _limit = parseInt(l || limit) <= 0 ? 1 : parseInt(l || limit);

	try {
		const result = await Chef.find()
			.sort({ rating: 'desc' })
			.skip((_page <= 0 ? 0 : _page) * _limit)
			.limit(_limit);

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
