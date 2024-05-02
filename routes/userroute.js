const express = require('express');
const router = express.Router();
const {addtocart,posteditprofile,filter,buynow,regotpverification,verifyPayment,changepassword,postchangepassword,geteditaddress,productdetails,postforgotpassword,forgotpassword,orders,cancelorder,deleteaddress,checkout,deletecart,registerauth,registeruser,userprofile,useraddress,addaddress,postaddaddress,cartmanagement,postcart, editprofile, editaddress, passwordchange, forgotpasswordotp, resendotplogin, resendotpreg, resendotppass, cartPage, orderPage, buynowPage, applycoupon, addmoney, sort, wishlistShow, addtowishlist, deletewish} = require('../controllers/userservice');
const {userSession} = require('../middlewires/user'); 
const { adminSession } = require('../middlewires/admin');
//register
router.get('/register',registerauth);
router.post('/register',registeruser);
//profile
router.get('/userprofile/:id',userSession,userprofile);
router.get('/userprofile',userSession,userprofile);
router.get('/editprofile/:id',userSession,userSession,editprofile);
router.post('/editprofile/:id',posteditprofile);
//address
router.get('/address',userSession,useraddress);
router.get('/addaddress',userSession,addaddress);
router.post('/addaddress',postaddaddress);
router.get('/deleteaddress/:id/:element',userSession,deleteaddress);
router.get('/editaddress/:element',userSession,geteditaddress);
router.post('/editaddress/:id/:element',editaddress);
//cart
router.get('/cart',userSession,cartmanagement);
router.get('/addtocart/:productId',userSession,addtocart);
router.post('/cart/:id',postcart);
router.get('/deletecart/:id',userSession,deletecart);
router.get('/cart/:limit',userSession,cartPage);
//checkout
router.post('/checkout/:paymentMethod/:finalPrice',checkout);
router.post('/verifyPayment',verifyPayment);
router.get('/buynow',userSession,buynow);
router.get('/buynow/:limit',userSession,buynowPage);
//orders
router.get('/myorders',userSession,orders);
router.get('/cancelorder/:id',userSession,cancelorder);
router.get('/myorders/:limit',userSession,orderPage);
//forgotpassword
router.get('/forgotpassword',forgotpassword);
router.post('/forgotpassword',postforgotpassword);
router.get('/changepassword',userSession,changepassword);
router.post('/changepassword',postchangepassword);
router.post('/forgototp',forgotpasswordotp);
router.post('/passwordchange',passwordchange);
router.post('/regotpverification',regotpverification);
router.get('/resendotplog/:email',resendotplogin);
router.get('/resendotpreg/:email',resendotpreg);
router.get('/resendotppass/:email',resendotppass);
//product
router.get('/productdetails/:id',productdetails);
//coupon
router.post('/applycoupon',applycoupon);
//wallet
router.post('/addMoney',addmoney);
//filter
router.get('/filter/:filterItem',filter)
router.get('/sort/:value',sort);
//wishlist
router.get('/wishlist',userSession,wishlistShow)
router.get('/addtowishlist/:id',userSession,addtowishlist);
router.get('/deletewishlist/:id',userSession,deletewish);


module.exports = router;