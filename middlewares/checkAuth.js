const jwt = require('jsonwebtoken');

const checkAuth = (req, res, next) => {
	const authToken = req.headers?.authorization;
	const token = authToken && authToken.split(' ')[1];

	// send unauthorized response
	if (!token) return res.sendStatus(401);

	// verify the token
	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
		if (!user) {
			return res.status(403).json({ data: err.message });
		}

		// save user in request body
		req.user = user;
		next();
	});
};

module.exports = checkAuth;
