/**
 * Creates a projection object for MongoDB queries.
 * The projection object specifies which fields to include or exclude in the query results.
 *
 * @param {string} [include] - Comma-separated list of fields to include in the projection.
 * If provided, all other fields will be excluded.
 *
 * @param {string} [exclude] - Comma-separated list of fields to exclude from the projection.
 * If provided, all other fields will be included.
 *
 * @returns {object} - A projection object where keys are field names and values are 0 (exclude) or 1 (include).
 *
 * @example
 * // Include only 'name' and 'age' fields in the projection
 * const projection = createProjectionObject('name,age');
 * console.log(projection); // { name: 1, age: 1 }
 *
 * // Exclude 'password' and 'email' fields from the projection
 * const projection = createProjectionObject(null, 'password, email');
 * console.log(projection); // { password: 0, email: 0 }
 */
function createProjectionObject(include, exclude) {
    const projection = {};
    if (exclude && !include) {
        exclude.split(',').forEach((field) => (projection[field.trim()] = 0));
    } else if (include && !exclude) {
        include.split(',').forEach((field) => (projection[field.trim()] = 1));
    }
    return projection;
}

module.exports = createProjectionObject;
