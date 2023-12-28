// external imports
const { getAuth } = require('firebase-admin/auth');
const jwt = require('jsonwebtoken');

// internal imports
const User = require('./../models/User');
const RefreshToken = require('./../models/RefreshToken');

async function authenticate(req, res) {
	// get firebase idToken as userToken
	const authToken = req.headers.authorization;
	const userToken = authToken.split(' ')[1];

	// if token is unavailable - send error
	if (!userToken) return res.sendStatus(401);

	// get a auth instance
	const auth = getAuth();

	try {
		// verify token
		const decodedToken = await auth.verifyIdToken(userToken);
		const { name, picture, email, email_verified, uid } = decodedToken;

		// store user data
		const userData = {
			userEmail: email,
			userId: decodedToken?._id,
			role: decodedToken?.role,
		};

		// if user doesn't exist - save user data to database
		if (!decodedToken?._id || !decodedToken?.role) {
			// save user to database
			await User.init();

			const newUser = await User.create({
				name,
				email,
				emailVerified: email_verified,
				img: picture,
			});

			// store user id and role
			userData.userId = newUser._id;
			userData.role = newUser.role;

			// save user id and role to firebase
			await auth.setCustomUserClaims(uid, {
				_id: newUser._id,
				role: newUser.role,
			});
		}

		// if it's only a registration request
		if (req.body?.reqType == 'registration') {
			return res.status(201).json({ msg: 'Registration successful' });
		}

		// generate access and refresh tokens
		const accessToken = jwt.sign(
			userData,
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1h' }
		);

		const refreshToken = jwt.sign(
			userData,
			process.env.REFRESH_TOKEN_SECRET,
			{ expiresIn: '30 days' }
		);

		// save refresh token to database and delete one if an exists for the user
		await RefreshToken.deleteOne({ userId: userData.userId });
		await RefreshToken.create({
			userId: userData.userId,
			token: refreshToken,
		});

		// send response to user
		res.cookie(process.env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
			maxAge: 30 * 24 * 60 * 60 * 1000,
			httpOnly: true,
			signed: true,
			secure: true,
		});
		res.json({ msg: 'Successful', data: { user: userData, accessToken } });
	} catch (err) {
		// if the firebase idToken is expired
		if (err.code === 'auth/id-token-expired') {
			res.status(403).json({
				data: 'Firebase auth token expired',
			});
		}

		// If user validation failed
		else if (err._message === 'User validation failed') {
			const { uid } = await auth.verifyIdToken(userToken);

			// delete user from firebase
			await auth.deleteUser(uid);
			res.status(400).json({ data: 'User validation failed' });
		}

		// if any duplicate data found in the database
		else if (err.code === 11000) {
			res.status(409).json({
				data: `A user with the ${
					Object.keys(err.keyValue)[0]
				} already exists`,
			});
		}

		// otherwise
		else {
			res.sendStatus(500);
		}
	}
}

module.exports = { authenticate };
