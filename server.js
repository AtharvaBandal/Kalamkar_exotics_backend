const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
require('dotenv').config();
const path = require('path');

const authRoutes = require('./routes/authRoutes');
const orderRoutes = require('./routes/orderRoutes');

// dotenv.config();

const app = express();


// Stripe webhook needs raw body - place this BEFORE express.json()
app.post(
  '/api/orders/webhook',
  express.raw({ type: 'application/json' }),
  require('./controllers/orderController').handleStripeWebhook
);

// Static files
app.use('/profile-images', express.static(path.join(__dirname, 'public/profile-images')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));


// Middleware
app.use(cors({
  origin: 'https://kalamkarexotics.netlify.app',
  credentials: true
}));
app.use(express.json()); // Must come AFTER the raw body handler above

// Routes
app.get('/payment-success', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Thank You - Kakamkar Exotics</title>
      <style>
        body {
          margin: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #e0f7ec, #ffffff);
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          text-align: center;
          color: #333;
        }

        .container {
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          max-width: 500px;
          width: 90%;
          animation: fadeIn 0.8s ease-in-out;
        }

        h1 {
          font-size: 2.5rem;
          color: #28a745;
          margin-bottom: 10px;
        }

        p {
          font-size: 1.1rem;
          margin: 10px 0;
        }

        .footer {
          margin-top: 30px;
          font-size: 0.9rem;
          color: #888;
        }

        .countdown {
          font-size: 0.8rem;
          margin-top: 10px;
          color: #666;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎉 Thank You!</h1>
        <p>Your order has been placed successfully.</p>
        <p>It will be delivered shortly to your location.</p>
        <p style="font-weight: bold;">– From all of us at Kakamkar Exotics 🌿</p>
        <div class="countdown">
          This page will close automatically in <span id="timer">5</span> seconds...
        </div>
        <div class="footer">
          You can now safely close this tab or wait to be redirected.
        </div>
      </div>

      <script>
        let timeLeft = 10;
        const timerEl = document.getElementById('timer');
        const interval = setInterval(() => {
          timeLeft--;
         if (timeLeft <= 0) {
            clearInterval(interval);
            window.opener.postMessage('payment-success', 'https://kalamkarexotics.netlify.app/'); // ✅ notify parent tab
            window.close();
          }
          else {
            timerEl.textContent = timeLeft;
          }
        }, 1000);
      </script>
    </body>
    </html>
  `);
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

// Connect DB and start server
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    app.listen(process.env.PORT || 3000, () =>
      console.log('Server running on port', process.env.PORT || 3000)
    );
  })
  .catch(err => console.error(err));