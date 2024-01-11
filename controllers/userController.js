const mongoose = require('mongoose');

const User = require('../models/User');

async function getUser(req, res) {
	const id = req.params.id;

	if (!mongoose.Types.ObjectId.isValid(id)) {
		res.status(400).json({
			error: {
				msg: 'Invalid id provided',
			},
		});
	} else {
		const user = await User.findOne({ _id: id });

		res.json({ msg: 'Successful', data: user });
	}
}

module.exports = { getUser };
