const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: String,
    image:String,
    stock:Number,
    price:Number,
    soldAt:[{date:Date,quantity:Number}],
    restockAt: [{date:Date,quantity:Number}],
    category: [{type: mongoose.Schema.Types.ObjectId, ref : 'categories'}], 
});

const Product = mongoose.model('products', productSchema);

module.exports = Product;
