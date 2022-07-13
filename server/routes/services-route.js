// import dependencies and initialize the express router
const express = require('express');
const ServicesController = require('../controllers/services-controller');

const servicesController = new ServicesController();
const router = express.Router();

router.post('/print', servicesController.init);
router.post('/notify', servicesController.notify);
router.post('/ping', servicesController.ping);
router.get('/refresh', servicesController.refresh);

module.exports = router;