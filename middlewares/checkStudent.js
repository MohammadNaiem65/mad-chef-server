/**
 * Middleware function to check if the user is a student.
 * If the user is a student, the request will be passed to the next middleware.
 * If the user is not a student, a 403 Forbidden response will be sent with a message.
 *
 * @param {Object} req - The request object
 * @param {Object} res - The response object
 * @param {Function} next - The next middleware function in the stack
 *
 * @returns {void}
 */
function checkStudent(req, res, next) {
	const { role } = req?.user;

	if (role === 'student') {
		next();
	} else {
		res.status(403).json({ message: 'Only students access this route' });
	}
}

module.exports = checkStudent;
