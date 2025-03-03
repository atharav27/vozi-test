// backend/server.js
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import axios from 'axios';
import bodyParser from 'body-parser';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); 

// Route: Create Payment Session
app.post('/create-payment-session', async (req, res) => {
  try {
    const { order_amount, customer_details } = req.body;

    // Check if all required fields are present
    if (!order_amount || !customer_details || 
        !customer_details.customer_name || 
        !customer_details.customer_email || 
        !customer_details.customer_phone) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const orderId = `ORDER_${Date.now()}`;
    
    const requestBody = {
      order_id: orderId,
      order_amount: order_amount,
      order_currency: 'INR',
      customer_details: {
        customer_id: `CUST_${Date.now()}`,
        customer_name: customer_details.customer_name,
        customer_email: customer_details.customer_email,
        customer_phone: customer_details.customer_phone,
      },
      order_meta: {
        return_url: `${process.env.RETURN_URL}?order_id={order_id}`,
        notify_url: process.env.NOTIFY_URL
      }
    };

    console.log('Sending request to Cashfree:', {
      url: process.env.CASHFREE_API_URL,
      body: requestBody,
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2022-09-01'
      }
    });

    const response = await axios({
      method: 'post',
      url: process.env.CASHFREE_API_URL,
      headers: {
        'x-client-id': process.env.CASHFREE_APP_ID,
        'x-client-secret': process.env.CASHFREE_SECRET_KEY,
        'x-api-version': '2022-09-01',
        'Content-Type': 'application/json'
      },
      data: requestBody
    });

    console.log('Cashfree Response:', response.data);
  
    if (response.data.payment_session_id) {
      res.json({ 
        sessionId: response.data.payment_session_id, 
        orderId: orderId 
      });
    } else {
      res.status(500).json({ error: 'Failed to generate payment session' });
    }
  } catch (error) {
    console.error('Error creating payment session:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Internal Server Error',
      details: error.response?.data || error.message 
    });
  }
});
// Route: Welcome Message
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Backend!' });
});

// Route: Handle Success Callback
// app.get('/payment-success', (req, res) => {
//   res.send('Payment Successful! You can now navigate back to your app.');
// });

// Route: Handle Failure Callback
// app.get('/payment-failure', (req, res) => {
//   res.send('Payment Failed! Please try again.');
// });

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
