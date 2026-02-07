const express = require('express');
const stripe = require('stripe')('your_secret_key');
const admin = require('firebase-admin');

// Инициализация Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  databaseURL: 'https://your-project.firebaseio.com'
});

const app = express();

// Создание сессии оплаты
app.post('/create-checkout-session', async (req, res) => {
  const { priceId, extensionId, userId } = req.body;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price: priceId,
      quantity: 1,
    }],
    mode: 'subscription',
    success_url: `chrome-extension://${extensionId}/success.html?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `chrome-extension://${extensionId}/cancel.html`,
    client_reference_id: userId,
  });

  res.json({ id: session.sessionId });
});

// Webhook для обработки событий Stripe
app.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, 'whsec_your_webhook_secret');
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    await activatePremium(session.client_reference_id);
  }

  res.json({ received: true });
}); 