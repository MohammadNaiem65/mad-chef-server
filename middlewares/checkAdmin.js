/**
 * Middleware function to check if the user is a Admin.
 * If the user is a admin, calls the next middleware function.
 * If the user is not a admin, a 403 Forbidden response will be sent with a message.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function in the stack
 *
 * @returns {void}
 */
function checkAdmin(req, res, next) {
	const { role } = req?.user;

	if (role === 'admin') {
		next();
	} else {
		res.status(403).json({ message: 'Only admins can access this route' });
	}
}

module.exports = checkAdmin;
