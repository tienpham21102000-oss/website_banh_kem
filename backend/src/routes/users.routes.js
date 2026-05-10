const express = require('express');
const UsersController = require('../controllers/UsersController');
const { authMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);
router.get('/me', UsersController.getCurrentProfile);
router.patch('/me', UsersController.updateProfile);
router.get('/addresses', UsersController.getUserAddresses);
router.post('/addresses', UsersController.addAddress);
router.patch('/addresses/:addressId', UsersController.updateAddress);
router.delete('/addresses/:addressId', UsersController.deleteAddress);

module.exports = router;
