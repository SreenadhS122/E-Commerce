const userDetail = require('../models/userDetails');

const userSession = async (req,res,next) => {
    if(req.session.user){
        const status = await userDetail.find({_id:req.session.userinfo._id},{isBlocked:1})
        if(!status[0].isBlocked){
            next();
        }else{
            res.redirect('/login');
        }
    }else{
        res.redirect('/login');
    }
}

module.exports = {userSession};