// utils/tracker-database.js
export class TrackerDatabase {
    constructor() {
        this.trackers = [
            // Аналитика
            {
                name: "Google Analytics",
                patterns: [
                    /google-analytics\.com/,
                    /googletagmanager\.com/,
                    /gtag/,
                    /ga\(/
                ],
                category: "analytics",
                description: "Отслеживает поведение пользователей на сайте для аналитики"
            },
            {
                name: "Яндекс.Метрика",
                patterns: [
                    /mc\.yandex\.ru/,
                    /метрика/,
                    /yandex_metrika/,
                    /ym\(/
                ],
                category: "analytics",
                description: "Российский аналитический сервис для отслеживания поведения пользователей"
            },
            // Социальные сети
            {
                name: "Facebook Pixel",
                patterns: [
                    /facebook\.com\/tr/,
                    /fbq\(/,
                    /fbevents\.js/
                ],
                category: "social",
                description: "Отслеживает конверсии с рекламы Facebook и действия пользователей на сайте"
            },
            {
                name: "VK Pixel",
                patterns: [
                    /top-fwz1\.mail\.ru/,
                    /vk\.com\/rtrg/,
                    /vk\-pixel/
                ],
                category: "social",
                description: "Отслеживает активность пользователей для таргетированной рекламы ВКонтакте"
            },
            // Рекламные сети
            {
                name: "Google Ads",
                patterns: [
                    /doubleclick\.net/,
                    /googleadservices\.com/,
                    /googlesyndication/
                ],
                category: "advertising",
                description: "Рекламная сеть Google, собирает данные для показа релевантной рекламы"
            },
            {
                name: "Яндекс.Директ",
                patterns: [
                    /an\.yandex\.ru/,
                    /direct\.yandex\./
                ],
                category: "advertising",
                description: "Рекламная сеть Яндекса"
            }
        ];
    }

    findTracker(url, scriptContent = "") {
        return this.trackers.filter(tracker => {
            return tracker.patterns.some(pattern =>
                pattern.test(url) || (scriptContent && pattern.test(scriptContent))
            );
        });
    }

    getTrackersByCategory(category) {
        return this.trackers.filter(tracker => tracker.category === category);
    }

    getAllCategories() {
        return [...new Set(this.trackers.map(t => t.category))];
    }
}

export default TrackerDatabase;