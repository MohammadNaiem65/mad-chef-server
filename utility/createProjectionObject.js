/**
 * @description - this function takes a string, object and a value, and returns an object where the keys of the object are from string (the keys are separated by comma) and the value of the keys will be the third parameter
 *
 * @param {string} projectionString - a string representation of the projection fields separated by commas
 * @param {object} projectionObject - a projection object where the projection values will be saved
 * @param {number} projectionValue - a value (0 or 1) to save as the value of the projection object's fields
 * @returns {object}
 *
 * @example
 * createProjectionObject('field1,field2', {}, 1); // { field1: 1, field2: 1 }
 */
function createProjectionObject(
	projectionString = '',
	projectionObject = {},
	projectionValue
) {
	const fields = projectionString.split(',');

	// Using Object.assign with Array.reduce for a more concise approach
	return Object.assign(
		projectionObject,
		fields.reduce((acc, field) => {
			acc[field] = projectionValue;
			return acc;
		}, {})
	);
}

module.exports = createProjectionObject;
