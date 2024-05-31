const jwt = require('jsonwebtoken');

/**
 * @description Generates a JWT token using the provided data, secret key, and options.
 *
 * @param {Object} data - An object containing the data to be encoded in the token.
 * @param {string} secret - The secret key used for signing the token.
 * @param {Object} [options={}] - Additional options for the JWT token.
 * @returns {string} - The generated JWT token.
 */
function generateToken(data, secret, options = {}) {
	return jwt.sign(data, secret, options);
}

module.exports = generateToken;
