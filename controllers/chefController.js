const Chef = require('../models/Chef');

async function getChef(req, res) {
	const { chefId } = req.params;

	if (!chefId) {
		return res.status(400).json({ message: 'Provide valid chef id.' });
	}

	const result = await Chef.findById(chefId);
	res.json({ data: result });
}

module.exports = { getChef };
