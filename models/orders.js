const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const orderSchema = new Schema({
    userId : ObjectId,
    productId : ObjectId,
    username : String,
    time : String,
    date : Object,
    product : {
        name : String,
        image : String,
        category : String
    },
    quantity : Number,
    price : Number,
    status : String,
    paymentmethod : String,
    paymentStatus : String 
});

const order = model('order',orderSchema);

module.exports = order;