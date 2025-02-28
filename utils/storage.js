// utils/storage.js
export class StorageManager {
  async getData(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (data) => {
        resolve(data[key]);
      });
    });
  }
  
  async setData(key, value) {
    return new Promise((resolve) => {
      const data = {};
      data[key] = value;
      chrome.storage.local.set(data, resolve);
    });
  }
}

// В другом файле:
const storage = new StorageManager();
async function updateSettings() {
  try {
    const settings = await storage.getData('settings');
    settings.enabled = true;
    await storage.setData('settings', settings);
    console.log('Настройки обновлены');
  } catch (error) {
    console.error('Ошибка обновления настроек:', error);
  }
}