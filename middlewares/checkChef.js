/**
 * Middleware function to check if the user is a chef.
 * If the user is a chef, calls the next middleware function.
 * If the user is not a chef, a 403 Forbidden response will be sent with a message.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function in the stack
 *
 * @returns {void}
 */
function checkChef(req, res, next) {
	const { role } = req?.user;

	if (role === 'chef') {
		next();
	} else {
		res.status(403).json({ message: 'Only chefs access this route' });
	}
}

module.exports = checkChef;
