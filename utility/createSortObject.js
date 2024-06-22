/**
 * Creates a sort object based on the provided sort and order parameters.
 *
 * @param {string} sort - A comma-separated string of properties to sort by.
 * @param {string} order - The order to sort the properties. It can be either 'asc' or 'desc'.
 * @returns {object} - An object where the keys are the properties to sort by and the values are the corresponding sort orders.
 *
 * @example
 * const sortObj = createSortObject('name,age', 'desc');
 * // sortObj will be: { name: -1, age: -1 }
 *
 * @example
 * const sortObj = createSortObject('name,age', 'asc');
 * // sortObj will be: { name: 1, age: 1 }
 */
function createSortObject(sort, order) {
	const sortObj = {};

	sort.split(',').map((el) => (sortObj[el] = order === 'desc' ? -1 : 1));

	return sortObj;
}

module.exports = createSortObject;
