const { isValidObjectId } = require('mongoose');

/**
 * Validates if a given string is a valid MongoDB ObjectId.
 *
 * @param {string} id - The string to validate as a MongoDB ObjectId.
 * @param {object} res - The Express response object to send a 400 error if the ID is invalid.
 * @returns {void} - This function does not return a value. Instead, it sends a 400 error response if the ID is invalid.
 */
function validateMongoDBId(id, res) {
	if (!isValidObjectId(id)) {
		// Send a 400 response indicating the ID is invalid
		return res.status(400).json({ error: 'Invalid MongoDB ID provided.' });
	}
}

module.exports = validateMongoDBId;
