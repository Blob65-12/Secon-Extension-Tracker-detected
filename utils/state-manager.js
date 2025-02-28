// utils/state-manager.js
export class StateManager {
  constructor() {
    this.listeners = new Map();
    this.state = {};
  }
  
  // Инициализация состояния из хранилища
  async initialize() {
    return new Promise((resolve) => {
      chrome.storage.local.get(null, (data) => {
        this.state = data;
        resolve();
      });
    });
  }
  
  // Получение состояния
  get(key) {
    return this.state[key];
  }
  
  // Обновление состояния
  async set(key, value) {
    this.state[key] = value;
    
    // Уведомляем слушателей
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => callback(value));
    }
    
    // Сохраняем в хранилище
    return new Promise((resolve) => {
      const data = {};
      data[key] = value;
      chrome.storage.local.set(data, resolve);
    });
  }
  
  // Добавление слушателя изменений
  subscribe(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, []);
    }
    
    this.listeners.get(key).push(callback);
    
    // Возвращаем функцию для отписки
    return () => {
      const callbacks = this.listeners.get(key);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }
}

// Создаем глобальный менеджер состояния
export const stateManager = new StateManager();