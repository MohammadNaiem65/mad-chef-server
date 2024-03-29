/**
 * @description - Calculates and returns the current page per total page as a string.
 *
 * @param {number} currantPage - The current page number, expected to be a positive integer.
 * @param {number} contentPerPage - The number of items per page, expected to be a positive integer.
 * @param {number} totalCount - The total number of items, expected to be a positive integer.
 * @returns {string|null} - A string representation of the current page per total page, or null if the current page is greater than the total page.
 *
 * @example
 * const pageInfo = getCurrPage(1, 10, 100);
 * console.log(pageInfo); // Output: "1/10"
 */
function getCurrPage(currantPage, contentPerPage, totalCount) {
	const totalPage = Math.ceil(totalCount / contentPerPage);
	return currantPage <= totalPage ? `${currantPage}/${totalPage}` : null;
}

module.exports = getCurrPage;
