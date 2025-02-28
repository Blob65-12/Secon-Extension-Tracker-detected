/// background/background.js
import { BlockerManager } from './blocker.js';
import { TrackerDetector } from './tracker-detector.js';
import DataVisualizer from '../utils/visualization.js';

// Инициализация компонентов
const blockerManager = new BlockerManager();
const trackerDetector = new TrackerDetector();
const dataVisualizer = new DataVisualizer();

// Инициализация при установке расширения
chrome.runtime.onInstalled.addListener(async () => {
    await chrome.storage.local.set({
        enabled: true,
        blockedTypes: {
            requests: false,
            cookies: false,
            websockets: false,
            trackers: false,
            thirdPartyCookies: false,
            fingerprinting: false
        },
        trackerHistory: [],
        cookieHistory: [],
        collectedInfo: {
            ip: { value: "Неизвестно", collected: false },
            geolocation: { value: "Не определено", collected: false },
            userAgent: { value: navigator.userAgent, collected: false },
            cookies: { value: [], collected: false },
            trackers: [],
            hasRecommendationNotice: false,
            lastUpdated: new Date().toISOString()
        }
    });

    console.log("Расширение успешно инициализировано");

    // Инициализируем блокировщик
    await blockerManager.initialize();
});

// Обработка сообщений от popup и content
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Получено сообщение:", request.type);

    // Получение cookies
    if (request.type === "getCookies") {
        chrome.cookies.getAll({ domain: request.domain }, (cookies) => {
            sendResponse({ cookies: cookies });
        });
        return true;
    }

    // Управление блокировкой
    else if (request.type === "blockData") {

        if (request.dataType === "fingerprinting") {
            // Сохраняем состояние fingerprinting в хранилище
            chrome.storage.local.get('blockedTypes', (data) => {
                const blockedTypes = data.blockedTypes || {};
                blockedTypes.fingerprinting = request.enabled;
                chrome.storage.local.set({ blockedTypes }, () => {
                    sendResponse({ success: true });
                });
            });
            return true;
        }

        blockerManager.updateBlockingType(request.dataType, request.enabled)
            .then(success => {
                sendResponse({ success });
            })
            .catch(error => {
                console.error("Ошибка при блокировке:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }
    // Получение статуса блокировки
    else if (request.type === "getBlockedStatus") {
        sendResponse(blockerManager.blockedTypes);
        return true;
    }

    // Блокировка домена
    else if (request.type === "blockDomain") {
        console.log("Запрос на блокировку домена:", request.domain);
        blockerManager.addDomainToBlocklist(request.domain)
            .then(response => {
                sendResponse(response);
            })
            .catch(error => {
                console.error("Ошибка при блокировке домена:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }

    // Разрешение домена
    else if (request.type === "allowDomain") {
        console.log("Запрос на разрешение домена:", request.domain);
        blockerManager.removeDomainFromBlocklist(request.domain)
            .then(response => {
                sendResponse(response);
            })
            .catch(error => {
                console.error("Ошибка при разблокировке домена:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }

    // Добавьте новый обработчик для получения списка заблокированных доменов
    else if (request.type === "getBlockedDomains") {
        blockerManager.getBlockedDomains()
            .then(domains => {
                sendResponse({ domains });
            })
            .catch(error => {
                console.error("Ошибка при получении заблокированных доменов:", error);
                sendResponse({ domains: [] });
            });
        return true;
    }

    // Получение данных для визуализации
    else if (request.type === "getVisualizationData") {
        sendResponse(dataVisualizer.getDataForVisualization());
        return true;
    }

    // Получение топ доменов трекеров
    else if (request.type === "getTopTrackerDomains") {
        sendResponse({ domains: dataVisualizer.getTopTrackerDomains(request.limit || 5) });
        return true;
    }

    // Получение топ доменов с cookies
    else if (request.type === "getTopCookieDomains") {
        sendResponse({ domains: dataVisualizer.getTopCookieDomains(request.limit || 5) });
        return true;
    }
    // Получение статистики
    else if (request.type === "getStatistics") {
        trackerDetector.getRealTrackerStatistics(request.period)
            .then(statistics => {
                sendResponse(statistics);
            })
            .catch(error => {
                console.error("Ошибка получения статистики:", error);
                sendResponse(null);
            });
        return true;
    }

    // Добавление в белый список
    else if (request.type === "addToWhitelist") {
        console.log("Запрос на добавление домена в белый список:", request.domain);
        blockerManager.addToWhitelist(request.domain)
            .then(response => {
                sendResponse(response);
            })
            .catch(error => {
                console.error("Ошибка при добавлении домена в белый список:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }

    // Удаление из белого списка
    else if (request.type === "removeFromWhitelist") {
        console.log("Запрос на удаление домена из белого списка:", request.domain);
        blockerManager.removeFromWhitelist(request.domain)
            .then(response => {
                sendResponse(response);
            })
            .catch(error => {
                console.error("Ошибка при удалении домена из белого списка:", error);
                sendResponse({ success: false, error: error.message });
            });
        return true;
    }

    // Получение белого списка
    else if (request.type === "getWhitelistedDomains") {
        blockerManager.getWhitelistedDomains()
            .then(domains => {
                sendResponse({ domains });
            })
            .catch(error => {
                console.error("Ошибка при получении белого списка:", error);
                sendResponse({ domains: [] });
            });
        return true;
    }

    else if (request.type === "logRules") {
        blockerManager.logCurrentRules()
            .then(rules => {
                sendResponse({ rules });
            })
            .catch(error => {
                console.error("Ошибка при получении правил:", error);
                sendResponse({ rules: [] });
            });
        return true;
    }

    // Проверка, заблокирован ли домен
    else if (request.type === "isDomainBlocked") {
        Promise.all([
            blockerManager.isDomainBlocked(request.domain),
            blockerManager.isDomainWhitelisted(request.domain)
        ])
            .then(([isBlocked, isWhitelisted]) => {
                sendResponse({ isBlocked, isWhitelisted });
            })
            .catch(error => {
                console.error("Ошибка при проверке домена:", error);
                sendResponse({ isBlocked: false, isWhitelisted: false, error: error.message });
            });
        return true;
    }

    // Проверка, находится ли домен в белом списке
    else if (request.type === "isDomainWhitelisted") {
        Promise.all([
            blockerManager.isDomainWhitelisted(request.domain),
            blockerManager.isDomainBlocked(request.domain)
        ])
            .then(([isWhitelisted, isBlocked]) => {
                sendResponse({ isWhitelisted, isBlocked });
            })
            .catch(error => {
                console.error("Ошибка при проверке домена:", error);
                sendResponse({ isWhitelisted: false, isBlocked: false, error: error.message });
            });
        return true;
    }

    // Логирование правил (для отладки)
    else if (request.type === "logRules") {
        blockerManager.logCurrentRules()
            .then(rules => {
                sendResponse({ rules });
            })
            .catch(error => {
                console.error("Ошибка при получении правил:", error);
                sendResponse({ rules: [] });
            });
        return true;
    }

});

// Мониторинг WebRequest для отслеживания трекеров
chrome.webRequest.onCompleted.addListener(
    (details) => {
        const url = new URL(details.url);
        const domain = url.hostname;

        // Проверяем, является ли URL трекером
        const trackersFound = trackerDetector.detectTrackersInUrl(details.url);

        if (trackersFound.length > 0) {
            console.log(`Обнаружен трекер: ${trackersFound[0].name} на ${domain}`);
            dataVisualizer.addTrackerDataPoint(domain, 1);
        }
    },
    { urls: ["<all_urls>"] }
);

// Мониторинг cookies
chrome.cookies.onChanged.addListener((changeInfo) => {
    if (!changeInfo.removed && !changeInfo.cookie.session) {
        const domain = changeInfo.cookie.domain.startsWith('.')
            ? changeInfo.cookie.domain.substring(1)
            : changeInfo.cookie.domain;

        dataVisualizer.addCookieDataPoint(domain, 1);
    }
});

// Обработка клика по иконке расширения (если нет popup)
chrome.action.onClicked.addListener((tab) => {
    chrome.storage.local.get("enabled", (data) => {
        if (chrome.runtime.lastError) {
            console.error("Ошибка получения enabled:", chrome.runtime.lastError);
            return;
        }

        const newState = !data.enabled;
        chrome.storage.local.set({ enabled: newState }, () => {
            chrome.action.setIcon({
                path: newState ? "assets/icon.png" : "assets/icon_disabled.png",
            });

            if (newState) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ["content/content.js"]
                });
            }
        });
    });
    // Функция форматирования статистики для UI
    
});

console.log("Фоновый скрипт запущен");






