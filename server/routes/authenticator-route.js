// import dependencies and initialize the express router
const express = require('express');
const AuthenticatorController = require('../controllers/authenticator-controller');

const authenticatorController = new AuthenticatorController();
const router = express.Router();

router.get('/check', authenticatorController.check);
router.post('/notify', authenticatorController.notify);
router.post('/consent', authenticatorController.consent);
router.post('/pushnotify', authenticatorController.pushnotify);

module.exports = router;