/**
 * Middleware function to check if the user's role is allowed to access a specific route.
 *
 * @param {...string} allowedRoles - The roles that are allowed to access the route.
 * @returns {function} A middleware function that checks the user's role and either allows or denies access.
 *
 * @example
 * const checkRoles = require('./checkRoles');
 *
 * router.get('/admin-route', checkRoles('admin'), (req, res) => {
 *   res.send('Welcome to the admin route!');
 * });
 */
function checkRoles(...allowedRoles) {
    return (req, res, next) => {
        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Access denied. Only ${allowedRoles.join(
                    ', '
                )} roles are allowed.`,
            });
        }

        next();
    };
}

module.exports = checkRoles;
