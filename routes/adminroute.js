const express = require('express');
const router = express.Router();
const {upload,deletecategory,deleteimage,chart,inventory,imgUploadAdd,imgUploadSingleAdd,imgUploadSingleEdit,orderstatus,userorder,geteditcategory,addcategory,getaddcategory,categorylist,deleteproduct,posteditproduct,geteditproduct,getaddproduct,addproduct,productslist,blockuser,userlist,admindashboard,getedituser,postedituser,deleteuser,postsearchproduct,postadduser,getadduser, categoryset, editcategory, upload1, imgUploadEdit, userlistPage, productslistPage, categorylistPage, userorderPage, couponsList, addcoupon, postAddcoupon, editcoupon, posteditcoupon, deletecoupon, generatereport, offerList, getAddOffer, addOffer, deleteOffer, productOffer} = require('../controllers/adminservice');
const {adminSession} = require('../middlewires/admin');
//add
router.post('/adduser',postadduser);
router.get('/adduser',adminSession,getadduser);
//dashboard
router.get('/dashboard',adminSession,admindashboard);
router.get('/users',adminSession,userlist);
router.get('/users/:limit',adminSession,userlistPage);
//edit
router.get('/edituser/:id',adminSession,getedituser);
router.post('/edituser/:id',postedituser);
//search
router.post('/search',postsearchproduct);
//delete
router.get('/deleteuser/:id',adminSession,deleteuser);
//block user
router.get('/blockuser/:id',adminSession,blockuser);
//get products
router.get('/products',adminSession,productslist);
router.get('/products/:limit',adminSession,productslistPage);
router.post('/addproduct',imgUploadAdd,addproduct);
//addproduct
router.get('/addproduct',adminSession,getaddproduct);
//editproduct
router.get('/editproduct/:id',adminSession,geteditproduct);
router.post('/editproduct/:id',imgUploadEdit,posteditproduct);
//deleteuser
router.get('/deleteproduct/:id',adminSession,deleteproduct);
//category
router.get('/category',adminSession,categorylist);
router.get('/category/:limit',adminSession,categorylistPage);
router.get('/addcategory',adminSession,getaddcategory);
router.post('/addcategory',imgUploadSingleAdd,addcategory);
router.get('/editcategory/:id',adminSession,geteditcategory);
router.post('/editcategory/:id',imgUploadSingleEdit,editcategory);
router.get('/deletecategory/:id',adminSession,deletecategory);
router.get('/deleteimage/:item/:id',adminSession,deleteimage);
//userorder
router.get('/userorders',adminSession,userorder);
router.get('/userorders/:limit',adminSession,userorderPage);
router.get('/orderstatus/:status/:id',adminSession,orderstatus);
router.post('/chart',chart);
//inventory
router.get('/inventory',adminSession,inventory);
//coupon
router.get('/coupon',adminSession,couponsList);
router.get('/addcoupon',adminSession,addcoupon);
router.post('/addcoupon',postAddcoupon);
router.get('/editcoupon/:id',adminSession,editcoupon);
router.post('/editcoupon/:id',posteditcoupon);
router.get('/deletecoupon/:id',adminSession,deletecoupon)
//report
router.get('/report/:type',adminSession,generatereport)
//offers
router.get('/offers',adminSession,offerList);
router.get('/addoffer',adminSession,getAddOffer);
router.post('/addoffer',addOffer);
router.get('/deleteoffer/:id',adminSession,deleteOffer);
router.post('/addoffer/:id',productOffer);
module.exports = router;