const logoutsessiondestroy = (req,res) => {
    if(req.session.user){
        delete req.session.user;
    }else if(req.session.admin){
        delete req.session.admin;
    }
    return res.redirect('/');
};

module.exports = {logoutsessiondestroy};