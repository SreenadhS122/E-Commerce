const mongoose = require('mongoose');
const {Schema,model} = mongoose;
const bcrypt = require('bcrypt');

const adminSchema = new Schema({
    username : String,
    password : String,
});

const admins = model('admin',adminSchema);

module.exports = admins;