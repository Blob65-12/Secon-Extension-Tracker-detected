// background/blocker.js
import TrackerDetector from './tracker-detector.js';

export class BlockerManager {
    constructor() {
        this.blockedTypes = {
            requests: false,
            cookies: false,
            websockets: false,
            trackers: false,
            thirdPartyCookies: false
        };
        this.trackDetector = new TrackerDetector();
        this.ruleIdCounter = 1;
    }

    async logCurrentRules() {
        try {
            const rules = await chrome.declarativeNetRequest.getDynamicRules();
            console.log("Текущие правила блокировки:", rules);
            return rules;
        } catch (error) {
            console.error("Ошибка при получении правил:", error);
            return [];
        }
    }

    async isDomainBlocked(domain) {
        const blockedDomains = await this.getBlockedDomains();
        return blockedDomains.includes(domain);
    }

    async isDomainWhitelisted(domain) {
        const whitelistedDomains = await this.getWhitelistedDomains();
        return whitelistedDomains.includes(domain);
    }

    async addDomainToBlocklist(domain) {
        try {
            // Проверяем, не находится ли домен в белом списке
            const isWhitelisted = await this.isDomainWhitelisted(domain);
            if (isWhitelisted) {
                return {
                    success: false,
                    message: "Домен находится в белом списке. Сначала удалите его из белого списка, чтобы заблокировать."
                };
            }

            // Проверяем, не заблокирован ли уже домен
            const isBlocked = await this.isDomainBlocked(domain);
            if (isBlocked) {
                return {
                    success: false,
                    message: "Домен уже заблокирован"
                };
            }

            // Удаляем протокол и путь, если они есть
            domain = domain.replace(/^https?:\/\//, '').split('/')[0];

            // Получаем текущий список заблокированных доменов
            const data = await chrome.storage.local.get('blockedDomains');
            const blockedDomains = data.blockedDomains || [];

            // Добавляем домен в список
            blockedDomains.push(domain);
            await chrome.storage.local.set({ blockedDomains });

            // Создаем правило блокировки для этого домена
            // Используем целое число для ID
            const ruleId = Math.floor(Math.random() * 100000);

            // Два правила: одно для https, другое для http
            const rules = [
                {
                    id: ruleId,
                    priority: 1,
                    action: { type: "block" },
                    condition: {
                        urlFilter: `*://${domain}/*`,
                        resourceTypes: ["main_frame", "sub_frame", "script", "xmlhttprequest", "image", "stylesheet"]
                    }
                },
                {
                    id: ruleId + 1,
                    priority: 1,
                    action: { type: "block" },
                    condition: {
                        urlFilter: `*://*.${domain}/*`,
                        resourceTypes: ["main_frame", "sub_frame", "script", "xmlhttprequest", "image", "stylesheet"]
                    }
                }
            ];

            // Добавляем правила блокировки
            console.log("Добавляем правила блокировки:", rules);
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: rules,
                removeRuleIds: []
            });

            return { success: true, domain };
        } catch (error) {
            console.error("Ошибка при блокировке домена:", error);
            return { success: false, error: error.message };
        }
    }

    async addToWhitelist(domain) {
        try {
            // Проверяем, не заблокирован ли домен
            const isBlocked = await this.isDomainBlocked(domain);
            if (isBlocked) {
                return {
                    success: false,
                    message: "Домен находится в списке заблокированных. Сначала удалите его из списка заблокированных, чтобы добавить в белый список."
                };
            }

            // Проверяем, не находится ли уже домен в белом списке
            const isWhitelisted = await this.isDomainWhitelisted(domain);
            if (isWhitelisted) {
                return {
                    success: false,
                    message: "Домен уже находится в белом списке"
                };
            }

            // Получаем текущий белый список
            const data = await chrome.storage.local.get('whitelistedDomains');
            const whitelistedDomains = data.whitelistedDomains || [];

            // Добавляем домен в список
            whitelistedDomains.push(domain);
            await chrome.storage.local.set({ whitelistedDomains });

            return { success: true, domain };
        } catch (error) {
            console.error("Ошибка при добавлении домена в белый список:", error);
            return { success: false, error: error.message };
        }
    }

    async addToWhitelist(domain) {
        try {
            // Получаем текущий белый список
            const data = await chrome.storage.local.get('whitelistedDomains');
            const whitelistedDomains = data.whitelistedDomains || [];

            // Добавляем домен, если его еще нет в списке
            if (!whitelistedDomains.includes(domain)) {
                whitelistedDomains.push(domain);
                await chrome.storage.local.set({ whitelistedDomains });

                // Если домен был в блок-листе, удаляем его оттуда
                await this.removeDomainFromBlocklist(domain);

                return { success: true, domain };
            }

            return { success: false, message: "Домен уже в белом списке" };
        } catch (error) {
            console.error("Ошибка при добавлении домена в белый список:", error);
            return { success: false, error: error.message };
        }
    }


    async removeFromWhitelist(domain) {
        try {
            // Получаем текущий белый список
            const data = await chrome.storage.local.get('whitelistedDomains');
            let whitelistedDomains = data.whitelistedDomains || [];

            // Удаляем домен из списка
            whitelistedDomains = whitelistedDomains.filter(d => d !== domain);
            await chrome.storage.local.set({ whitelistedDomains });

            return { success: true, domain };
        } catch (error) {
            console.error("Ошибка при удалении домена из белого списка:", error);
            return { success: false, error: error.message };
        }
    }

    async getWhitelistedDomains() {
        try {
            const data = await chrome.storage.local.get('whitelistedDomains');
            return data.whitelistedDomains || [];
        } catch (error) {
            console.error("Ошибка при получении белого списка:", error);
            return [];
        }
    }

    // Добавьте это в класс BlockerManager
    async addDomainToBlocklist(domain) {
        try {
            // Удаляем протокол и путь, если они есть
            domain = domain.replace(/^https?:\/\//, '').split('/')[0];

            // Получаем текущий список заблокированных доменов
            const data = await chrome.storage.local.get('blockedDomains');
            const blockedDomains = data.blockedDomains || [];

            // Добавляем домен, если его еще нет в списке
            if (!blockedDomains.includes(domain)) {
                blockedDomains.push(domain);
                await chrome.storage.local.set({ blockedDomains });

                // Создаем правило блокировки для этого домена
                // Используем целое число для ID
                const ruleId = Math.floor(Math.random() * 100000);

                // Два правила: одно для https, другое для http
                const rules = [
                    {
                        id: ruleId,
                        priority: 1,
                        action: { type: "block" },
                        condition: {
                            urlFilter: `*://${domain}/*`,
                            resourceTypes: ["main_frame", "sub_frame", "script", "xmlhttprequest", "image", "stylesheet"]
                        }
                    },
                    {
                        id: ruleId + 1,
                        priority: 1,
                        action: { type: "block" },
                        condition: {
                            urlFilter: `*://*.${domain}/*`,
                            resourceTypes: ["main_frame", "sub_frame", "script", "xmlhttprequest", "image", "stylesheet"]
                        }
                    }
                ];

                // Добавляем правила блокировки
                console.log("Добавляем правила блокировки:", rules);
                await chrome.declarativeNetRequest.updateDynamicRules({
                    addRules: rules,
                    removeRuleIds: []
                });

                // Проверим, что правила успешно добавлены
                const addedRules = await chrome.declarativeNetRequest.getDynamicRules();
                console.log("Текущие правила блокировки:", addedRules);

                return { success: true, domain };
            }

            return { success: false, message: "Домен уже заблокирован" };
        } catch (error) {
            console.error("Ошибка при блокировке домена:", error);
            return { success: false, error: error.message };
        }
    }

    async removeDomainFromBlocklist(domain) {
        try {
            // Получаем текущий список заблокированных доменов
            const data = await chrome.storage.local.get('blockedDomains');
            let blockedDomains = data.blockedDomains || [];

            // Проверяем, есть ли домен в списке
            if (!blockedDomains.includes(domain)) {
                return { success: false, message: "Домен не найден в списке заблокированных" };
            }

            // Удаляем домен из списка
            blockedDomains = blockedDomains.filter(d => d !== domain);
            await chrome.storage.local.set({ blockedDomains });

            // Получаем все правила блокировки
            const rules = await chrome.declarativeNetRequest.getDynamicRules();

            // Находим правила для этого домена
            const ruleIdsToRemove = rules
                .filter(rule =>
                    rule.condition.urlFilter === `*://${domain}/*` ||
                    rule.condition.urlFilter === `*://*.${domain}/*`
                )
                .map(rule => rule.id);

            // Если найдены правила, удаляем их
            if (ruleIdsToRemove.length > 0) {
                await chrome.declarativeNetRequest.updateDynamicRules({
                    removeRuleIds: ruleIdsToRemove,
                    addRules: []
                });
                console.log(`Удалены правила блокировки: ${ruleIdsToRemove.join(', ')}`);
            }

            return { success: true, domain };
        } catch (error) {
            console.error("Ошибка при разблокировке домена:", error);
            return { success: false, error: error.message };
        }
    }

    async getBlockedDomains() {
        try {
            const data = await chrome.storage.local.get('blockedDomains');
            return data.blockedDomains || [];
        } catch (error) {
            console.error("Ошибка при получении списка заблокированных доменов:", error);
            return [];
        }
    }

    // Инициализация из хранилища
    async initialize() {
        try {
            const data = await this.getStorageData('blockedTypes');
            this.blockedTypes = data.blockedTypes || {
                requests: false,
                cookies: false,
                websockets: false,
                trackers: false,
                thirdPartyCookies: false
            };

            await this.updateBlockingRules();
            console.log("Блокировщик инициализирован:", this.blockedTypes);
        } catch (error) {
            console.error('Ошибка инициализации блокировщика:', error);
        }
    }

    // Получение данных из хранилища
    getStorageData(keys) {
        return new Promise((resolve) => {
            chrome.storage.local.get(keys, (data) => {
                resolve(data);
            });
        });
    }

    // Сохранение данных в хранилище
    setStorageData(data) {
        return new Promise((resolve) => {
            chrome.storage.local.set(data, resolve);
        });
    }

    // Обновление типа блокировки
    async updateBlockingType(type, enabled) {
        if (!(type in this.blockedTypes)) {
            console.error(`Неизвестный тип блокировки: ${type}`);
            return false;
        }

        this.blockedTypes[type] = enabled;
        await this.setStorageData({ blockedTypes: this.blockedTypes });
        await this.updateBlockingRules();

        return true;
    }

    // Обновление правил блокировки
    async updateBlockingRules() {
        let rules = [];
        let ruleId = 1;

        // Блокировка запросов
        if (this.blockedTypes.requests) {
            rules.push({
                id: ruleId++,
                priority: 1,
                action: { type: "block" },
                condition: { urlFilter: "*://*/*", resourceTypes: ["xmlhttprequest"] }
            });
        }

        // Блокировка cookies
        if (this.blockedTypes.cookies) {
            rules.push({
                id: ruleId++,
                priority: 1,
                action: { type: "modifyHeaders", requestHeaders: [{ header: "Cookie", operation: "remove" }] },
                condition: { urlFilter: "*://*/*", resourceTypes: ["main_frame", "sub_frame"] }
            });
        }

        // Блокировка сторонних cookies
        if (this.blockedTypes.thirdPartyCookies) {
            rules.push({
                id: ruleId++,
                priority: 1,
                action: { type: "modifyHeaders", requestHeaders: [{ header: "Cookie", operation: "remove" }] },
                condition: {
                    urlFilter: "*://*/*",
                    resourceTypes: ["main_frame", "sub_frame", "image", "script", "stylesheet", "object", "xmlhttprequest"],
                    domainType: "thirdParty"
                }
            });
        }

        // Блокировка WebSocket
        if (this.blockedTypes.websockets) {
            rules.push(
                { id: ruleId++, priority: 1, action: { type: "block" }, condition: { urlFilter: "ws://*/*", resourceTypes: ["websocket"] } },
                { id: ruleId++, priority: 1, action: { type: "block" }, condition: { urlFilter: "wss://*/*", resourceTypes: ["websocket"] } }
            );
        }

        // Блокировка трекеров
        if (this.blockedTypes.trackers) {
            const trackerDomains = this.trackDetector.getCommonTrackerDomains();

            trackerDomains.forEach(tracker => {
                rules.push({
                    id: ruleId++,
                    priority: 1,
                    action: { type: "block" },
                    condition: { urlFilter: tracker.domain, resourceTypes: tracker.types }
                });
            });
        }

        // Применяем правила
        try {
            await chrome.declarativeNetRequest.updateDynamicRules({
                removeRuleIds: Array.from({ length: 50 }, (_, i) => i + 1), // Удаляем правила с ID 1-50
                addRules: rules
            });

            console.log(`Применено ${rules.length} правил блокировки`);
            return true;
        } catch (error) {
            console.error("Ошибка обновления правил блокировки:", error);
            return false;
        }
    }
}

export default BlockerManager;