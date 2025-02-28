// utils/error-handler.js
export class ErrorLogger {
    static async logError(module, action, error) {
        console.error(`[${module}][${action}] Ошибка:`, error);

        const data = await new Promise((resolve) => {
            chrome.storage.local.get('errorLog', resolve);
        });

        const errorLog = data.errorLog || [];
        errorLog.push({
            module,
            action,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });

        // Ограничиваем размер лога
        if (errorLog.length > 100) {
            errorLog.splice(0, errorLog.length - 100);
        }

        await new Promise((resolve) => {
            chrome.storage.local.set({ errorLog }, resolve);
        });
    }
}

// Использование:
try {
    // Какой-то код
} catch (error) {
    ErrorLogger.logError('TrackerDetector', 'analyzeScript', error);
}