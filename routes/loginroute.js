const express = require('express');
const router = express.Router();
const {otpverification,homepageauth,loginauthentication,renderloginauth} = require('../controllers/loginservice');

//home
router.get('/',homepageauth);
//login
router.post('/sendotp',loginauthentication);
router.get('/login',renderloginauth);
//otp login
router.post('/otpverification',otpverification);

module.exports = router;