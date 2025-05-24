const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hotelName: String,
  items: [
    {
      id: Number,
      name: String,
      quantity: String,
      unit: String,
      image: String,
    }
  ],
  note: String,
  date: String,
  totalQuantity: String,
  status: { type: String, default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);