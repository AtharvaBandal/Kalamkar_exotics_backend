const Stripe = require('stripe');
const Order = require('../models/Order');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ COD Order
exports.createOrder = async (req, res) => {
  console.log('Received Order:', req.body);

  const {
    hotelName,
    items,
    note,
    totalQuantity,
    totalPrice,
    status,
    paymentMethod
  } = req.body;

  if (!hotelName || !items || items.length === 0 || !totalPrice) {
    return res.status(400).json({ error: 'Missing required order data' });
  }

  if (paymentMethod !== 'COD') {
    return res.status(400).json({ error: 'Only COD orders should be created directly' });
  }

  try {
    const order = await Order.create({
      hotelName,
      items,
      note,
      totalQuantity,
      amount: totalPrice,
      status: status || 'pending',
      date: new Date().toISOString(),
      paymentMethod: 'COD',
      user: req.user?.id || '664d2a14d4a8b99f7c4fc000' // fallback
    });

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Order creation failed' });
  }
};

// ✅ Get User Orders
exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

// ✅ Stripe Checkout
exports.createStripeCheckout = async (req, res) => {
  console.log("Creating Stripe Checkout Session with data:");

  try {
    const {
      hotelName,
      items,
      note,
      totalQuantity,
      totalPrice,
      status
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items provided for the order' });
    }

    // Create the order first in the database
    const newOrder = await Order.create({
      hotelName,
      items,
      note,
      totalQuantity,
      amount: totalPrice,
      status: status || 'pending',
      date: new Date().toISOString(),
      paymentMethod: 'Online',
      user: req.user?.id || '664d2a14d4a8b99f7c4fc000'
    });

    // Prepare Stripe line items
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: `${item.name} (${item.unit})`,
          description: `Qty: ${item.quantity}, ₹${item.price.toFixed(2)} each`,
          images: ['https://kalamkar-exotics-backend.onrender.com/images/stripeImage.png'],
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: Number(item.quantity),
    }));

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment-cancel`,
      metadata: {
        orderId: newOrder._id.toString()
      }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Stripe session creation failed' });
  }
};

// ✅ Stripe Webhook
exports.handleStripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const orderId = session.metadata.orderId;

    try {
      const order = await Order.findById(orderId);
      if (order) {
        order.status = 'Paid';
        await order.save();
        console.log(`✅ Order ${orderId} marked as Paid`);
      } else {
        console.warn(`⚠️ Order ID ${orderId} not found in DB`);
      }
    } catch (err) {
      console.error('Failed to update order from Stripe webhook:', err);
    }
  }

  res.json({ received: true });
};
