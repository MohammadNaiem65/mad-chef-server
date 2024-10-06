const { isValidObjectId } = require('mongoose');

/**
 * Validates if a given string is a valid MongoDB ObjectId.
 *
 * @param {string} id - The string to validate as a MongoDB ObjectId.
 * @param {object} res - The Express response object to send a 400 error if the ID is invalid.
 * @returns {boolean} - Returns true if the ID is valid, false otherwise.
 */
function validateMongoDBId(id, res) {
    if (!isValidObjectId(id)) {
        // Send a 400 response indicating the ID is invalid
        res.status(400).json({ message: 'Invalid MongoDB ID provided.' });
        return false; // Indicate that the ID is invalid
    }
    return true; // Indicate that the ID is valid
}

module.exports = validateMongoDBId;
