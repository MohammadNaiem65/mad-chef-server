function checkChef(req, res, next) {
	const { role } = req.user;

	if (role === 'chef') {
		next();
	} else {
		res.status(403).json({ message: 'You are not a chef' });
	}
}

module.exports = checkChef;
