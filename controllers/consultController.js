const Consult = require('../models/Consult');

async function createConsultDoc(req, res) {
	const { role, pkg, userId } = req.user || {};
	const { username, userEmail, chefId, chefName, date, startTime, endTime } =
		req.body || {};

	try {
		if (role === 'student' && pkg === 'pro') {
			const doc = await Consult.create({
				userId,
				username,
				userEmail,
				chefId,
				chefName,
				date,
				startTime,
				endTime,
			});

			res.json({ message: 'Successfully booked', data: doc });
		} else {
			res.status(401).json({
				message: 'Only pro students can book consultations.',
			});
		}
	} catch (error) {
		console.log(error);
	}
}

module.exports = { createConsultDoc };
