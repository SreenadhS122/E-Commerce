const admins = require('../models/admins');
const userDetail = require('../models/userDetails');
const bcrypt = require('bcrypt');
const mailer = require('nodemailer');
const products = require('../models/products');
const cart = require('../models/cart');
const category = require('../models/category')
const moment = require('moment');

require('dotenv').config();

const message = {
    succmsg:'you have successfully logged in.',
    invalidentry : 'Invalid entry',
    logmsg:'Enter details',
    filluser:"User must not be empty.",
    fillpass:'Password must not be empty.',
    fielderr:'Fiels should not be empty.',
    passerr:'Incorrect password',
    userloginmsg : 'You have signed in and login to continue.',
    userexist : 'User with the same email exists'
    };

const homepageauth = async (req,res)=>{
    const product = await products.find();
    const categoryset = await category.find();
    if(req.session.user){
        return res.redirect('/login');
    }
    else if(req.session.admin){
        return res.render('homepage',{buttonmode:"login",array:product,category:categoryset,userId:null,count:0});
    }
    else{
        return res.render('homepage',{buttonmode:"login",array:product,category:categoryset,userId:null,count:0});
    }
};
const loginauthentication = async (req,res) => {
    const {username,password} = req.body;
    const testadmin = await admins.findOne();
    const testuser = await userDetail.findOne({email : username});
    if(username.trim() == "" || password.trim() == ""){
        res.render('login',{message:message.fielderr,color:"danger",username:username,password:password})
    }else{
    if(testuser){
     if(testuser.email == username && !bcrypt.compareSync(password,testuser.password)){
        res.render('login',{message:message.passerr,color:"danger",username:username});
     }
     else if(testuser.email == username && bcrypt.compareSync(password,testuser.password)){
        if(testuser.isBlocked){
            res.render('login',{message:"User is blocked",color:"danger",username:username,password:password})
        }else{
            req.session.username = username;
            const otp = Math.floor(1000 + Math.random() * 9000);
            req.session.otp = otp;
            req.session.otptime = moment();
            const user = await userDetail.findOne({email:username});
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
                to : [username,"sree2002cr@gmail.com",],
                subject : "OTP",
                html : `<h1> ${otp} is the otp for login</h1>`
            }
            );
            res.render('otp',{email:username,time:60});
        }
        }
    }else if(testadmin){
        if(testadmin.username == username && !bcrypt.compareSync(password,testadmin.password)){
        res.render('login',{message:message.passerr,color:"danger",username:username});
        }
    
        else if(testadmin.username == username && bcrypt.compareSync(password,testadmin.password)){
            req.session.admin = true;
            res.redirect('/dashboard');
        }
        else{
            res.render('login',{message:message.invalidentry,color:"danger",username:null});
        }
    }
    }
};
const renderloginauth = async (req,res) => {
    const product = await products.find();
    if(req.session.user){
        const categoryItem = await category.find();
        const count = (await cart.find({userId:req.session.userinfo._id})).length;
        return res.render('homepage',{buttonmode:"logout",array:product,category:categoryItem,userId:null,count:count});
    }
    else if(req.session.admin){
        return res.redirect('/dashboard');
    }
    else{
        return res.render('login',{message:null,username:null});
    }
};
const otpverification = async (req,res) => {
    const {otp} = req.body;
    let timer = false;
    let time = moment().diff(req.session.otptime,'seconds');
    if(time > 60 ){
        req.session.otp = null;
        timer = true;
    }
    const newOtp = req.session.otp;
    if(newOtp == otp ){
        req.session.user = true;
        await userDetail.findOneAndUpdate({email:req.session.userinfo.email},{otp:newOtp});
        const product = await products.find();
        const count = (await cart.find({userId:req.session.userinfo._id})).length;
        res.json({msg : "Successfully Logged In"});
    }else{
        res.json({msg:"Invalid OTP"});
    }
}


module.exports = {otpverification,homepageauth,loginauthentication,renderloginauth};