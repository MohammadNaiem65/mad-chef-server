const Chef = require('../models/Chef');

async function getChef(req, res) {
	const { chefId } = req.params;

	if (!chefId) {
		return res.status(400).json({ message: 'Provide valid chef id.' });
	}

	const result = await Chef.findById(chefId);
	res.json({ data: result });
}

async function getChefs(req, res) {
	const { p, page = 0, l, limit = 10 } = req.query;

	const _page = parseInt(p || page) - 1;
	const _limit = parseInt(l || limit);

	try {
		const result = await Chef.find()
			.sort({ rating: 'desc' })
			.skip((_page > 0 ? _page : 0) * _limit)
			.limit(_limit);

		const totalChefs = await Chef.countDocuments({});

		res.json({ data: result, meta: { totalCount: totalChefs } });
	} catch (error) {
		console.log(error);
	}
}

module.exports = { getChef, getChefs };
