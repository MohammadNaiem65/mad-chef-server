const express = require('express');

const checkAuth = require('../middlewares/checkAuth');
const checkChef = require('../middlewares/checkChef');
const {
	createConsultDoc,
	getConsults,
	cancelConsultDoc,
	manageConsultationUpdates,
	deleteConsultDoc,
} = require('../controllers/consultController');

const router = express.Router();

// Endpoints
router.get('/user', checkAuth, getConsults);
router.post(['/consult', '/'], checkAuth, createConsultDoc);
router.patch(['/consult/:consultId', '/:consultId'], checkAuth, cancelConsultDoc);
router.patch(['/chef/consult/:consultId', '/chef/:consultId'], checkAuth, checkChef, manageConsultationUpdates);
router.delete(['/consult/:consultId', '/:consultId'], checkAuth, deleteConsultDoc)

module.exports = router;
