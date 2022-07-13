// import dependencies and initialize the express router
const express = require('express');
const JwksController = require('../controllers/jwks-controller');

const jwksController = new JwksController();
const router = express.Router();

router.get('/obdirectory', jwksController.obdirectory);
router.get('/relyingparty', jwksController.relyingparty);

module.exports = router;