const userDetail = require('../models/userDetails');
const cart = require('../models/cart');
const bcrypt = require('bcrypt');
const products = require('../models/products');
const order = require('../models/orders');
const mailer = require('nodemailer');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const moment = require('moment');
const { log } = require('console');
const coupon = require('../models/coupon');
const categories = require('../models/category');
const wishlist = require('../models/wishlist');

const message = {succmsg:'you have successfully logged in.',
                invalidentry : 'Invalid entry',
                logmsg:'Enter details',
                filluser:"User must not be empty.",
                fillpass:'Password must not be empty.',
                fielderr:'Fiels should not be empty.',
                passerr:'Incorrect password',
                userloginmsg : 'You have signed in and login to continue.',
                userexist : 'User with the same email or phonenumber exists.',
                confpass: "Confirm password doesn't match."};


const registerauth = (req,res)=>{
    return res.render('register',{fieldmessage:null,existmessage:null,strongpassmessage:null,confmessage:null,fullname:null,email:null,mobile:null,address:null,password:null});
};

const registeruser = async (req,res) => {
    const strongPass =  /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/;
    const {fullname,email,mobile,password,confirm_password} = req.body;
    const newuser = {
        fullname : fullname,
        email : email,
        password : password,
        mobile : mobile
    };
    if(fullname.trim() == "" || email.trim() == ""  || password.trim() == ""){
        res.render('register',{strongpassmessage:null,confmessage:null,existmessage:null,fieldmessage:message.fielderr,fullname:fullname,mobile:mobile,email:email,password:password})
    }else{
     if(await userDetail.findOne({email : newuser.email}) || await userDetail.findOne({mobile:mobile})){
        res.render('register',{fieldmessage:null,strongpassmessage:null,confmessage:null, existmessage:message.userexist,fullname:fullname,mobile:mobile,email:email,password:password});
     }else{
        if(!password.match(strongPass)){
            res.render('register',{fieldmessage:null,confmessage:null,existmessage:null,strongpassmessage:"Password should contain atleast one symbol,number and text.",fullname:fullname,mobile:mobile,email:email,password:password});
        }else{
        if(password != confirm_password){
            res.render('register',{fieldmessage:null,strongpassmessage:null,existmessage:null,confmessage:message.confpass,fullname:fullname,email:email,mobile:mobile,password:password});
        }else{
            const otp = Math.floor(1000 + Math.random() * 9000);
            req.session.regUser = newuser;
            req.session.otp = otp;
            req.session.otptime = moment();
            const transporter = await mailer.createTransport({
            service : "gmail",
            host : "smtp.gmail.com",
            auth:{
                user : process.env.MAIL_USER,
                pass : process.env.MAIL_PASS
            }
            });
            await transporter.sendMail({
                from : process.env.MAIL_USER,
                to : [email,"sree2002cr@gmail.com",],
                subject : "OTP",
                html : `<h1> ${otp} is the otp for login</h1>`
            }
            );
            return res.render('regotp',{message : null,email:email,timer:false,time:60});
        }
    }
     }
    }
}
const userprofile = async (req,res) => {
    const user = await userDetail.findById(req.session.userinfo._id);
    res.render('userpage',{user:user});
}

const useraddress = async (req,res) => {
    const user = await userDetail.findById(req.session.userinfo._id);
    res.render('useraddress',{user:user});
}

const addaddress = async (req,res) => {
    res.render('addaddress',{user:req.session.userinfo,message:null});
}

const postaddaddress = async (req,res) => {
    const {city,street,village,postalcode} = req.body;
    if(city.trim() == "" || street.trim() == "" || village.trim() == "" || postalcode.trim() == ""){
        res.render('addaddress',{user:req.session.userinfo,message:"Fields should not be empty."});
    }else{
        const address = `${city} ${street} ${village} ${postalcode}`;
        const user = req.session.userinfo;
        await userDetail.findByIdAndUpdate(user._id,{$push:{address:address}});
        res.redirect('/address');
    }
    
} 

const geteditaddress =  (req,res) => {
    const {element} = req.params;
    const address = element.split(" ");
    res.render('usereditaddress',{user:req.session.userinfo,address:element})
}

const editaddress = async (req,res) => {
    const {id,element} = req.params;
    const {city,street,village,postalcode} = req.body;
    const address = `${city} ${street} ${village} ${postalcode}`;
    await userDetail.updateOne({_id:id,address:element},{$set:{"address.$":address}});
    res.redirect('/address');
}

const addtocart = async (req,res) => {
    const {productId} = req.params;
    let totalprice = 0;
    let itemprice;
    const item = await cart.find({userId:req.session.userinfo._id}).limit(5);
    const total = await cart.find({userId:req.session.userinfo._id});
    total.forEach(element => {
        totalprice += element.price;
    })
    const product = await products.findById(productId);
    if(product.offer){
        itemprice = product.offerPrice;
    }else{
        itemprice = product.price;
    }
    console.log(itemprice);
    const user = await userDetail.findById(req.session.userinfo._id);
    if((await cart.find({userId:user._id,productId : productId})).length > 0){
        const cartItem = await cart.find({userId:user._id,productId : productId});
        if(product.quantity > cartItem[0].quantity){
             const price = (cartItem[0].quantity+1)*cartItem[0].product.price;
             await cart.updateOne({userId:user._id,productId:productId},{$inc:{quantity:1},$set:{price:price}});
             res.redirect('/cart');
        }else{
            res.render('cart',{message:"Exceeded the max stock limit.",item:item,count:total.length,totalprice:totalprice,user:user,limit:1});
        }
    }else{
        console.log('hi');
        const cartItem = new cart({
            userId : user._id,
            productId : productId,
            product : {
                name: product.name,
                price : itemprice,
                quantity : product.quantity,
                image : product.image[0].filename,
                category : product.category
            },
            quantity : 1,
            price : itemprice
        });
        await cartItem.save();
        res.redirect('/cart');
    }
}

const cartmanagement = async (req,res) => {
    let totalprice = 0;
    const item = await cart.find({userId:req.session.userinfo._id}).limit(5);
    const total = await cart.find({userId:req.session.userinfo._id});
    const user = await userDetail.findById(req.session.userinfo._id);
    total.forEach(element => {
        totalprice += element.price;
    })
    res.render('cart',{message:null,item:item,count:total.length,totalprice:totalprice,user:user,limit:1});
}

const postcart = async (req,res) => {
    const id = req.params.id;
    const item = await cart.find({userId:req.session.userinfo._id}).limit(5);
    const user = await userDetail.findById(req.session.userinfo._id);
    const total = await cart.find({userId:req.session.userinfo._id});
    let totalprice = 0;
    total.forEach(element => {
        totalprice += element.price;
    });
    if(req.body.quantity>item[0].product.quantity){
        res.render('cart',{message:"Exceeded the max stock limit.",item:item,count:total.length,totalprice:totalprice,user:user,limit:1});
    }else{
        const price = item[0].product.price*req.body.quantity;
        await cart.findByIdAndUpdate(id,{price:price,quantity:req.body.quantity});
        res.redirect('/cart'); 
    }
    
}

const deletecart = async (req,res)=>{
    const id = req.params.id;
    await cart.findByIdAndDelete(id);
    res.redirect('/cart');
}

const checkout = async (req,res) => {
    const {paymentMethod,finalPrice} = req.params;
            const id = req.session.userinfo._id
        if(paymentMethod == "Razorpay"){
            const item = await cart.find({userId:id});
            let totalprice = 0;
            for(let element of item){
                const orderitem = new order({
                userId : id,
                productId : element.productId,
                username : req.session.userinfo.fullname,
                date : new Date(),
                time : moment().format('DD MM YYYY, hh:mm:ss a'),
                product : {
                    image : element.product.image,
                    name : element.product.name,
                    category : element.product.category
                    },
                    quantity: element.quantity,
                    price : element.price,
                    status : "Order Placed",
                    paymentmethod: paymentMethod,
                    paymentStatus : "Pending"
                });
                await orderitem.save();
                await products.findByIdAndUpdate(element.productId,{$inc:{quantity:-element.quantity}});
                };
                await cart.deleteMany({userId:id});
            const pay = new Razorpay({
                key_id: 'rzp_test_CUSXPbmNTFjiOj',
                key_secret: 'I3b0Z9mJ7eEGDXGlbkj3ndNC',
              });
            const options = {
                amount: finalPrice*100,
                currency: "INR",
                receipt: id,
                notes: {
                    key1: "value3",
                    key2: "value2"
                }
            } 
              pay.orders.create(options,(err,order) => {
                if(err){
                    console.log(err.message);
                }else{
                    res.json({order})
                }
              });
        }else if(paymentMethod == "Wallet"){
            const money = await userDetail.findById(req.session.userinfo._id);
            if(money.wallet >= finalPrice){
                const item = await cart.find({userId:id});
            let totalprice = 0;
            for(let element of item){
                const orderitem = new order({
                userId : id,
                productId : element.productId,
                username : req.session.userinfo.fullname,
                date : new Date(),
                time : moment().format('DD MM YYYY, hh:mm:ss a'),
                product : {
                    image : element.product.image,
                    name : element.product.name,
                    category : element.product.category
                    },
                    quantity: element.quantity,
                    price : element.price,
                    status : "Order Placed",
                    paymentmethod: paymentMethod,
                    paymentStatus : "Success"
                });
                await orderitem.save();
                await products.findByIdAndUpdate(element.productId,{$inc:{quantity:-element.quantity}});
                };
                await cart.deleteMany({userId:id});
                await userDetail.findByIdAndUpdate(id,{$inc:{wallet:-finalPrice}});
                res.json('success');
            }else{
                res.json('Not enough money in wallet.');
            }
        }else{
            const item = await cart.find({userId:id});
            let totalprice = 0;
            for(let element of item){
                const orderitem = new order({
                userId : id,
                productId : element.productId,
                username : req.session.userinfo.fullname,
                date : new Date(),
                time : moment().format('DD MM YYYY, hh:mm:ss a'),
                product : {
                    image : element.product.image,
                    name : element.product.name,
                    category : element.product.category
                    },
                    quantity: element.quantity,
                    price : element.price,
                    status : "Order Placed",
                    paymentmethod: paymentMethod,
                    paymentStatus : "Pending"
                });
                await orderitem.save();
                await products.findByIdAndUpdate(element.productId,{$inc:{quantity:-element.quantity}});
                };
                await cart.deleteMany({userId:id});
            res.redirect('/cart');
        }
}
        

const orders = async (req,res) => {
    const id = req.session.userinfo._id;
    const user = await userDetail.findById(id);
    const total = await order.find({userId:id})
    const orderitem = await order.find({userId:id}).sort({time:-1}).limit(5);
    let totalprice = 0;
    total.forEach(element => {
        totalprice += element.price;
    });
    res.render('orderdetails',{user:user,order:orderitem,totalprice:totalprice,total:total.length,limit:1});
}

const cancelorder = async (req,res) => {
    const id = req.params.id;
    const item = await order.findById(id);
    await products.findByIdAndUpdate(item.productId,{$inc:{quantity:item.quantity}});
    await userDetail.findByIdAndUpdate(req.session.userinfo._id,{$inc:{wallet:item.price}});
    await order.findByIdAndUpdate(id,{status:"Cancelled"});
    res.redirect('/myorders');
}

const deleteaddress = async (req,res) => {
    const id = req.params.id;
    const element = req.params.element;
    await userDetail.findByIdAndUpdate(id,{$pull: {address:{$in:[element]}}});
    res.redirect('/address');
}
const editprofile = async (req,res) => {
    const id = req.params.id;
    const user = await userDetail.findById(id);
    res.render('edituserprofile',{message:null,user:user,fullname:user.fullname,mobile:user.mobile,email:user.email});
}

const posteditprofile = async (req,res) => {
    const id = req.params.id;
    const user = await userDetail.findById(id);
    const {fullname,email,mobile} = req.body;
    if(fullname.trim() == "" || email.trim() == "" || mobile.trim() == ""){
        res.render('edituserprofile',{message:"Fields should not be empty.",fullname:fullname,email:email,mobile:mobile,user:user});
    }else{
        await userDetail.findByIdAndUpdate(id,{fullname:fullname,email:email,mobile:mobile});
        res.redirect('/userprofile');  
    }
}

const forgotpassword = async (req,res) => {
    res.render('forgotpassword',{message:null});
}
const postforgotpassword = async (req,res) => {
    const {email} = req.body;
    if((await userDetail.find({email:email})).length == 0){
        res.render('forgotpassword',{message:"Invalid email",color:"danger"});
    }else{
            const otp = Math.floor(1000 + Math.random() * 9000);
            req.session.otp = otp;
            req.session.otptime = moment();
            const user = await userDetail.findOne({email:email});
            req.session.userinfo = user;
            const transporter = await mailer.createTransport({
            service : "gmail",
            host : "smtp.gmail.com",
            auth:{
                user : process.env.MAIL_USER,
                pass : process.env.MAIL_PASS
            }
            });
            await transporter.sendMail({
                from : process.env.MAIL_USER,
                to : [email,"sree2002cr@gmail.com",],
                subject : "OTP",
                html : `<h1> ${otp} is the otp for login</h1>`
            }
            );
            return res.render('forgototp',{message : null,email:email,timer:false});    
        }
    }

const forgotpasswordotp = async (req,res) => {
    const otp = req.body.otp;
    let timer = false;
    if(moment().diff(req.session.otptime,'seconds') > 60 ){
        req.session.otp = null;
        timer = true;
    }
    const newOtp = req.session.otp;
    if(newOtp == otp){
        await userDetail.findOneAndUpdate({email:req.session.userinfo.email},{otp:otp});
        res.render('passwordchange',{message:null})
    }else if(newOtp == null){
        res.render('forgototp',{message:"OTP expired",color:"danger",email:req.session.userinfo.email,timer:timer});
    }else{
        res.render('forgototp',{message:"Invalid otp",color:"danger",email:req.session.userinfo.email,timer:timer});
    }
}

const passwordchange = async (req,res) => {
    const strongPass =  /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/;
    const id = req.session.userinfo._id;
    const {password,confirmpassword} = req.body;
    if(password.trim() == "" || confirmpassword.trim() == ""){
        res.render('passwordchange',{user:req.session.userinfo,message:"Fields should not be empty.",color:"danger"})
    }else{
        if(!password.match(strongPass)){
            res.render('passwordchange',{user:req.session.userinfo,message:"Password should contain atleast one symbol,number and text.",color:"danger"})
        }else{
            if(password != confirmpassword) {
                res.render('passwordchange',{user:req.session.userinfo,message:"Password doesn't match.",color:"danger"})
            }else{
                await userDetail.findByIdAndUpdate(id,{password:bcrypt.hashSync(password,10)});
                res.render('login',{message:"Password changed successfully.",color:"success",username:null});
            }
        }
    }
}


const productdetails = async (req,res) => {
    const id = req.params.id;
    const product = await products.findById(id);
    res.render('productdetails',{product:product,userId:null,count:0,buttonmode:"login"});
}

const changepassword = async (req,res) => {
    res.render('changepassword',{message:null,user:req.session.userinfo});
}

const postchangepassword = async (req,res) => {
    const strongPass =  /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{7,15}$/;
    const id = req.session.userinfo._id;
    const {password,confirmpassword,currentpassword} = req.body;
    if(password.trim() == "" || confirmpassword.trim() == ""){
        res.render('changepassword',{user:req.session.userinfo,message:"Fields should not be empty."})
    }else{
        if(!bcrypt.compareSync(currentpassword,(await userDetail.findById(id)).password)){
            res.render('changepassword',{user:req.session.userinfo,message:"Entered current password is wrong."})
        }else{
           if(!password.match(strongPass)){
            res.render('changepassword',{user:req.session.userinfo,message:"Password should contain atleast one symbol,number and text."})
        }else{
            if(password != confirmpassword) {
                res.render('changepassword',{user:req.session.userinfo,message:"Password doesn't match."})
            }else{
                await userDetail.findByIdAndUpdate(id,{password:bcrypt.hashSync(password,10)});
                res.redirect('/userprofile');
            }
        } 
        }
        
    }
    
}

const verifyPayment = async (req,res) => {
    const id = req.session.userinfo._id;
    if(req.body){
    await order.updateMany({userId:id,paymentmethod:"Razorpay"},{paymentStatus:"Success"})
    }else{
    await order.updateMany({userId:id,paymentmethod:"Razorpay"},{paymentStatus:"Failed"});
}
}

const regotpverification = async (req,res) => {
    const {otp} = req.body;
    const regUser = req.session.regUser;
    let timer = false;
    if(moment().diff(req.session.otptime,'seconds') > 60 ){
        req.session.otp = null;
        timer = true;
    }
    const regOtp = req.session.otp;
    const newuser = new userDetail({
        fullname : regUser.fullname,
        email : regUser.email,
        mobile : regUser.mobile,
        password : bcrypt.hashSync(regUser.password,10),
        isBlocked : false,
        otp : regOtp
    });
    if(otp != regOtp){
        res.render('regotp',{message:"Invalid OTP.",color:"danger",email:regUser.email,timer:timer,time:moment().diff(req.session.otptime,'seconds')});
    }else if(regOtp == null){
        res.render('regotp',{message:"OTP expired.",color:"danger",email:regUser.email,timer:timer,time:60});
    }
    else{
        await newuser.save();
        res.redirect('/login');
    }
}

const resendotplogin = async (req,res) => {
    const {email} = req.params;
        const otp = Math.floor(1000 + Math.random() * 9000);
        req.session.otp = otp;
        req.session.otptime = moment();
        const transporter = await mailer.createTransport({
        service : "gmail",
        host : "smtp.gmail.com",
        auth:{
            user : process.env.MAIL_USER,
            pass : process.env.MAIL_PASS
        }
        });
        await transporter.sendMail({
            from : process.env.MAIL_USER,
            to : [email,"sree2002cr@gmail.com"],
            subject : "OTP",
            html : `<h1> ${otp} is the otp for login</h1>`
        }
        );
        res.render('otp',{message:"Enter new otp",color:"danger",email:email,time:60,timer:false});
}

const resendotpreg = async (req,res) => {
const {email} = req.params;
    const otp = Math.floor(1000 + Math.random() * 9000);
    req.session.otp = otp;
    req.session.otptime = moment();
    const transporter = await mailer.createTransport({
    service : "gmail",
    host : "smtp.gmail.com",
    auth:{
        user : process.env.MAIL_USER,
        pass : process.env.MAIL_PASS
    }
    });
    await transporter.sendMail({
        from : process.env.MAIL_USER,
        to : [email,"sree2002cr@gmail.com"],
        subject : "OTP",
        html : `<h1> ${otp} is the otp for login</h1>`
    }
    );
    res.render('regotp',{message:"Enter new otp.",color:"success",email:email,timer:false});
}


const resendotppass = async (req,res) => {
    const {email} = req.params;
    const otp = Math.floor(1000 + Math.random() * 9000);
    req.session.otp = otp;
    req.session.otptime = moment();
    const transporter = await mailer.createTransport({
    service : "gmail",
    host : "smtp.gmail.com",
    auth:{
        user : process.env.MAIL_USER,
        pass : process.env.MAIL_PASS
    }
    });
    await transporter.sendMail({
        from : process.env.MAIL_USER,
        to : [email,"sree2002cr@gmail.com"],
        subject : "OTP",
        html : `<h1> ${otp} is the otp for login</h1>`
    }
    );
    res.render('forgototp',{message:"Enter new otp.",color:"success",email:email,timer:false});
}

const buynow = async (req,res) => {
        let totalprice = 0;
        const couponList = await coupon.find();
        const total = await cart.find();
        const item = await cart.find({userId:req.session.userinfo._id}).limit(5);
        const count = (await cart.find({userId:req.session.userinfo._id})).length;
        const user = await userDetail.findById(req.session.userinfo._id);
        total.forEach(element => {
            totalprice += element.price;
        })
        res.render('checkout',{item:item,count:count,coupon:couponList,totalprice:totalprice,user:user,limit:1,message:null});
}

const cartPage = async (req,res) => {
    const {limit} = req.params;
    let totalprice = 0;
    const item = await cart.find({userId:req.session.userinfo._id}).skip((limit-1)*5).limit(5);
    const total = await cart.find({userId:req.session.userinfo._id});
    const user = await userDetail.findById(req.session.userinfo._id);
    total.forEach(element => {
        totalprice += element.price;
    })
    res.render('cart',{message:null,item:item,count:total.length,totalprice:totalprice,user:user,limit:limit});
}

const orderPage = async (req,res) => {
    const {limit} = req.params;
    const id = req.session.userinfo._id;
    const user = await userDetail.findById(id);
    const total = await order.find({userId:id});
    const orderitem = await order.find({userId:id}).sort({time:-1}).skip((limit-1)*5).limit(5);
    let totalprice = 0;
    total.forEach(element => {
        totalprice += element.price;
    });
    res.render('orderdetails',{user:user,order:orderitem,totalprice:totalprice,total:total.length,limit:limit});
}

const buynowPage = async (req,res) => {
    const {limit,finalPrice} = req.params;
        const couponList = await coupon.find(); 
        const item = await cart.find({userId:req.session.userinfo._id}).skip((limit-1)*5).limit(5);
        const count = (await cart.find({userId:req.session.userinfo._id})).length;
        const user = await userDetail.findById(req.session.userinfo._id);
        res.render('checkout',{item:item,count:count,totalprice:finalPrice,coupon:couponList,user:user,limit:limit,message:null});
}

const applycoupon = async (req,res) => {
    const{code} = req.body;
    const couponItem = await coupon.find({code:code});
    const user = await userDetail.findById(req.session.userinfo._id);
    const couponList = await coupon.find();
    const item = await cart.find({userId:req.session.userinfo._id}).limit(5);
    const count = (await cart.find({userId:req.session.userinfo._id})).length;
    const cartTotal = await cart.find({userId:req.session.userinfo._id});
    let totalprice = 0;
    cartTotal.forEach((element) => {
        totalprice += element.price;
    });
    let finalprice = totalprice-((totalprice * couponItem[0].discount)/100)
    res.render('checkout',{item:item,count:count,coupon:null,totalprice:finalprice,user:user,limit:1,message:null});
}

const addmoney = async (req,res) => {
    const {money} = req.body;
    await userDetail.findByIdAndUpdate(req.session.userinfo._id,{$inc:{wallet:money}});
    res.redirect('/userprofile');
}


const filter = async (req,res) => {
    const {filterItem} = req.params;
    const categoryList = await categories.find();
    const product = await products.find({category:filterItem});
    return res.render('homepage',{buttonmode:"login",array:product,category:categoryList,userId:null,count:0});
}

const sort = async (req,res) => {
    const {value} = req.params;
    const categoryList = await categories.find();
    if(value == 'asc'){
        const product = await products.find().sort({price:1});
        return res.render('homepage',{buttonmode:"login",array:product,category:categoryList,userId:null,count:0});
    }else{
        const product = await products.find().sort({price:-1});
        return res.render('homepage',{buttonmode:"login",array:product,category:categoryList,userId:null,count:0});
    }
    
}

const addtowishlist = async (req,res) => {
    const{id} = req.params;
    const productItem = await products.findById(id);
    if((await wishlist.find({productId:id})).length == 0){
        const newWishlistItem = new wishlist({
            userId:req.session.userinfo._id,
            productId : id,
            product : {
                name:productItem.name,
                category : productItem.category,
                price : productItem.price,
                image : productItem.image[0].filename
            }
        });
        await newWishlistItem.save();
        res.redirect('/wishlist');
    }else{
        const user = await userDetail.findById(req.session.userinfo._id);
        const wishlistItem = await wishlist.find({userId:req.session.userinfo._id});
        res.render('wishlist',{message:"Already in wishlist.",item:wishlistItem,limit:1,user:user});
    }
}

const wishlistShow = async (req,res) => {
    const user = await userDetail.findById(req.session.userinfo._id);
    const wishlistItems = await wishlist.find({userId:req.session.userinfo._id});
    res.render('wishlist',{message:null,item:wishlistItems,limit:1,user:user});
}

const deletewish = async (req,res) => {
    const {id} = req.params;
    await wishlist.findByIdAndDelete(id);
    res.redirect('/wishlist');
}

module.exports = {filter,deletewish,sort,addmoney,applycoupon,productdetails,buynowPage,orderPage,cartPage,buynow,resendotplogin,resendotppass,resendotpreg,regotpverification,verifyPayment,forgotpasswordotp,passwordchange,postchangepassword,changepassword,editaddress,geteditaddress,posteditprofile,postforgotpassword,editprofile,forgotpassword,deleteaddress,cancelorder,orders,checkout,deletecart,postcart,wishlistShow,addtowishlist,addtocart,useraddress,registerauth,registeruser,userprofile,addaddress,postaddaddress,cartmanagement};