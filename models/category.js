const mongoose = require('mongoose');
const {Schema,model} = mongoose;

const categorySchema = new Schema({
    name : String,
    description : String,
    image : String
    
});

const categories = model('category',categorySchema);

module.exports = categories;