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
        filter = { studentId: new ObjectId(userId) };
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
            message: 'Date is invalid. Please provide startTime and endTime.',
        });
    }

    try {
        const docs = await Consult.find(filter).sort({ date: 1 });

        res.json({ message: 'Successful', data: docs });
    } catch (err) {
        console.log(err);
        res.status(500).send({
            message: err.message || 'Something went wrong. Kindly try again!',
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
            studentId: new ObjectId(userId),
            username,
            userEmail,
            chefId: new ObjectId(chefId),
            chefName,
            date: new Date(date).toISOString(),
            startTime,
            endTime,
            status: 'pending',
        });

        res.status(201).json({ message: 'Successfully booked', data: doc });
    } catch (err) {
        res.status(500).send({
            message: err?.message || 'Something went wrong. Kindly try again!',
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
        // Check if the document exists and fetch it
        const existingConsult = await Consult.findById(consultId);
        if (!existingConsult) {
            return res
                .status(404)
                .json({ message: 'Consult document not found' });
        }

        // Update the document
        existingConsult.status = 'cancelled';

        // Save the updated document
        const updatedConsult = await existingConsult.save();

        res.json({
            message: 'Successfully cancelled the consultation',
            data: updatedConsult,
        });
    } catch (err) {
        res.status(500).json({
            message: err?.message || 'Something went wrong. Kindly try again!',
            data: err,
        });
    }
}

async function manageConsultStatusUpdates(req, res) {
    const { consultId } = req.params;
    const { status, link } = req.body;

    // Check if the status is provided
    if (!status) {
        return res.status(400).json({ message: 'Provide a valid status.' });
    }

    // Check if the status is 'accepted' and link is provided
    if (status === 'accepted' && (!link || typeof link !== 'string')) {
        return res.status(400).json({
            message: 'Link is required to accept the consultation request.',
        });
    }

    try {
        // Check if the document exists and fetch it
        const existingConsult = await Consult.findById(consultId);
        if (!existingConsult) {
            return res
                .status(404)
                .json({ message: 'Consult document not found' });
        }

        // Update the document
        existingConsult.status = status;
        if (link) {
            existingConsult.joinLink = link;
        }

        // Save the updated document
        const updatedConsult = await existingConsult.save();

        res.json({
            message: 'Successfully updated the status',
            data: updatedConsult,
        });
    } catch (err) {
        res.status(500).json({
            message: err?.message || 'Something went wrong. Kindly try again!',
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

        res.json({ message: 'Successfully deleted the consult', data: result });
    } catch (err) {
        res.status(500).json({
            message: err?.message || 'Something went wrong. Kindly try again!',
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
