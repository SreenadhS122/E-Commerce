const express = require('express');
const app = express();
const session = require('express-session')
const cache = require('nocache');
const logger = require('morgan');
const mongoose = require('mongoose');
const loginroute = require('./routes/loginroute');
const adminroute = require('./routes/adminroute');
const userroute = require('./routes/userroute');
const logoutroute = require('./routes/logoutroute');
require('dotenv').config();

async function mongo(){
    await mongoose.connect(process.env.MONGODB_URL);
}
mongo();

app.set('view engine','ejs');
app.use(express.static('views'));
app.use(express.urlencoded({extended : true}));
app.use(session({
    secret : 'secret',
    resave : false,
    saveUninitialized :false,
    cookie : {maxAge : 3600000}
}));
app.use(express.json());
app.use(cache());
app.use(logger('dev'));
app.use('/',adminroute);
app.use('/',userroute);
app.use('/',loginroute);
app.use('/',logoutroute);

app.listen(process.env.PORT || 8080);