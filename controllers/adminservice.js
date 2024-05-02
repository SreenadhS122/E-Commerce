const userDetail = require('../models/userDetails');
const products = require('../models/products');
const categories = require('../models/category');
const order = require('../models/orders');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const ejs = require('ejs');
const pdf = require('html-pdf');
const sharp = require('sharp');
const CsvParser = require('json2csv').Parser;
const coupon = require('../models/coupon');
const offer = require('../models/offer');
const { log, time } = require('console');
const moment = require('moment');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'views/newimg')
    },
    filename: function (req, file, cb) {
      cb(null,file.originalname);
    }
  });
  
const upload = multer({
    storage:storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpg" || file.mimetype == "image/jpeg") {
            cb(null, true);
        } else {
            return cb(new Error('Invalid mime type'));
        }
    }
});


const message = {succmsg:'you have successfully logged in.',
                invalidentry : 'Invalid entry',
                logmsg:'Enter details',
                filluser:"User must not be empty.",
                fillpass:'Password must not be empty.',
                fielderr:'Fiels should not be empty.',
                passerr:'Incorrect password',
                userloginmsg : 'You have signed in and login to continue.',
                userexist : 'User with the same email or mobile exists.',
                confpass : "Confirm password doesn't match."};


const admindashboard = async (req,res) => {
    let value;
    if((await order.find({status:{$ne:"Cancelled"}})).length > 0){
        const result = await order.aggregate([
            {$match :{date:{$gte:new Date(`${moment().format('YYYY-MM')}-DDT00:00:00.000+00:00`),$lte:new Date(`${moment().add('30','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},status:{$ne:"Cancelled"}}},
            {$group: {_id:"Total",total:{$sum:"$price"}}}
        ]);
        value = result[0].total
    }else{
        value = 0;
    }
        const salesOrder = await order.find({status:{$ne:"Cancelled"}})
        const product = await products.find().count();
        const users = (await userDetail.find()).length;
        const monthlyOrders = await order.find({date:{$gte:new Date(`${moment().format('YYYY-MM')}-01T00:00:00.000+00:00`),$lt:new Date(`${moment().add('30','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},status:{$ne:"Cancelled"}}).count();
        return res.render('adminDashboard',{revenue:value,users:users,monthlyOrders:monthlyOrders,products:product,userorder:salesOrder});
    
};
const getedituser = async (req,res) => {
    const id = req.params.id;
    const edituser = await userDetail.findOne({_id:id});
    res.render('edituser',{edituser:edituser,message:null});
};

const postedituser = async (req,res) => {
    const id = req.params.id;
    const edituser = await userDetail.findOne({_id:id});
    const {fullname,email,mobile} = req.body;
    if(fullname.trim() == "" || email.trim() == "" || mobile.trim() == ""){
        res.render('edituser',{message:message.fielderr,edituser:edituser})
    }else{
     if((await userDetail.findOne({email : email}) && edituser.email != email) || (await userDetail.findOne({mobile : mobile}) && edituser.mobile != email)){
        res.render('edituser',{edituser:edituser,message:message.userexist});
    }else{
     await userDetail.findByIdAndUpdate(id,{fullname : fullname,email : email,mobile:mobile});
     res.redirect('/users');
     }
    }
};

const deleteuser = async (req,res) => {
    const id = req.params.id;
        await userDetail.findByIdAndDelete(id);
        return res.redirect('/users');

}; 

const postsearchproduct = async (req,res) => {
    const {productsearch} = req.body;
    const categoryList = await categories.find();
    const searchProduct = await products.find({name: {$regex : "^"+productsearch,$options : "i"}});
    console.log(searchProduct);
    return res.render('homepage',{buttonmode:"login",array:searchProduct,category:categoryList,userId:null,count:0});
};

const getsearchuser = (req,res) => {
    res.redirect('/dashboard');
}

const postadduser = async (req,res) => {
    const {fullname,email,mobile,password,confirm_password} = req.body;
    const newuser = new userDetail({
        fullname : fullname,
        email : email,
        password : bcrypt.hashSync(req.body.password,10),
        isBlocked : false,
        mobile : mobile,
        otp : null
    });
    if(fullname.trim() == "" || email.trim() == "" || password.trim() == "" || mobile.trim() == ""){
        res.render('adduser',{message:message.fielderr,fullname:fullname,email:email,mobile:mobile,password:password})
    }else{
     if(await userDetail.findOne({email : newuser.email}) || await userDetail.findOne({mobile:newuser.mobile})){
        res.render('adduser',{message:message.userexist,fullname:fullname,email:null,mobile:mobile,password:password});
    }else{
        if(password != confirm_password){
            res.render('adduser',{message:message.confpass,fullname:fullname,mobile:mobile,email:email,password:password});
        }else{
        await newuser.save();
        res.redirect('/users');
        }
     }
    }
};

const getadduser = (req,res) => {
    return res.render('adduser',{message:null,fullname:null,email:null,mobile:null,address:null,password:null});
};
const userlist = async (req,res) => {
    const total = await userDetail.find();
    const viewusers = await userDetail.find().limit(8);
    return res.render('tables',{viewusers:viewusers,limit:1,total:total.length});
}
const blockuser = async (req,res) => {
    const id = req.params.id;
    const viewusers = await userDetail.findById(id);
    delete req.session.user;
    if(viewusers.isBlocked){
        await userDetail.findByIdAndUpdate(id,{isBlocked:false});
       return res.redirect('/users');
    }else{
        await userDetail.findByIdAndUpdate(id,{isBlocked:true});
        return res.redirect('/users');
    }
}
const productslist = async (req,res) => {
    const total = await products.find();
    const productlist = await products.find().limit(6);
    const offerList = await offer.find();
    res.render('products',{viewproducts : productlist,limit:1,offer:offerList,total:total.length})
}
const addproduct = async (req,res) => {
    const {name,category,price,quantity,description} = req.body;
    const cat = await categories.find();
    for(element of req.files){
        await sharp(`views/newimg/${element.filename}`).resize({
            fit:sharp.fit.contain,
            height:900,
            width:900
        }).toFile(`views/newimg/resized/${element.filename}`);
    }
    const product = new products ({
        name : name,
        category : category,
        price : Math.abs(price),
        quantity : Math.abs(quantity),
        description : description,
        offer : false,
        image:req.files
    });
    if(name.trim() == "" || category.trim() == "" || price.trim() == "" || quantity.trim() == "" || description.trim() == ""){
        res.render('addproducts',{message:"Fields should not be empty.",name:name,category:cat,price:price,quantity:quantity,description:description});
    }else{
       await product.save(); 
        res.redirect('/products');
    }
   
}
const getaddproduct = async(req,res) => {
    const category = await categories.find();
    res.render('addproducts',{message:null,name:null,category:category,price:null,quantity:null,description:null});
}
const geteditproduct = async (req,res) => {
    const id = req.params.id;
    const category = await categories.find();
    const viewproducts = await products.findById(id);
    res.render('editproduct',{viewproducts:viewproducts,message:null,category:category});
}

const posteditproduct = async (req,res) =>{
    const id = req.params.id;
    const categorylist = await categories.find();
    const viewproducts = await products.findById(id);
    if(req.files){
        for(element of req.files){
        await sharp(`views/newimg/${element.filename}`).resize({
            fit:sharp.fit.contain,
            height:900,
            width:900
        }).toFile(`views/newimg/resized/${element.filename}`);
        }
    }
    const {name,category,price,quantity,description} = req.body;
    if(name.trim() == "" || category.trim() == "" || price.trim() == "" || quantity.trim() == "" || description.trim() == ""){
        res.render('editproduct',{viewproducts:viewproducts,message:"Fields should not be empty.",category:categorylist});
    }else{
        if(req.files){
        await products.findByIdAndUpdate(id,{name:name,category:category,price:Math.abs(price),quantity:Math.abs(quantity),description:description,$push:{image:{$each:req.files}}});
        }else{
            await products.findByIdAndUpdate(id,{name:name,category:category,price:price,quantity:quantity,description:description});

        }
    res.redirect('/products');
    }
}

const deleteimage = async(req,res) => {
    const {item,id} = req.params;
    await products.findByIdAndUpdate(id,{$pull:{image:{filename:item}}});
    res.redirect(`/editproduct/${id}`);
}

const deleteproduct = async(req,res) => {
    const id = req.params.id;
    await products.findByIdAndDelete(id);
    res.redirect('/products');
}

const categorylist = async (req,res) => {
    const total = await categories.find();
    const category = await categories.find().limit(5);
    res.render('categorylist',{viewcategory:category,message:null,limit:1,total:total.length});
}

const addcategory = async (req,res) => {
    const{name,description} = req.body;
    console.log(req.file);
        await sharp(`views/newimg/${req.file.filename}`).resize({
            fit:sharp.fit.contain,
            height:900,
            width:900
        }).toFile(`views/newimg/resized/${req.file.filename}`);
    const category = await categories.find();
    if(name.trim() == "" || description.trim() == ""){
        res.render('addcategory',{message:"Fields should not be empty.",name:name,description:description});
    }else{
        if(!await categories.findOne({name:name})){
        const newcategory = new categories({
            name:name,
            description:description,
            image:req.file.filename
        });
        await newcategory.save();
        res.redirect('/category');
        }else{
            const total = await categories.find();
            res.render('categorylist',{viewcategory:category,message:"Category exists.",limit:1,total:total.length});
        }
    }
}

const getaddcategory = (req,res) => {
    res.render('addcategory',{message:null,name:null,description:null});
}

const editcategory = async (req,res) => {
    const id = req.params.id;
    console.log(req.file);
    const{name,description} = req.body;
    const categoryItem = await categories.findById(id);
    if(name.trim() == "" || description.trim() == ""){
        res.render('editcategory',{viewcategory:categoryItem,message:"Fields should not be empty.",name:name,description:description,image:categoryItem.image});
    }else if((await categories.find({name:name})).length == 0 && categoryItem.name != name){
        if(req.file){
            await categories.findByIdAndUpdate(id,{name:name,description:description,image:req.file.filename});
        }else{
            await categories.findByIdAndUpdate(id,{name:name,description:description});
        }
        res.redirect('/category');
    }else{
        res.render('editcategory',{viewcategory:categoryItem,message:"Category exists.",name:name,description:description,image:categoryItem.image});
    }
}

const geteditcategory = async (req,res) => {
    const id = req.params.id;
    const category = await categories.findById(id);
    res.render('editcategory',{viewcategory:category,message:null,name:category.name,description:category.description,image:category.image});
}

const deletecategory = async (req,res) => {
    const id = req.params.id;
    await categories.findByIdAndDelete(id);
    res.redirect('/category');
}

const userorder = async (req,res) => {
    const total = await order.find()
    const userorder = await order.find().sort({time:-1}).limit(10);
    res.render('userorders',{userorder:userorder,limit:1,total:total.length});
}

const orderstatus = async (req,res) => {
    const id = req.params.id;
    const status = req.params.status;
    await order.findByIdAndUpdate(id,{status:status});
    res.redirect('/userorders');
}

const inventory = (req,res) => {
    res.redirect('/products');
}

const imgUploadEdit = async (req,res,next) => {
    const {id} = req.params;
    const categoryList = await categories.find();
    const viewproducts = await products.findById(id);
    const limit = 5 - (await products.findById(id)).image.length
    const upload1 = upload.array('image',limit);
    upload1(req,res,(err) => {
        if(err){
            res.render('editproduct',{viewproducts:viewproducts,message:"Only images are allowed(5).",category:categoryList})
        }else{
            next();
        }
    })
}

const imgUploadAdd = async (req,res,next) => {
    const {name,category,price,quantity,description} = req.body;
    console.log(req.body);
    const categoryList = await categories.find();
    const upload1 = upload.array('image',5);
    upload1(req,res,(err) => {
        if(err){
            res.render('addproducts',{message:"Only images are allowed(5).",name:name,category:categoryList,price:price,quantity:quantity,description:description});
        }else{
            next();
        }
    })
}

const imgUploadSingleEdit = async (req,res,next) => {
    const {id} = req.params;
    const category = await categories.findById(id);
    const upload1 = upload.single('image');
    upload1(req,res,(err) => {
        if(err){
            res.render('editcategory',{viewcategory:category,message:"Only images are allowed(1)."})
        }else{
            next();
        }
    })
}

const imgUploadSingleAdd = async (req,res,next) => {
    const upload1 = upload.single('image');
    upload1(req,res,(err) => {
        if(err){
            console.log(err);
            res.render('addcategory',{message:"Only images are allowed(1).",name:null,description:null});
        }else{
            next();
        }
    })
}

const chart = async (req,res) => {
    const {value} = req.body;
    async function totalAmount(least,high){
        const result = await order.aggregate([
            {$match :{date:{$gte:new Date(least),$lte:new Date(high)}}},
            {$group: {_id:"Total",total:{$sum:"$price"}}}
        ]);
        if (result.length != 0) {
            return result[0].total;
        }else{
            return 0;
        }
    }

    if(value == 'weekly'){
        const weekly = [
            {day : `${moment().subtract('28','days').format('DD-MMMM')}`,amount : await totalAmount(`${moment().subtract('35','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('28','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
            {day : `${moment().subtract('21','days').format('DD-MMMM')}`,amount : await totalAmount(`${moment().subtract('28','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('21','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
            {day : `${moment().subtract('14','days').format('DD-MMMM')}`,amount : await totalAmount(`${moment().subtract('21','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('14','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
            {day : `${moment().subtract('7','days').format('DD-MMMM')}`,amount : await totalAmount(`${moment().subtract('14','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('7','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
            {day : `${moment().format('DD-MMMM')}`,amount : await totalAmount(`${moment().subtract('7','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().format('YYYY-MM-DD')}T00:00:00.000+00:00`)}
        ]
        res.json(weekly);
    }else if(value == 'monthly'){
        const monthly = [
        {day : `${moment().subtract('270','days').format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().subtract('300','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('270','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        {day : `${moment().subtract('240','days').format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().subtract('270','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('240','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        {day : `${moment().subtract('210','days').format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().subtract('240','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('210','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        {day : `${moment().subtract('180','days').format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().subtract('210','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('180','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        {day : `${moment().subtract('150','days').format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().subtract('180','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('150','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        {day : `${moment().subtract('120','days').format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().subtract('150','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('120','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        {day : `${moment().subtract('90','days').format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().subtract('120','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('90','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        {day : `${moment().subtract('60','days').format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().subtract('90','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('60','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        {day : `${moment().subtract('30','days').format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().subtract('60','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('30','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        {day : `${moment().format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().subtract('30','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        {day : `${moment().add('30','days').format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().add('30','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        {day : `${moment().add('60','days').format('MMMM-YYYY')}`,amount : await totalAmount(`${moment().add('30','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().add('60','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
    ]
        res.json(monthly);
    }else if(value == 'yearly'){
        const yearly = [
            {day : `${moment().subtract('1560','days').format('YYYY')}`,amount : await totalAmount(`${moment().subtract('1925','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('1560','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
            {day : `${moment().subtract('1195','days').format('YYYY')}`,amount : await totalAmount(`${moment().subtract('1560','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('1195','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
            {day : `${moment().subtract('830','days').format('YYYY')}`,amount : await totalAmount(`${moment().subtract('1195','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('830','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
            {day : `${moment().subtract('365','days').format('YYYY')}`,amount : await totalAmount(`${moment().subtract('830','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('365','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
            {day:moment().format('YYYY'),amount:await totalAmount(`${moment().subtract('365','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
        ]
        res.json(yearly); 
    }else if(value == 'daily'){
        const daily = [
            {day:moment().subtract('1','days').format('DD MM YYYY'),amount:await totalAmount(`${moment().subtract('2','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().subtract('1','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
            {day:moment().format('DD MM YYYY'),amount:await totalAmount(`${moment().subtract('1','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().format('YYYY-MM-DD')}T00:00:00.000+00:00`)},
            {day:moment().add('1','days').format('DD MM YYYY'),amount:await totalAmount(`${moment().format('YYYY-MM-DD')}T00:00:00.000+00:00`,`${moment().add('1','days').format('YYYY-MM-DD')}T00:00:00.000+00:00`)}   
        ]
        res.json(daily);
    }else{
        const {startDate,endDate} = req.body;
        const dateFilter = [
            {day:startDate,amount:await totalAmount(`${moment().subtract('7','days')}T00:00:00.000+00:00`,`${startDate}T00:00:00.000+00:00`)}, 
            {day:endDate,amount:await totalAmount(`${startDate}T00:00:00.000+00:00`,`${endDate}T00:00:00.000+00:00`)}
        ]
        res.json(dateFilter);
    }
}

const userlistPage = async (req,res) => {
    const {limit} = req.params;
    const total = await userDetail.find();
    const viewusers = await userDetail.find().skip((limit-1)*8).limit(8);
    return res.render('tables',{viewusers:viewusers,limit:limit,total:total.length});
}

const productslistPage = async (req,res) => {
    const {limit} = req.params;
    const total = await products.find();
    const offerList = await offer.find();
    const productlist = await products.find().skip((limit-1)*6).limit(6);
    res.render('products',{viewproducts : productlist,offer:offerList,limit:limit,total:total.length})
}

const categorylistPage = async (req,res) => {
    const {limit} = req.params;
    const total = await categories.find();
    const category = await categories.find().skip((limit-1)*5).limit(5);
    res.render('categorylist',{viewcategory:category,message:null,limit:limit,total:total.length});
}

const userorderPage = async (req,res) => {
    const {limit} = req.params;
    const total = await order.find();
    const userorder = await order.find().sort({time:-1}).skip((limit-1)*10).limit(10);
    res.render('userorders',{userorder:userorder,limit:limit,total:total.length});
}

const couponsList = async (req,res) => {
    const coupons = await coupon.find();
    res.render('coupons',{viewcoupon:coupons,message:null});
}

const addcoupon = async (req,res) => {
    res.render('addcoupon',{message:null,name:null,discount:null,code:null});
}

const postAddcoupon = async (req,res) => {
    const{name,code,discount} = req.body;
    console.log(req.body);
    if(name.trim() == "" || discount.trim() == "" || code.trim() == ""){
        res.render('addcoupon',{message:"Fields should not be empty.",name:name,discount:discount,code:code});
    }else{
        if(!await coupon.findOne({code:code})){
        const newcoupon = new coupon({
            name:name,
            code : code,
            discount:discount,
        });
        await newcoupon.save();
        res.redirect('/coupon');
        }else{
            res.render('addcoupon',{message:"Coupon exists.",name:name,discount:discount,code:code});
        }
   }
}

const editcoupon = async(req,res) => {
    const{id} = req.params;
    const couponItem = await coupon.findById(id);
    res.render('editcoupon',{message:null,couponItem:couponItem});
}

const posteditcoupon = async(req,res) => {
    const{id} = req.params;
    const{name,code,discount} = req.body;
    await coupon.findByIdAndUpdate(id,{name:name,code:code,discount:discount});
    res.redirect('/coupon');    
}

const deletecoupon = async(req,res) => {
    const{id} = req.params;
    await coupon.findByIdAndDelete(id);
    res.redirect('/coupon');
}

const generatereport = async (req,res) => {
    const{type} = req.params;
    const orderList = await order.find({status:{$ne:"Cancelled"}},{_id:0,username:1,time:1,"product.name":1,quantity:1,status:1,price:1,paymentmethod:1,paymentStatus:1});
    const data = [];
    orderList.forEach((element) => {
        const {username,time,product:{name},quantity,price,paymentmethod,paymentStatus} = element;
        data.push({username,time,name,quantity,price,paymentmethod,paymentStatus});
    });
    if(type == 'excel'){
    const csvFields = ["Username","Time","Product Name","Quantity","Price","Paymentmethod","PaymentStatus"];
    const csvparser = new CsvParser({csvFields});
    const csvData = csvparser.parse(data);
    res.setHeader("Content-Type","text/csv");
    res.setHeader("Content-Disposition","attatchment: filename=salesreport.csv");
    res.status(200).end(csvData);
    }else{
        let options = {
            format : "A4",
            orientation : "portrait",
            border : "10mm"
        }
        const filePath = path.resolve(__dirname,'../views/sales.ejs');
        const htmlString = fs.readFileSync(filePath).toString();
        const ejsData = ejs.render(htmlString,{userorder:orderList});
        pdf.create(ejsData,options).toFile('report.pdf',(err,response) => {
            if(err) console.log(err);
            const filePath = path.resolve(__dirname,"../report.pdf");
            fs.readFile(filePath,(err,file) => {
                if(err){
                    console.log(err);
                   return res.status(500).send("Couldn't download file.");
                }
                res.setHeader("Content-Type","application/pdf");
                res.setHeader("Content-Disposition","attatchment: filename=salesreport.pdf");
                res.send(file);
        });
    });
}
}

const offerList = async (req,res) => {
    const offers = await offer.find();
    res.render('offer',{message:null,viewoffer:offers});
}

const getAddOffer = async (req,res) => {
    res.render('addOffer',{message:null,name:null,discription:null,discount:null});
}

const addOffer = async (req,res) => {
    const {name,discription,discount} = req.body
    const newOffer = new offer({
        name : name,
        discription : discription,
        discount : discount
    });
    
    if(name.trim() == "" || discription.trim() == "" || discount.trim() == ""){
        res.render('addOffer',{message:"Fields should not be empty.",name:name,discription:discription,discount:discount}) 
    }else{
        if((await offer.find({name:name})).length == 0){
        await newOffer.save();
        res.redirect('/offers');
        }else{
            res.render('addOffer',{message:"Offer Exists.",name:name,discription:discription,discount:discount}) 
        }
    }
}

const deleteOffer = async (req,res) => {
    const {id} = req.params;
    await offer.findByIdAndDelete(id);
    res.redirect('/offers');
}

const productOffer = async (req,res) => {
    const {id} = req.params;
    const {offer} = req.body;
    const productItem = await products.findById(id);
    const finalPrice = productItem.price - (productItem.price*offer/100);
    await products.findByIdAndUpdate(id,{offerPrice:finalPrice,offerprcnt:offer,offer:true});
    res.redirect('/products');
}

module.exports = {productOffer,offerList,addOffer,deleteOffer,generatereport,deletecoupon,generatereport,posteditcoupon,getAddOffer,editcoupon,postAddcoupon,addcoupon,couponsList,orderstatus,categorylistPage,userorderPage,productslistPage,chart,userlistPage,imgUploadSingleAdd,imgUploadSingleEdit,deleteimage,imgUploadAdd,imgUploadEdit,inventory,userorder,deletecategory,geteditcategory,editcategory,getaddcategory,addcategory,categorylist,deleteproduct,posteditproduct,geteditproduct,upload,getaddproduct,addproduct,productslist,blockuser,userlist,admindashboard,getedituser,postedituser,deleteuser,postsearchproduct,getsearchuser,postadduser,getadduser};