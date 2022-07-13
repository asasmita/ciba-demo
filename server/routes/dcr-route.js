// import dependencies and initialize the express router
const express = require('express');
const DcrController = require('../controllers/dcr-controller');

const dcrController = new DcrController();
const router = express.Router();

router.get('/', dcrController.init);
router.post('/create', dcrController.create);

module.exports = router;