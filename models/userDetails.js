const mongoose = require('mongoose');
const {Schema,model} = mongoose;



const userSchema = new Schema({
   fullname : {
      type : String
   },
   email : {
      type : String
   },
   address : [String],
   mobile : {
      type : String
   },
   password :{
      type : String
   },
   isBlocked : {
      type : Boolean
   },
   otp : {
      type : String
   },
   wallet : {
      type : Number 
   }
});

const userDetail = model("userdetail",userSchema);

module.exports = userDetail;