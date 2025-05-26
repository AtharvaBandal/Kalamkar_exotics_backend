const express = require('express');
const {
  createOrder,
  getUserOrders,
  createStripeCheckout,
  handleStripeWebhook
} = require('../controllers/orderController');
const protect = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createOrder);
router.get('/', protect, getUserOrders);
router.post('/create-checkout-session',protect, createStripeCheckout);
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

module.exports = router;
