function getCurrPage(currantPage, contentPerPage, totalCount) {
	const totalPage = Math.ceil(totalCount / contentPerPage);
	return totalCount <= currantPage ? `${currantPage}/${totalPage}` : null;
}

module.exports = getCurrPage;
