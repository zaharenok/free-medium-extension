// Функция для шифрования данных
function encryptData(data, key) {
  const algorithm = 'AES-GCM';
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  return crypto.subtle.encrypt(
    {
      name: algorithm,
      iv: iv
    },
    key,
    new TextEncoder().encode(JSON.stringify(data))
  ).then(encrypted => {
    return {
      encrypted: Array.from(new Uint8Array(encrypted)),
      iv: Array.from(iv)
    };
  });
}

// Функция для расшифровки данных
function decryptData(encrypted, key, iv) {
  return crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: new Uint8Array(iv)
    },
    key,
    new Uint8Array(encrypted)
  ).then(decrypted => {
    return JSON.parse(new TextDecoder().decode(decrypted));
  });
}

// Использование в расширении
async function storePremiumData(data) {
  const key = await generateKey();
  const encrypted = await encryptData(data, key);
  
  await chrome.storage.local.set({
    premiumData: encrypted.encrypted,
    iv: encrypted.iv
  });
} 