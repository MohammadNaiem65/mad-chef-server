// external imports
const { getAuth } = require('firebase-admin/auth');
const { startSession } = require('mongoose');
const jwt = require('jsonwebtoken');

// internal imports
const Student = require('../models/Student');
const Chef = require('../models/Chef');
const Admin = require('../models/Admin');
const RefreshToken = require('./../models/RefreshToken');
const generateJwtToken = require('./../utility/generateJwtToken');

async function authenticate(req, res) {
    // Extract the Firebase ID token from the Authorization header
    const authToken = req.headers.authorization;
    const userToken = authToken?.split(' ')[1];

    // If token is unavailable, send 401 Unauthorized
    if (!userToken) {
        return res
            .status(401)
            .json({ message: 'No authentication token provided' });
    }

    const auth = getAuth();
    const session = await startSession();

    try {
        // Start a MongoDB transaction
        session.startTransaction();

        // Verify the Firebase token
        const decodedToken = await auth.verifyIdToken(userToken);
        const { uid, _id, name, email, email_verified, role, pkg, picture } =
            decodedToken;

        // Check if user exists in our database
        let user;
        if (role === 'student') {
            user = await Student.findById(_id).session(session);
        } else if (role === 'chef') {
            user = await Chef.findById(_id).session(session);
        } else if (role === 'admin') {
            user = await Admin.findById(_id).session(session);
        }

        // If the user doesn't exist thats a registration request
        if (!user && req.body?.reqType === 'registration') {
            user = await Student.create(
                [
                    {
                        name,
                        email,
                        emailVerified: email_verified,
                        img: picture,
                        role: 'student', // Default role
                        pkg: 'basic', // Default package
                    },
                ],
                { session }
            );

            user = user[0]; // Mongo returns an array for create operations within a session

            // Set custom claims in Firebase
            await auth.setCustomUserClaims(uid, {
                _id: user._id,
                role: user.role,
                pkg: user.pkg,
            });

            // Commit the transaction and send the response
            await session.commitTransaction();
            return res.status(201).json({ message: 'Registration successful' });
        } else if (!user && req.body?.reqType !== 'registration') {
            // Login request without user data - delete user data from firebase
            await auth.deleteUser(uid);
            return res
                .status(400)
                .json({ message: 'The user with the email does not exists' });
        }

        // Prepare user data object to generate token
        const userData = {
            userId: _id,
            role,
            firebaseId: uid,
            userEmail: email,
            emailVerified: email_verified,
        };

        // Add pkg field if exists
        if (pkg) {
            userData.pkg = pkg;
        }

        // Generate tokens for login
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

        // Update refresh token in database
        await RefreshToken.deleteOne({ userId: userData.userId }).session(
            session
        );
        await RefreshToken.create(
            [
                {
                    userId: userData.userId,
                    token: refreshToken,
                },
            ],
            { session }
        );

        // Commit the transaction
        await session.commitTransaction();

        // Send response with tokens
        res.cookie(process.env.REFRESH_TOKEN_COOKIE_NAME, refreshToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'None',
        }).json({
            message: 'Login successful',
            data: { user: userData, accessToken },
        });
    } catch (err) {
        // Abort the transaction on any error
        await session.abortTransaction();

        if (err.code === 'auth/id-token-expired') {
            res.status(403).json({ message: 'Firebase auth token expired' });
        } else if (err._message === 'User validation failed') {
            // Only attempt to delete the Firebase user if we successfully verified the token
            if (uid) {
                await auth.deleteUser(uid).catch(console.error);
            }
            res.status(400).json({ message: 'User validation failed' });
        } else if (err.code === 11000) {
            res.status(409).json({
                message: `A user with the ${
                    Object.keys(err.keyValue)[0]
                } already exists`,
            });
        } else {
            console.error('Authentication error:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    } finally {
        session.endSession();
    }
}

async function reAuthenticate(req, res) {
    const refreshToken = req.cookies?.[process.env.REFRESH_TOKEN_COOKIE_NAME];

    // If refresh token not found in cookies, send unauthorized response
    if (!refreshToken) {
        return res.status(401).json({ error: 'No refresh token provided' });
    }

    const session = await startSession();

    try {
        session.startTransaction();

        // Find the stored token in the database
        const storedToken = await RefreshToken.findOne({
            token: refreshToken,
        }).session(session);

        // If token not found in database, clear cookie and send forbidden response
        if (!storedToken) {
            res.clearCookie(process.env.REFRESH_TOKEN_COOKIE_NAME, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: 'None',
            });
            return res.status(403).json({ error: 'Invalid refresh token' });
        }

        // Verify the token
        const decodedToken = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        // Prepare user data
        const userData = {
            userEmail: decodedToken.userEmail,
            userId: decodedToken.userId,
            firebaseId: decodedToken.firebaseId,
            emailVerified: decodedToken.emailVerified,
            role: decodedToken.role,
            pkg: decodedToken.pkg,
        };

        // Generate new access and refresh tokens
        const newAccessToken = generateJwtToken(
            userData,
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: '1h' }
        );

        const newRefreshToken = generateJwtToken(
            userData,
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '30 days' }
        );

        // Update refresh token in database
        await RefreshToken.deleteOne({ _id: storedToken._id }).session(session);
        await RefreshToken.create(
            [
                {
                    userId: userData.userId,
                    token: newRefreshToken,
                },
            ],
            { session }
        );

        // Commit the transaction
        await session.commitTransaction();

        // Send response to user
        res.cookie(process.env.REFRESH_TOKEN_COOKIE_NAME, newRefreshToken, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            sameSite: 'None',
        }).json({
            message: 'Reauthentication successful',
            data: { user: userData, accessToken: newAccessToken },
        });
    } catch (err) {
        await session.abortTransaction();

        if (err.name === 'TokenExpiredError') {
            // Token has expired, clear cookie and send forbidden response
            res.clearCookie(process.env.REFRESH_TOKEN_COOKIE_NAME, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: 'None',
            });
            return res.status(403).json({ error: 'Refresh token expired' });
        } else if (err.name === 'JsonWebTokenError') {
            // Token is invalid, clear cookie and send forbidden response
            res.clearCookie(process.env.REFRESH_TOKEN_COOKIE_NAME, {
                httpOnly: true,
                secure: process.env.NODE_ENV !== 'development',
                sameSite: 'None',
            });
            return res.status(403).json({ error: 'Invalid refresh token' });
        } else {
            console.error('Reauthentication error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    } finally {
        session.endSession();
    }
}

module.exports = reAuthenticate;

async function logout(req, res) {
    const userId = req.params.userId;

    try {
        await RefreshToken.deleteOne({ userId });
        res.clearCookie('jwt');
        res.json({ message: 'Logout successful' });
    } catch (error) {
        res.status(500).json({
            message: 'Something went wrong. Try again later',
        });
    }
}

module.exports = { authenticate, reAuthenticate, logout };
