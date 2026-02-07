// В background.js расширения
async function handleRecovery(email) {
  try {
    const response = await fetch('https://your-backend.com/recover-premium', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });
    
    const { success, token } = await response.json();
    if (success) {
      // Сохраняем токен восстановления
      await chrome.storage.local.set({ 
        recoveryToken: token,
        email: email 
      });
    }
    return success;
  } catch (err) {
    console.error('Recovery error:', err);
    return false;
  }
}

// На сервере
app.post('/recover-premium', async (req, res) => {
  const { email } = req.body;
  
  try {
    // Поиск пользователя в Firebase
    const userSnapshot = await admin.database()
      .ref('users')
      .orderByChild('email')
      .equalTo(email)
      .once('value');
    
    const userData = userSnapshot.val();
    if (userData && userData.premium.active) {
      // Генерируем токен восстановления
      const recoveryToken = generateRecoveryToken();
      
      // Сохраняем токен в базе
      await admin.database()
        .ref(`users/${Object.keys(userData)[0]}/recoveryToken`)
        .set(recoveryToken);
      
      // Отправляем email с инструкциями
      await sendRecoveryEmail(email, recoveryToken);
      
      res.json({ success: true, token: recoveryToken });
    } else {
      res.json({ success: false, error: 'User not found or premium not active' });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}); 