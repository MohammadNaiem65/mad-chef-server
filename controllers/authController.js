// external imports
const { getAuth } = require('firebase-admin/auth');
const jwt = require('jsonwebtoken');

// internal imports
const User = require('./../models/User');
const RefreshToken = require('./../models/RefreshToken');
const generateJwtToken = require('./../utility/generateJwtToken');

async function authenticate(req, res) {
	// get firebase idToken as userToken
	const authToken = req.headers.authorization;
	const userToken = authToken.split(' ')[1];

	// if token is unavailable - send error
	if (!userToken) return res.sendStatus(401);

	// create an auth instance
	const auth = getAuth();

	try {
		// verify token
		const decodedToken = await auth.verifyIdToken(userToken);
		const { name, picture, email, email_verified, uid } = decodedToken;

		// store user data
		const userData = {
			userEmail: email,
			userId: decodedToken?._id,
			firebaseId: uid,
			emailVerified: email_verified,
			role: decodedToken?.role,
			pkg: decodedToken?.pkg,
		};

		// if user doesn't exist - save user data to database (for registration)
		if (!decodedToken?._id || !decodedToken?.role) {
			// save user to database
			await User.init();

			const newUser = await User.create({
				name,
				email,
				emailVerified: email_verified,
				img: picture,
			});

			// store user id role and and package pkg
			userData.userId = newUser._id;
			userData.role = newUser.role;
			userData.pkg = newUser.pkg;

			// save user id and role to firebase
			await auth.setCustomUserClaims(uid, {
				_id: newUser._id,
				role: newUser.role,
				pkg: newUser.pkg,
			});
		}

		// if it's only a registration request - send a successful response
		if (req.body?.reqType == 'registration') {
			return res.status(201).json({ msg: 'Registration successful' });
		}

		// for login purpose - send access and refresh token
		// generate access and refresh tokens
		const accessToken = generateJwtToken(
			userData,
			process.env.ACCESS_TOKEN_SECRET,
			{ expiresIn: '1h' }
		);

		const refreshToken = generateJwtToken(
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
			secure: process.env.NODE_ENV !== 'development',
			sameSite: 'None',
		}).json({ msg: 'Successful', data: { user: userData, accessToken } });
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

async function reAuthenticate(req, res) {
	const cookies = req.cookies;

	// if cookie not found - send unauthorized response
	if (!cookies || !cookies?.jwt) return res.sendStatus(401);

	const userRefreshToken = cookies?.jwt;

	const storedToken = await RefreshToken.findOne({ token: userRefreshToken });

	// if token not found - send forbidden response
	if (!storedToken) {
		res.clearCookie('jwt');
		return res.status(403).json({ data: 'Token does not found.' });
	}

	// verify the token
	jwt.verify(
		userRefreshToken,
		process.env.REFRESH_TOKEN_SECRET,
		async (err, decodedToken) => {
			if (err && err.message === 'jwt expired') {
				await RefreshToken.deleteOne({ _id: storedToken._id });
				res.clearCookie('jwt');
				return res.sendStatus(403);
			} else {
				// store user data
				const userData = {
					userEmail: decodedToken.userEmail,
					userId: decodedToken.userId,
					firebaseId: decodedToken.firebaseId,
					emailVerified: decodedToken.emailVerified,
					role: decodedToken.role,
					pkg: decodedToken.pkg,
				};

				// generate access and refresh tokens
				const accessToken = generateJwtToken(
					userData,
					process.env.ACCESS_TOKEN_SECRET,
					{ expiresIn: '1h' }
				);

				const refreshToken = generateJwtToken(
					userData,
					process.env.REFRESH_TOKEN_SECRET,
					{ expiresIn: '30 days' }
				);

				// save refresh token to database and delete one if an exists for the user
				await RefreshToken.deleteOne({ _id: storedToken._id });
				await RefreshToken.create({
					userId: userData.userId,
					token: refreshToken,
				});

				// send response to user
				res.cookie(
					process.env.REFRESH_TOKEN_COOKIE_NAME,
					refreshToken,
					{
						maxAge: 30 * 24 * 60 * 60 * 1000,
						httpOnly: true,
						secure: process.env.NODE_ENV !== 'development',
						sameSite: 'None',
					}
				).json({
					msg: 'Successful',
					data: { user: userData, accessToken },
				});
			}
		}
	);
}

async function logout(req, res) {
	const userId = req.params.userId;

	try {
		await RefreshToken.deleteOne({ userId });
		res.clearCookie('jwt');
		res.json({ msg: 'Logout successful' });
	} catch (error) {
		res.status(500).json({ msg: 'Something went wrong. Try again later' });
	}
}

module.exports = { authenticate, reAuthenticate, logout };
