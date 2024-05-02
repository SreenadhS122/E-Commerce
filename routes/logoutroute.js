const express = require('express');
const router = express.Router();
const {logoutsessiondestroy} = require('../controllers/logoutserive');

//logout
router.get('/logout',logoutsessiondestroy);

module.exports = router;