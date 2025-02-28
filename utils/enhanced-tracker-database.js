// utils/enhanced-tracker-database.js
export class EnhancedTrackerDatabase {
    constructor() {
        this.trackers = [
            // Аналитика
            {
                name: "Google Analytics",
                patterns: [
                    /google-analytics\.com/,
                    /googletagmanager\.com/,
                    /gtag/,
                    /ga\(/,
                    /analytics\.js/,
                    /collect\?v=1/
                ],
                category: "analytics",
                company: "Google",
                description: "Сервис веб-аналитики от Google",
                risk: "high",
                dataCollected: ["page visits", "time on site", "clicks", "user behavior", "demographics"]
            },
            {
                name: "Яндекс.Метрика",
                patterns: [
                    /mc\.yandex\.ru/,
                    /метрика/,
                    /yandex_metrika/,
                    /ym\(/,
                    /watch\.js/
                ],
                category: "analytics",
                company: "Yandex",
                description: "Сервис веб-аналитики от Яндекса",
                risk: "high",
                dataCollected: ["page visits", "time on site", "clicks", "user behavior", "heatmaps"]
            },
            {
                name: "Hotjar",
                patterns: [
                    /hotjar\.com/,
                    /static\.hotjar\.com/,
                    /\.hotjar\./,
                    /hj\(/
                ],
                category: "analytics",
                company: "Hotjar",
                description: "Инструмент для анализа поведения пользователей, тепловые карты и записи сессий",
                risk: "high",
                dataCollected: ["clicks", "scrolling", "forms", "session recordings", "heatmaps"]
            },
            {
                name: "Matomo (Piwik)",
                patterns: [
                    /matomo\.php/,
                    /piwik\.php/,
                    /matomo\.js/,
                    /piwik\.js/
                ],
                category: "analytics",
                company: "Matomo",
                description: "Открытая альтернатива Google Analytics с фокусом на приватность",
                risk: "medium",
                dataCollected: ["page visits", "time on site", "clicks", "user behavior"]
            },

            // Социальные сети
            {
                name: "Facebook Pixel",
                patterns: [
                    /facebook\.com\/tr/,
                    /fbq\(/,
                    /fbevents\.js/,
                    /connect\.facebook\.net/
                ],
                category: "social",
                company: "Meta",
                description: "Трекер для анализа эффективности рекламы в Facebook",
                risk: "high",
                dataCollected: ["conversions", "page visits", "user identification"]
            },
            {
                name: "Twitter Pixel",
                patterns: [
                    /static\.ads-twitter\.com/,
                    /platform\.twitter\.com/,
                    /twq\(/
                ],
                category: "social",
                company: "Twitter",
                description: "Трекер для анализа эффективности рекламы в Twitter",
                risk: "medium",
                dataCollected: ["conversions", "page visits", "ad interactions"]
            },
            {
                name: "VK Pixel",
                patterns: [
                    /top-fwz1\.mail\.ru/,
                    /vk\.com\/rtrg/,
                    /vk\-pixel/
                ],
                category: "social",
                company: "VK",
                description: "Отслеживает активность пользователей для таргетированной рекламы ВКонтакте",
                risk: "medium",
                dataCollected: ["conversions", "user demographics", "interests"]
            },
            {
                name: "LinkedIn Pixel",
                patterns: [
                    /snap\.licdn\.com/,
                    /linkedin\.com\/\w+\/insight/
                ],
                category: "social",
                company: "LinkedIn",
                description: "Трекер для анализа эффективности рекламы в LinkedIn",
                risk: "medium",
                dataCollected: ["conversions", "professional demographics", "job information"]
            },

            // Рекламные сети
            {
                name: "Google Ads",
                patterns: [
                    /doubleclick\.net/,
                    /googleadservices\.com/,
                    /googlesyndication/,
                    /pagead2\.googlesyndication/
                ],
                category: "advertising",
                company: "Google",
                description: "Рекламная сеть Google, собирает данные для показа релевантной рекламы",
                risk: "high",
                dataCollected: ["browsing history", "interests", "demographics", "ad interactions"]
            },
            {
                name: "Яндекс.Директ",
                patterns: [
                    /an\.yandex\.ru/,
                    /direct\.yandex\./
                ],
                category: "advertising",
                company: "Yandex",
                description: "Рекламная сеть Яндекса",
                risk: "high",
                dataCollected: ["browsing history", "interests", "demographics", "ad interactions"]
            },
            {
                name: "Criteo",
                patterns: [
                    /criteo\.com/,
                    /criteo\.net/,
                    /\.criteo\./
                ],
                category: "advertising",
                company: "Criteo",
                description: "Платформа для ретаргетинга и персонализированной рекламы",
                risk: "high",
                dataCollected: ["browsing history", "purchase intent", "product views"]
            },
            {
                name: "AdRoll",
                patterns: [
                    /adroll\.com/,
                    /d\.adroll\.com/
                ],
                category: "advertising",
                company: "AdRoll",
                description: "Платформа для ретаргетинга и рекламы",
                risk: "high",
                dataCollected: ["browsing history", "purchase intent", "product views"]
            },

            // CMS и конструкторы сайтов
            {
                name: "WordPress Stats",
                patterns: [
                    /stats\.wp\.com/,
                    /pixel\.wp\.com/
                ],
                category: "analytics",
                company: "Automattic",
                description: "Система аналитики для сайтов на WordPress",
                risk: "low",
                dataCollected: ["page visits", "referrers"]
            },
            {
                name: "Wix Analytics",
                patterns: [
                    /static\.parastorage\.com\/services\/wix-thunderbolt/,
                    /static\.wixstatic\.com\/media/
                ],
                category: "analytics",
                company: "Wix",
                description: "Встроенная аналитика для сайтов на платформе Wix",
                risk: "medium",
                dataCollected: ["page visits", "user behavior"]
            },

            // Чаты и поддержка
            {
                name: "Intercom",
                patterns: [
                    /intercom\.io/,
                    /intercom\.com/,
                    /widget\.intercom\.io/
                ],
                category: "customer_support",
                company: "Intercom",
                description: "Платформа для общения с клиентами через чат",
                risk: "medium",
                dataCollected: ["user interactions", "chat history", "contact information"]
            },
            {
                name: "JivoSite",
                patterns: [
                    /jivosite\.com/,
                    /jivosite\.ru/,
                    /code\.jivosite\.com/
                ],
                category: "customer_support",
                company: "JivoSite",
                description: "Онлайн-чат для сайтов и приложений",
                risk: "medium",
                dataCollected: ["chat history", "contact information", "page visits"]
            },
            {
                name: "Zendesk",
                patterns: [
                    /zendesk\.com/,
                    /zdassets\.com/,
                    /zendesk-eu\.custhelp\.com/
                ],
                category: "customer_support",
                company: "Zendesk",
                description: "Платформа для поддержки клиентов",
                risk: "medium",
                dataCollected: ["support requests", "contact information"]
            },

            // A/B тестирование и оптимизация
            {
                name: "Optimizely",
                patterns: [
                    /optimizely\.com/,
                    /cdn\.optimizely\.com/
                ],
                category: "optimization",
                company: "Optimizely",
                description: "Платформа для A/B тестирования и персонализации",
                risk: "medium",
                dataCollected: ["user behavior", "experiment data"]
            },
            {
                name: "VWO (Visual Website Optimizer)",
                patterns: [
                    /visualwebsiteoptimizer\.com/,
                    /vwo\.com/
                ],
                category: "optimization",
                company: "Wingify",
                description: "Инструмент для A/B тестирования и повышения конверсии",
                risk: "medium",
                dataCollected: ["user behavior", "experiment data"]
            },

            // Маркетинговые платформы
            {
                name: "HubSpot",
                patterns: [
                    /hubspot\.com/,
                    /js\.hs-scripts\.com/,
                    /track\.hubspot\.com/
                ],
                category: "marketing",
                company: "HubSpot",
                description: "Комплексная маркетинговая платформа",
                risk: "high",
                dataCollected: ["contact information", "user behavior", "lead tracking"]
            },
            {
                name: "Mailchimp",
                patterns: [
                    /mailchimp\.com/,
                    /list-manage\.com/,
                    /chimpstatic\.com/
                ],
                category: "marketing",
                company: "Mailchimp",
                description: "Сервис email-маркетинга",
                risk: "medium",
                dataCollected: ["email engagement", "subscriber information"]
            },

            // Рекомендательные системы
            {
                name: "Retail Rocket",
                patterns: [
                    /retailrocket\.ru/,
                    /retailrocket\.net/
                ],
                category: "recommendation",
                company: "Retail Rocket",
                description: "Система персонализации и рекомендаций для интернет-магазинов",
                risk: "high",
                dataCollected: ["viewed products", "purchase history", "user preferences"]
            },
            {
                name: "Outbrain",
                patterns: [
                    /outbrain\.com/,
                    /outbrainimg\.com/
                ],
                category: "recommendation",
                company: "Outbrain",
                description: "Платформа рекомендаций контента",
                risk: "high",
                dataCollected: ["reading history", "interests"]
            },
            {
                name: "Taboola",
                patterns: [
                    /taboola\.com/,
                    /taboolasyndication\.com/
                ],
                category: "recommendation",
                company: "Taboola",
                description: "Платформа рекомендаций контента и нативной рекламы",
                risk: "high",
                dataCollected: ["reading history", "interests"]
            },

            // Платежные системы
            {
                name: "PayPal",
                patterns: [
                    /paypal\.com/,
                    /paypalobjects\.com/
                ],
                category: "payment",
                company: "PayPal",
                description: "Платежная система",
                risk: "low",
                dataCollected: ["transaction data"]
            },
            {
                name: "Stripe",
                patterns: [
                    /stripe\.com/,
                    /stripe\.network/,
                    /js\.stripe\.com/
                ],
                category: "payment",
                company: "Stripe",
                description: "Платежная система",
                risk: "low",
                dataCollected: ["transaction data"]
            }
        ];

        // Группируем трекеры по категориям для быстрого доступа
        this.categorizedTrackers = {};
        for (const tracker of this.trackers) {
            if (!this.categorizedTrackers[tracker.category]) {
                this.categorizedTrackers[tracker.category] = [];
            }
            this.categorizedTrackers[tracker.category].push(tracker);
        }

        // Группируем трекеры по компаниям
        this.companiesTrackers = {};
        for (const tracker of this.trackers) {
            if (!this.companiesTrackers[tracker.company]) {
                this.companiesTrackers[tracker.company] = [];
            }
            this.companiesTrackers[tracker.company].push(tracker);
        }
    }

    // Поиск трекеров по URL или содержимому скрипта
    findTrackers(url, scriptContent = "") {
        return this.trackers.filter(tracker => {
            return tracker.patterns.some(pattern =>
                pattern.test(url) || (scriptContent && pattern.test(scriptContent))
            );
        });
    }

    // Получение трекеров по категории
    getTrackersByCategory(category) {
        return this.categorizedTrackers[category] || [];
    }

    // Получение трекеров по компании
    getTrackersByCompany(company) {
        return this.companiesTrackers[company] || [];
    }

    // Получение всех категорий
    getAllCategories() {
        return Object.keys(this.categorizedTrackers);
    }

    // Получение всех компаний
    getAllCompanies() {
        return Object.keys(this.companiesTrackers);
    }

    // Получение трекеров с высоким уровнем риска
    getHighRiskTrackers() {
        return this.trackers.filter(tracker => tracker.risk === "high");
    }

    // Получение трекеров, собирающих определенный тип данных
    getTrackersByDataCollected(dataType) {
        return this.trackers.filter(tracker =>
            tracker.dataCollected && tracker.dataCollected.includes(dataType)
        );
    }

    // Получение списка распространенных доменов трекеров для блокировки
    getCommonTrackerDomains() {
        return [
            // Google
            { domain: "*.google-analytics.com/*", types: ["script", "xmlhttprequest"] },
            { domain: "*.googletagmanager.com/*", types: ["script"] },
            { domain: "*.doubleclick.net/*", types: ["script", "image", "xmlhttprequest"] },
            { domain: "*.googleadservices.com/*", types: ["script", "image"] },
            { domain: "pagead2.googlesyndication.com/*", types: ["script"] },
            { domain: "www.google-analytics.com/*", types: ["script", "xmlhttprequest"] },

            // Facebook
            { domain: "*.facebook.com/tr*", types: ["script", "image"] },
            { domain: "connect.facebook.net/*", types: ["script"] },

            // Yandex
            { domain: "mc.yandex.ru/*", types: ["script", "xmlhttprequest"] },
            { domain: "an.yandex.ru/*", types: ["script", "image"] },

            // Twitter
            { domain: "static.ads-twitter.com/*", types: ["script"] },
            { domain: "analytics.twitter.com/*", types: ["script"] },

            // Other ad networks
            { domain: "*.criteo.com/*", types: ["script", "image"] },
            { domain: "*.criteo.net/*", types: ["script", "image"] },
            { domain: "*.adroll.com/*", types: ["script", "image"] },
            { domain: "*.hotjar.com/*", types: ["script", "websocket"] },

            // Social
            { domain: "platform.twitter.com/*", types: ["script"] },
            { domain: "platform.linkedin.com/*", types: ["script"] },
            { domain: "*.vk.com/rtrg*", types: ["script", "image"] },

            // Analytics
            { domain: "*.matomo.cloud/*", types: ["script"] },
            { domain: "*.hotjar.io/*", types: ["script", "websocket"] },

            // Marketing
            { domain: "*.hubspot.com/*", types: ["script"] },
            { domain: "js.hs-scripts.com/*", types: ["script"] },
            { domain: "*.mailchimp.com/*", types: ["script"] },

            // Recommendations
            { domain: "*.retailrocket.net/*", types: ["script"] },
            { domain: "*.outbrain.com/*", types: ["script"] },
            { domain: "*.taboola.com/*", types: ["script"] }
        ];
    }
}

export default EnhancedTrackerDatabase;