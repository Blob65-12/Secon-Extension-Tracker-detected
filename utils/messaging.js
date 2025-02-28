// utils/messaging.js
export class MessagingSystem {
  static sendMessage(type, data = {}) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, ...data }, resolve);
    });
  }
  
  static addListener(type, callback) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === type) {
        const response = callback(message, sender);
        
        if (response instanceof Promise) {
          response.then(sendResponse);
          return true; // Возвращаем true для асинхронного ответа
        } else {
          sendResponse(response);
        }
      }
    });
  }
}

// Использование:
// В background.js
MessagingSystem.addListener('blockDomain', async (message) => {
  const { domain } = message;
  const success = await blocker.addToBlocklist(domain);
  return { success };
});

// В другом скрипте
const response = await MessagingSystem.sendMessage('blockDomain', { domain: 'tracker.com' });
console.log('Результат блокировки:', response.success);