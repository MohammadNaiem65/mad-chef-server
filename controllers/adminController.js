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

        res.status(200).json({ message: 'Successful', data: admin });
    } catch (error) {
        res.status(500);
    }
}

async function updateAdminData(req, res) {
    const { userId } = req.user;
    const data = req.body;

    if (!data) {
        return res.status(400).json({ message: 'No payload found.' });
    }

    try {
        const result = await Admin.updateOne({ _id: userId }, data);

        res.json({
            data: result,
            message: 'Successfully updated data',
        });
    } catch (error) {
        console.log(error);
        res.json(error);
    }
}

module.exports = { getAdminData, updateAdminData };
