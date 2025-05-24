const Order = require('../models/Order');

exports.createOrder = async (req, res) => {
  console.log(1111111);
  
  console.log("Incoming Order:", req.body);

  const { hotelName, items, note, totalQuantity, status } = req.body;

  if (!hotelName || !items || items.length === 0) {
    return res.status(400).json({ error: 'Hotel name and at least one item are required' });
  }

  try {
    const order = await Order.create({
      hotelName,
      items,
      note,
      totalQuantity,
      status,
      date: new Date().toISOString(),
      user: req.user?.id || '664d2a14d4a8b99f7c4fc000' // fallback for Postman
    });

    res.status(201).json(order);
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(400).json({ error: 'Order creation failed' });
  }
};

exports.getUserOrders = async (req, res) => {
  console.log(2222);
  
  try {
    if (!req.user || !req.user._id) {
      console.error('Missing user info in req.user:', req.user);
      return res.status(401).json({ error: 'Unauthorized user' });
    }

    console.log('Fetching orders for user:', req.user._id);

    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
};

