const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const offerSchema = new Schema({
    name : String,
    discount : Number,
    discription : String
    
});

const offer = model('offer',offerSchema);

module.exports = offer;