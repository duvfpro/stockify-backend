//#region imports
const mongoose = require('mongoose');
var express = require('express');
var router = express.Router();

const Category = require ('../models/categories')
const Product = require('../models/products'); 

const { checkBody } = require("../modules/checkBody");

//#endregion


//#region POST method


router.post('/newCategory', async (req, res) => {
    const { name, image } = req.body;

    try {
        const existingCategory = await Category.findOne({ name })

        if (existingCategory) {
            return res.json({ result: false, error: 'Category already exist' });
        }

        const newCategory = new Category({
            name,
            image,
        });

        const savedCategory = await newCategory.save();
        res.json({ result: true, newCategory: savedCategory })

    }
    catch (error) {
        res.status(500).json({ result: false, error: 'Failed to create new category' });
    }

})



// Route update d'une category
router.put('/updateMyCategory/:name', (req, res) => {

  if (!checkBody(req.body, ["name"])) {
      res.json({ result: false, error: "Missing or empty fields" });
      return;
  };

  Category.findOne({name: req.params.name})
  .then(data => {
      Category.updateOne({name: req.params.name}, {name: req.body.name})
      .then(() => {
          Category.find().then(() => { res.json({ result: true, updatedCategory: data});
          });
      });
  })
});

//#endregion 

//#region DELETE method

router.delete('/deleteMyCategory/:name', async (req, res) => {
    try {
      const deletionResult = await Category.deleteOne({ name: req.params.name });
      
      if (deletionResult.deletedCount === 1) {
        return res.json({ result: true, message: 'Category deleted successfully' });
      } else {
        return res.json({ result: false, error: 'Category not found or already deleted' });
      }
  
    } catch (error) {
      res.status(500).json({ result: false, error: 'Failed to delete category' });
    }
  });
  


//#endregion

//#region GET method 

router.get('/allCategories', async (req, res) => {
    try {
        const categories = await Category.find();

        if (categories.length > 0) {
            return res.json({ result: true, allCategories: categories });
        } else {
            return res.json({ result: false, error: 'No categories found' });
        }

    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ result: false, error: 'Failed to fetch categories' });
    }
});




module.exports = router;