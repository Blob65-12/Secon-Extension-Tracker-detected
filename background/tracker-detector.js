// background/tracker-detector.js
import EnhancedTrackerDatabase from '../utils/enhanced-tracker-database.js';

export class TrackerDetector {
    constructor() {
        this.database = new EnhancedTrackerDatabase();
        this.detectedTrackers = {}; // Для хранения обнаруженных трекеров по доменам
    }

    // Анализирует URL и содержимое скрипта для обнаружения трекеров
    // Обновите метод detectTrackersInUrl в TrackerDetector
    detectTrackersInUrl(url, scriptContent = "") {
        const trackers = this.database.findTrackers(url, scriptContent);

        // Сохраняем информацию о обнаруженных трекерах
        if (trackers.length > 0) {
            try {
                const urlObj = new URL(url);
                const domain = urlObj.hostname;

                // Обновляем detectedTrackers
                if (!this.detectedTrackers[domain]) {
                    this.detectedTrackers[domain] = [];
                }

                // Добавляем трекеры, которые еще не были обнаружены
                for (const tracker of trackers) {
                    if (!this.detectedTrackers[domain].some(t => t.name === tracker.name)) {
                        const trackerInfo = {
                            name: tracker.name,
                            category: tracker.category,
                            company: tracker.company,
                            risk: tracker.risk,
                            url: url,
                            timestamp: new Date().toISOString()
                        };

                        this.detectedTrackers[domain].push(trackerInfo);

                        // Сохраняем в долговременную историю
                        this.saveTrackerHistory(domain, tracker, url);
                    }
                }

                // Сохраняем обновленную информацию в хранилище
                this.saveDetectedTrackers();
            } catch (error) {
                console.error("Ошибка при сохранении информации о трекере:", error);
            }
        }

        return trackers;
    }

    // Добавьте метод в TrackerDetector
    async getRealTrackerStatistics(period = 'all') {
        try {
            // Загружаем полную историю трекеров
            const data = await chrome.storage.local.get('trackerHistory');
            const trackerHistory = data.trackerHistory || [];

            // Определение временного интервала
            const now = new Date();
            let startDate = new Date(now);

            switch (period) {
                case 'day':
                    startDate.setDate(now.getDate() - 1);
                    break;
                case 'week':
                    startDate.setDate(now.getDate() - 7);
                    break;
                case 'month':
                    startDate.setDate(now.getDate() - 30);
                    break;
                case 'all':
                default:
                    startDate = new Date(0); // Начало эпохи (все время)
                    break;
            }

            const startTime = startDate.getTime();

            // Фильтруем историю по выбранному периоду
            const filteredHistory = trackerHistory.filter(entry =>
                new Date(entry.timestamp).getTime() >= startTime
            );

            // Собираем статистику
            const uniqueDomains = new Set();
            const trackerCounts = {};
            const categoryCounts = {};
            const companyCounts = {};

            for (const entry of filteredHistory) {
                uniqueDomains.add(entry.domain);

                const trackerName = entry.tracker.name;
                trackerCounts[trackerName] = (trackerCounts[trackerName] || 0) + 1;

                const category = entry.tracker.category || 'unknown';
                categoryCounts[category] = (categoryCounts[category] || 0) + 1;

                const company = entry.tracker.company || 'unknown';
                companyCounts[company] = (companyCounts[company] || 0) + 1;
            }

            // Формируем данные для графиков по дням
            const dayLabels = [];
            const dayTrackerCounts = [];

            // Создаем временную шкалу
            let timeScale = [];
            const timeFormat = period === 'day' ? 'hour' : 'day';

            if (timeFormat === 'hour') {
                // По часам для дня
                for (let i = 0; i < 24; i++) {
                    const date = new Date(now);
                    date.setHours(i, 0, 0, 0);
                    timeScale.push({
                        label: `${i}:00`,
                        start: date,
                        end: new Date(date.getTime() + 60 * 60 * 1000 - 1)
                    });
                }
            } else {
                // По дням
                const daysCount = period === 'week' ? 7 : (period === 'month' ? 30 : 90);
                for (let i = daysCount - 1; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    date.setHours(0, 0, 0, 0);

                    const endDate = new Date(date);
                    endDate.setHours(23, 59, 59, 999);

                    timeScale.push({
                        label: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
                        start: date,
                        end: endDate
                    });
                }
            }

            // Подсчитываем количество трекеров для каждого временного интервала
            for (const interval of timeScale) {
                dayLabels.push(interval.label);

                const count = filteredHistory.filter(entry => {
                    const entryTime = new Date(entry.timestamp);
                    return entryTime >= interval.start && entryTime <= interval.end;
                }).length;

                dayTrackerCounts.push(count);
            }

            // Формируем результат
            return {
                totalTrackers: filteredHistory.length,
                totalDomains: uniqueDomains.size,
                mostFrequentTrackers: Object.entries(trackerCounts)
                    .map(([name, count]) => ({
                        name,
                        count,
                        category: filteredHistory.find(e => e.tracker.name === name)?.tracker.category || 'unknown',
                        company: filteredHistory.find(e => e.tracker.name === name)?.tracker.company || 'unknown'
                    }))
                    .sort((a, b) => b.count - a.count),
                trackersByCategory: Object.entries(categoryCounts)
                    .map(([category, count]) => ({ category, count }))
                    .sort((a, b) => b.count - a.count),
                trackersByCompany: Object.entries(companyCounts)
                    .map(([company, count]) => ({ company, count }))
                    .sort((a, b) => b.count - a.count),
                // Данные для графиков
                dailyData: {
                    labels: dayLabels,
                    values: dayTrackerCounts
                }
            };
        } catch (error) {
            console.error("Ошибка при получении статистики трекеров:", error);
            return {
                totalTrackers: 0,
                totalDomains: 0,
                mostFrequentTrackers: [],
                trackersByCategory: [],
                trackersByCompany: [],
                dailyData: {
                    labels: [],
                    values: []
                }
            };
        }
    }

    // Добавьте метод в класс TrackerDetector
    async saveTrackerHistory(domain, tracker, url) {
        try {
            // Получаем текущую историю трекеров
            const data = await chrome.storage.local.get('trackerHistory');
            const trackerHistory = data.trackerHistory || [];

            // Добавляем новую запись
            trackerHistory.push({
                domain,
                tracker: {
                    name: tracker.name,
                    category: tracker.category,
                    company: tracker.company,
                    risk: tracker.risk
                },
                url,
                timestamp: new Date().toISOString()
            });

            // Ограничиваем размер истории, чтобы не перегружать хранилище
            if (trackerHistory.length > 1000) {
                trackerHistory.splice(0, trackerHistory.length - 1000);
            }

            // Сохраняем обновленную историю
            await chrome.storage.local.set({ trackerHistory });

        } catch (error) {
            console.error("Ошибка сохранения истории трекеров:", error);
        }
    }

    // Сохраняет информацию об обнаруженных трекерах в хранилище
    saveDetectedTrackers() {
        chrome.storage.local.set({ detectedTrackers: this.detectedTrackers }, () => {
            if (chrome.runtime.lastError) {
                console.error("Ошибка сохранения информации о трекерах:", chrome.runtime.lastError);
            }
        });
    }

    // Загружает информацию об обнаруженных трекерах из хранилища
    loadDetectedTrackers() {
        return new Promise((resolve) => {
            chrome.storage.local.get('detectedTrackers', (data) => {
                if (chrome.runtime.lastError) {
                    console.error("Ошибка загрузки информации о трекерах:", chrome.runtime.lastError);
                    resolve({});
                } else {
                    this.detectedTrackers = data.detectedTrackers || {};
                    resolve(this.detectedTrackers);
                }
            });
        });
    }

    // Получает статистику обнаруженных трекеров
    async getTrackerStatistics(period = 'all') {
        await this.loadDetectedTrackers();

        // Определение временного интервала
        const now = new Date();
        let startDate = new Date(now);

        switch (period) {
            case 'day':
                startDate.setDate(now.getDate() - 1);
                break;
            case 'week':
                startDate.setDate(now.getDate() - 7);
                break;
            case 'month':
                startDate.setDate(now.getDate() - 30);
                break;
            case 'all':
            default:
                startDate = new Date(0); // Начало эпохи (все время)
                break;
        }

        const startTime = startDate.getTime();

        // Подготовка статистики
        const statistics = {
            totalDomains: 0,
            totalTrackers: 0,
            trackersByCategory: {},
            trackersByCompany: {},
            mostFrequentTrackers: [],
            topDomains: []
        };

        // Собираем данные из обнаруженных трекеров
        const trackerCounts = {};
        const categoryCounts = {};
        const companyCounts = {};
        const domainTrackerCounts = {};

        for (const [domain, trackers] of Object.entries(this.detectedTrackers)) {
            let domainTrackerCount = 0;

            for (const tracker of trackers) {
                const trackerTime = new Date(tracker.timestamp).getTime();

                // Проверяем, попадает ли трекер в указанный период
                if (trackerTime >= startTime) {
                    // Подсчитываем трекеры
                    trackerCounts[tracker.name] = (trackerCounts[tracker.name] || 0) + 1;
                    statistics.totalTrackers++;
                    domainTrackerCount++;

                    // Подсчитываем категории
                    categoryCounts[tracker.category] = (categoryCounts[tracker.category] || 0) + 1;

                    // Подсчитываем компании
                    companyCounts[tracker.company] = (companyCounts[tracker.company] || 0) + 1;
                }
            }

            if (domainTrackerCount > 0) {
                domainTrackerCounts[domain] = domainTrackerCount;
                statistics.totalDomains++;
            }
        }

        // Преобразуем данные для вывода статистики
        statistics.trackersByCategory = Object.entries(categoryCounts)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count);

        statistics.trackersByCompany = Object.entries(companyCounts)
            .map(([company, count]) => ({ company, count }))
            .sort((a, b) => b.count - a.count);

        statistics.mostFrequentTrackers = Object.entries(trackerCounts)
            .map(([name, count]) => {
                const tracker = this.database.findTrackers(name)[0] || {};
                return {
                    name,
                    count,
                    category: tracker.category || 'unknown',
                    company: tracker.company || 'unknown',
                    risk: tracker.risk || 'unknown'
                };
            })
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Топ-20 трекеров

        statistics.topDomains = Object.entries(domainTrackerCounts)
            .map(([domain, count]) => ({ domain, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 20); // Топ-20 доменов

        return statistics;
    }

    // Получает все категории трекеров
    getTrackerCategories() {
        return this.database.getAllCategories();
    }

    // Получает все компании трекеров
    getTrackerCompanies() {
        return this.database.getAllCompanies();
    }

    // Получает список самых распространенных доменов трекеров для блокировки
    getCommonTrackerDomains() {
        return this.database.getCommonTrackerDomains();
    }
}

export default TrackerDetector;
