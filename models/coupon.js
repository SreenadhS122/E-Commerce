const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const couponSchema = new Schema({
    name : String,
    discount : Number,
    code : String
    
});

const coupon = model('coupon',couponSchema);

module.exports = coupon;