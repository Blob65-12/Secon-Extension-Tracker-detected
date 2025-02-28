// visualization.js
class DataVisualizer {
    constructor() {
        this.trackerHistory = [];
        this.cookieHistory = [];
        this.loadHistory();
    }

    async loadHistory() {
        const data = await chrome.storage.local.get(['trackerHistory', 'cookieHistory']);
        this.trackerHistory = data.trackerHistory || [];
        this.cookieHistory = data.cookieHistory || [];
    }

    async saveHistory() {
        await chrome.storage.local.set({
            trackerHistory: this.trackerHistory,
            cookieHistory: this.cookieHistory
        });
    }

    async addTrackerDataPoint(domain, trackersCount, timestamp = new Date().toISOString()) {
        this.trackerHistory.push({
            domain,
            trackersCount,
            timestamp
        });

        
        if (this.trackerHistory.length > 100) {
            this.trackerHistory = this.trackerHistory.slice(-100);
        }

        await this.saveHistory();
    }

    async addCookieDataPoint(domain, cookiesCount, timestamp = new Date().toISOString()) {
        this.cookieHistory.push({
            domain,
            cookiesCount,
            timestamp
        });

        
        if (this.cookieHistory.length > 100) {
            this.cookieHistory = this.cookieHistory.slice(-100);
        }

        await this.saveHistory();
    }

    getTrackerHistoryByDomain(domain) {
        return this.trackerHistory.filter(item => item.domain === domain);
    }

    getCookieHistoryByDomain(domain) {
        return this.cookieHistory.filter(item => item.domain === domain);
    }

    getTopTrackerDomains(limit = 5) {
        const domainCounts = {};

        for (const item of this.trackerHistory) {
            domainCounts[item.domain] = (domainCounts[item.domain] || 0) + 1;
        }

        return Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([domain, count]) => ({ domain, count }));
    }

    getTopCookieDomains(limit = 5) {
        const domainCounts = {};

        for (const item of this.cookieHistory) {
            domainCounts[item.domain] = (domainCounts[item.domain] || 0) + item.cookiesCount;
        }

        return Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([domain, count]) => ({ domain, count }));
    }

    getDataForVisualization() {
        const now = new Date();
        const lastHour = new Date(now - 60 * 60 * 1000); // Последний час
        const minutes = Array.from({ length: 60 }, (_, i) => {
            const time = new Date(lastHour.getTime() + i * 60 * 1000);
            return time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        });

        const trackersByMinute = {};
        const cookiesByMinute = {};
        minutes.forEach(minute => {
            trackersByMinute[minute] = 0;
            cookiesByMinute[minute] = 0;
        });

        this.trackerHistory.forEach(item => {
            const time = new Date(item.timestamp);
            if (time >= lastHour) {
                const minute = time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                trackersByMinute[minute] += item.trackersCount;
            }
        });

        this.cookieHistory.forEach(item => {
            const time = new Date(item.timestamp);
            if (time >= lastHour) {
                const minute = time.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
                cookiesByMinute[minute] += item.cookiesCount;
            }
        });

        return {
            labels: minutes,
            trackers: Object.values(trackersByMinute),
            cookies: Object.values(cookiesByMinute)
        };
    }

    
    
}

export default DataVisualizer;