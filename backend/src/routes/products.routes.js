const express = require('express');
const ProductController = require('../controllers/ProductController');

const router = express.Router();

router.get('/categories', ProductController.getCategories);
router.get('/', ProductController.getProducts);
router.get('/category/:categoryId', ProductController.getProductsByCategory);
router.get('/:id', ProductController.getProductById);

module.exports = router;
