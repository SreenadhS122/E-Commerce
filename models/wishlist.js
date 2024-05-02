const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const wishlistSchema = new Schema({
    userId : ObjectId,
    productId : ObjectId,
    product : {
        name : String,
        category : String,
        image : String,
        price : Number,
    },
});

const wishlist = model('wishlist',wishlistSchema);

module.exports = wishlist;