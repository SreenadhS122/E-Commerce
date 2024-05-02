const adminSession = (req,res,next) => {
    if(req.session.admin){
        next();
    }else{
        res.redirect('/login');
    }
}

module.exports = {adminSession};