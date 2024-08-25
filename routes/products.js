var express = require('express');
var router = express.Router();

require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const uniqid = require('uniqid');
const fs = require('fs');

const { checkBody } = require("../modules/checkBody");

//Require Product from Models
const Product = require('../models/products')

///////////////////////////////////////////////////////////////////////////////////////////////////////
//Creation new Product
// Default category ID
const defaultCategoryId = "657ab87025ea6d64cea475e6";

//Creation new Product
router.post('/newProduct', (req, res)=> {
  Product.findOne({name: req.body.name})
  .populate('category')
  .then(data => {
    //Checking if product already exists
    if(data === null) {
        //If not existing = Creation
        if (!checkBody(req.body, ["name", "price"])) {
            res.json({ result: false, error: "Missing or empty fields" });
            return;
        }       

        const newProduct = new Product({
            name: req.body.name,
            image: req.body.image,
            stock: req.body.stock || 0,
            price: req.body.price,
            category: req.body.category || defaultCategoryId, // default category if not provided
        })
        //Saving of the Product
        newProduct.save().then(newProduct => {
            res.json({result: true, newProduct})
        })
    }else{
        //Product already exists
        res.json({result: false, error: 'Product already exists'})
    }
  })
});



///////////////////////////////////////////////////////////////////////////////////////////////////////
//Delete route for Product
///////////////////////////////////////////////////////////////////////////////////////////////////////
router.delete('/deleteProduct/:name', async (req, res) => {
    const name = req.params.name;
  
    try {
        // Ask findOneAndUpdate to return the updated document
        const product = await Product.findOneAndDelete({ name: name })
        .populate('category');
        if (product) {
            res.json({ result: true, message: 'Product deleted successfully' });
        } else {
            res.json({ result: false, error: 'Product not found' });
        }
        } catch (error) {
        res.json({ result: false, error });
        }
  });


///////////////////////////////////////////////////////////////////////////////////////////////////////
//GET All Products
///////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/allProducts', (req, res) => {
    //GET All Products
    Product.find()
    .populate('category')
    .then(data => {
        if (data.length > 0) {
            res.json({ result: true, allProducts: data });
        } else {
            res.json({ result: false, error: 'No Products found' });
        }
    });
});

//////////////////////////
//GET By ID Product
router.get('/', (req, res) => {
    //Const for parameter Id
    const id = req.params.id;
    //Searching par Id
    Product.findOne({ _id: id }).then(data => {
        if (data) {
        res.json({ result: true, allCategory :[] });
        } else {
        res.json({ result: false, error: 'Product not found' });
        } 
    });
});



// Route pour obtenir les stocks de chaque produit au jour de la demande
router.get('/stocksAtDay', (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    Product.find()
      .then(products => {
        const stocksAtDay = [];
  
        products.forEach(product => {
          // On utilise directement la propriété `stock` qui est un nombre
          stocksAtDay.push({
            productId: product._id,
            productName: product.name,
            currentStock: product.stock,
          });
        });
  
        res.json({ result: true, stocksAtDay });
      })
      .catch(error => {
        res.json({ result: false, error: 'Failed to fetch stocks at day', details: error });
      });
  });
  
  


// Route ajout stock
router.put('/addStock/:name/:stock', (req, res) => {
    const todayDate = new Date();
    Product.findOne({name: req.params.name})
    .then(data => {
        Product.updateOne({name: req.params.name}, {stock: parseInt(data.stock) + parseInt(req.params.stock), $push: { restockAt: {date: todayDate, quantity: req.params.stock}}})
        .then(() => {
            Product.find().then(() => { res.json({ result: true, message: "stock added"});
            });
        });
    });
});

// Route sortie de stock stock
router.put('/sell/:name/:stock', (req, res) => {
    const todayDate = new Date();
    Product.findOne({name: req.params.name})
    .then(data => {
        Product.updateOne({name: req.params.name}, {stock: parseInt(data.stock) - parseInt(req.params.stock), $push: { soldAt: {date: todayDate, quantity: req.params.stock}}})
        .then(() => {
            Product.find().then(() => { res.json({ result: true, message: "stock added"});
            });
        }); 
    })
});


// Route update d'un produit
router.put('/updateMyProduct/:name', (req, res) => {

    if (!checkBody(req.body, ["name"])) {
        if(req.body.stock == '' || req.body.stock == null || req.body.price == '' || req.body.price == null)
        res.json({ result: false, error: "Missing or empty fields" });
        return;
    }  

     
    Product.findOne({name: req.params.name})
    .then(data => {
        Product.updateOne({name: req.params.name}, {name: req.body.name, image: req.body.image, category: req.body.category, price: req.body.price, stock: req.body.stock})
        .then(() => {
            Product.find().then(() => { res.json({ result: true, updatedProduct: data});
            });
        });
    })
});


// Route qui retourne tous les produits d'une category
router.post('/productsByCategoryId', (req, res) => {
    Product.find({category: req.body.categoryId})
    .then(data => {
        if (data.length > 0) {
            res.json({ result: true, allProducts: data });
        } else {
            res.json({ result: false, error: 'No Products found' });
        }
    });
});


// Route pour gérer l'upload de fichier photo via Cloudinary

  router.post('/newProductWithImage', async (req, res) => {
    try {
      const existingProduct = await Product.findOne({ name: req.body.name }).populate('category');
  
      if (existingProduct === null) {
        const photoPath = `/tmp/${uniqid()}.jpg`;
        const resultMove = await req.files.photoFromFront.mv(photoPath);
        console.log(photoPath + " " + resultMove)
  
        if (!resultMove) {
          const resultCloudinary = await cloudinary.uploader.upload(photoPath);
  
          const newProduct = new Product({
            name: req.body.name,
            image: resultCloudinary.secure_url,
            stock: req.body.stock || 0,
            price: req.body.price,
            category: req.body.category || defaultCategoryId,
          });
  
          const savedProduct = await newProduct.save();
  
          res.json({ result: true, url: resultCloudinary.secure_url });
        } else {
          res.json({ result: false, error: resultMove });
        }
  
        fs.unlinkSync(photoPath);
      } else {
        res.json({ result: false, error: 'Product already exists' });
      }
    } catch (error) {
      console.error('Error during newProduct creation:', error);
      res.json({ result: false, error: 'An error occurred during newProduct creation' });
    }
  });
  




module.exports = router;