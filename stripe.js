// Создаем конфигурацию Stripe
const stripe = Stripe('your_publishable_key');

// Функция для создания сессии оплаты
async function createCheckoutSession(priceId) {
  try {
    const response = await fetch('https://your-backend.com/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        priceId: priceId,
        extensionId: chrome.runtime.id,
        userId: await getUserId() // Получаем ID пользователя
      })
    });
    
    const session = await response.json();
    return stripe.redirectToCheckout({ sessionId: session.id });
  } catch (err) {
    console.error('Error creating checkout session:', err);
  }
} 