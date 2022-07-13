// import dependencies and initialize the express router
const express = require('express');
const KioskController = require('../controllers/kiosk-controller');
const kioskController = new KioskController();

const router = express.Router();

// define routes
router.get('/', kioskController.showKioskItems);
router.get('/checkout', kioskController.doCheckOut);
router.post('/checkout', kioskController.doCheckOut);

module.exports = router;
