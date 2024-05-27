const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const Consult = require('../models/Consult');

async function createConsultDoc(req, res) {
	const { role, pkg, userId } = req.user || {};

	// Check if the user is 'student' and has 'pro' package
	if (role !== 'student' && pkg !== 'pro') {
		res.status(401).json({
			message: 'Only pro students can book consultations.',
		});
		return;
	}

	const { username, userEmail, chefId, chefName, date, startTime, endTime } =
		req.body || {};

	try {
		const doc = await Consult.create({
			userId: new ObjectId(userId),
			username,
			userEmail,
			chefId: new ObjectId(chefId),
			chefName,
			date,
			startTime,
			endTime,
			status: 'pending',
		});

		res.status(201).json({ msg: 'Successfully booked', data: doc });
	} catch (error) {
		res.status(404).send('Something went wrong. Kindly try again!');
	}
}

async function getConsults(req, res) {
	const { userId, role } = req.user;
	const { status } = req.query;

	let filter;
	// Filter by the role
	if (role === 'student') {
		filter = { userId: new ObjectId(userId) };
	} else if (role === 'chef') {
		filter = { chefId: new ObjectId(userId) };
	}
	// Filter by the status
	if (status) {
		const arr = status.split(',');
		filter.status = { $in: arr };
	}

	try {
		const docs = await Consult.find(filter);

		res.json({ msg: 'Successful', data: docs });
	} catch (error) {
		res.status(500).send('Something went wrong. Kindly try again!');
	}
}

module.exports = { createConsultDoc, getConsults };
