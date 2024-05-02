const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const productSchema = new Schema({
    name : String,
    category : String,
    price : Number,
    quantity : Number,
    description : String,
    image : [Object],
    offer: Boolean,
    offerprcnt : Number,
    offerPrice : Number
});

const products = model('product',productSchema);

module.exports = products;