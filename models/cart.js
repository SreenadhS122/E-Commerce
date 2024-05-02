const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const cartSchema = new Schema({
    userId : ObjectId,
    productId : ObjectId,
    product : {
        name : String,
        category : String,
        image : String,
        price : Number,
        quantity : Number
    },
    quantity : Number,
    price : Number,
    status : String 
});

const cart = model('cart',cartSchema);

module.exports = cart;