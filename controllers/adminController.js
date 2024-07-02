const { isValidObjectId } = require('mongoose');
const Admin = require('../models/Admin');

async function getAdminData(req, res) {
	const { adminId } = req.params;

	// Validate the admin ID
	if (!adminId || !isValidObjectId(adminId)) {
		return res.status(400).json({ message: 'Provide valid admin ID' });
	}

	try {
		const admin = await Admin.findById(adminId);

		if (!admin) {
			return res.status(404).json({ message: 'Admin not found' });
		}

		res.status(200).json({ msg: 'Successful', data: admin });
	} catch (error) {
		console.log(error);
	}
}

module.exports = { getAdminData };
