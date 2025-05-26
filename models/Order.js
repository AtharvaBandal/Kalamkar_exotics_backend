const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hotelName: { type: String, required: true },
  items: [
    {
      id: Number,
      name: String,
      quantity: Number,
      unit: String,
      image: String
    }
  ],
  note: String,
  date: String,
  totalQuantity: Number,
  amount: Number,
  paymentMethod: { type: String, enum: ['COD', 'Online'], default: 'COD' },
  status: { type: String, enum: ['pending', 'Paid', 'Delivered'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
