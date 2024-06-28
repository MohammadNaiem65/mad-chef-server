const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

const Consult = require('../models/Consult');
const validateMongoDBId = require('../utility/validateMongoDBId');

async function getConsults(req, res) {
	const { userId, role } = req.user;
	const { status, date } = req.query;

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

	// Directly parse the date string into an object
	const parsedDate = date ? JSON.parse(date) : null;

	// Filter by the date
	if (parsedDate?.startTime && parsedDate?.endTime) {
		const startTime = new Date(parsedDate.startTime).toISOString();
		const endTime = new Date(parsedDate.endTime).toISOString();
		filter.date = {
			$gte: startTime,
			$lt: endTime,
		};
	} else if (parsedDate && (!parsedDate?.startTime || !parsedDate?.endTime)) {
		return res.status(400).send({
			msg: 'Date is invalid. Please provide startTime and endTime.',
		});
	}

	try {
		const docs = await Consult.find(filter).sort({ date: 1 });

		res.json({ msg: 'Successful', data: docs });
	} catch (err) {
		console.log(err);
		res.status(500).send({
			msg: err.message || 'Something went wrong. Kindly try again!',
			data: err,
		});
	}
}

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
			date: new Date(date).toISOString(),
			startTime,
			endTime,
			status: 'pending',
		});

		res.status(201).json({ msg: 'Successfully booked', data: doc });
	} catch (err) {
		res.status(500).send({
			msg: err?.message || 'Something went wrong. Kindly try again!',
			data: err,
		});
	}
}

async function cancelConsultDoc(req, res) {
	const { consultId } = req.params;

	// Validate consultId of Consult document
	if (!validateMongoDBId(consultId, res)) {
		return;
	}

	try {
		const doc = await Consult.updateOne(
			{ _id: new ObjectId(consultId) },
			{ $set: { status: 'cancelled' } }
		);

		res.json({ msg: 'Successful', data: doc });
	} catch (err) {
		res.status(500).json({
			msg: err?.message || 'Something went wrong. Kindly try again!',
			data: err,
		});
	}
}

async function manageConsultStatusUpdates(req, res) {
	const { consultId } = req.params;
	const { status } = req.body;

	try {
		const result = await Consult.updateOne(
			{ _id: new ObjectId(consultId) },
			{ status: status }
		);

		res.json({ msg: 'Successful', data: result });
	} catch (err) {
		res.status(500).json({
			msg: err?.message || 'Something went wrong. Kindly try again!',
			data: err,
		});
	}
}

async function deleteConsultDoc(req, res) {
	const { consultId } = req.params;

	// Validate consultId of Consult document
	if (!validateMongoDBId(consultId, res)) {
		return;
	}

	try {
		const result = await Consult.deleteOne({
			_id: new ObjectId(consultId),
		});

		res.json({ msg: 'Successful', data: result });
	} catch (err) {
		res.status(500).json({
			msg: err?.message || 'Something went wrong. Kindly try again!',
			data: err,
		});
	}
}

module.exports = {
	getConsults,
	createConsultDoc,
	cancelConsultDoc,
	manageConsultStatusUpdates,
	deleteConsultDoc,
};
