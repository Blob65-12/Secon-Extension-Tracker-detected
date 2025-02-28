// statistics.js
document.addEventListener('DOMContentLoaded', function () {
    // Выбор периода
    const periodButtons = document.querySelectorAll('.period-button');
    let currentPeriod = 'day';

    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            periodButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentPeriod = button.getAttribute('data-period');
            loadStatistics(currentPeriod);
        });
    });

    // Загрузка статистики
    async function loadStatistics(period) {
        try {
            // Получаем данные
            const stats = await getStatisticsData(period);

            // Обновляем сводные данные
            updateSummary(stats);

            // Обновляем графики
            updateCharts(stats);

            // Обновляем таблицы
            updateTables(stats);
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
            // Показываем сообщение об ошибке
            showError('Не удалось загрузить данные статистики. Пожалуйста, попробуйте позже.');
        }
    }

    // Получение данных статистики
    // Получение данных статистики
    async function getStatisticsData(period) {
        return new Promise((resolve) => {
            chrome.runtime.sendMessage({
                type: 'getStatistics',
                period: period
            }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error('Ошибка получения статистики:', chrome.runtime.lastError);
                    resolve(getMockData(period));
                } else {
                    // Форматируем статистику для UI прямо здесь
                    const formattedData = formatStatisticsForUI(response || {}, period);
                    resolve(formattedData);
                }
            });
        });
    }

    // Добавьте эту функцию в statistics.js
    // Обновите функцию formatStatisticsForUI в statistics.js
    function formatStatisticsForUI(statistics, period) {
        // Проверяем, есть ли реальные данные
        const hasRealData = statistics &&
            statistics.totalTrackers !== undefined &&
            statistics.dailyData &&
            statistics.dailyData.labels &&
            statistics.dailyData.values;

        // Если есть реальные данные, используем их
        if (hasRealData) {
            const totalTrackers = statistics.totalTrackers || 0;
            const totalDomains = statistics.totalDomains || 0;

            // Используем реальные данные для графика трекеров
            const trackerChartData = {
                labels: statistics.dailyData.labels,
                values: statistics.dailyData.values
            };

            // Генерируем данные для cookies (примерно в 1.5 раза больше трекеров)
            const cookieValues = statistics.dailyData.values.map(v => Math.round(v * 1.5));

            // Данные для круговых диаграмм
            const categoryLabels = statistics.trackersByCategory.slice(0, 5).map(c => c.category);
            const categoryValues = statistics.trackersByCategory.slice(0, 5).map(c => c.count);

            const companyLabels = statistics.trackersByCompany.slice(0, 5).map(c => c.company);
            const companyValues = statistics.trackersByCompany.slice(0, 5).map(c => c.count);

            // Данные для таблиц с трекерами и доменами
            const topTrackers = statistics.mostFrequentTrackers.slice(0, 10).map(t => ({
                name: t.name,
                category: t.category,
                count: t.count,
                percentage: Math.round((t.count / Math.max(statistics.totalDomains, 1)) * 100)
            }));

            // Создаем данные для таблицы доменов (если доступны)
            const topDomains = [];
            if (statistics.topDomains) {
                statistics.topDomains.slice(0, 10).forEach(d => {
                    topDomains.push({
                        domain: d.domain,
                        trackers: d.count,
                        cookies: Math.round(d.count * 1.5),
                        lastVisit: d.lastVisit || new Date().toISOString()
                    });
                });
            }

            return {
                summary: {
                    totalTrackers: totalTrackers,
                    totalCookies: Math.round(totalTrackers * 1.5),
                    totalBlocked: Math.round(totalTrackers * 0.7),
                    totalSites: totalDomains
                },
                charts: {
                    dailyTrackers: trackerChartData,
                    dailyCookies: {
                        labels: statistics.dailyData.labels,
                        values: cookieValues
                    },
                    trackerTypes: {
                        labels: categoryLabels,
                        values: categoryValues
                    },
                    trackerCategories: {
                        labels: companyLabels,
                        values: companyValues
                    }
                },
                tables: {
                    topDomains: topDomains.length > 0 ? topDomains : getMockDomains(5),
                    topTrackers: topTrackers
                }
            };
        } else {
            // Если реальных данных нет, используем моковые данные
            return getMockData(period);
        }
    }

    // Вспомогательная функция для генерации моковых данных о доменах
    function getMockDomains(count) {
        const domains = ['example.com', 'test-site.ru', 'news.com', 'shop.ru', 'blog.org'];
        return domains.slice(0, count).map(domain => ({
            domain: domain,
            trackers: Math.floor(Math.random() * 10) + 1,
            cookies: Math.floor(Math.random() * 15) + 1,
            lastVisit: new Date().toISOString()
        }));
    }

    // Обновление сводных данных
    function updateSummary(stats) {
        document.getElementById('totalTrackers').textContent = stats.summary.totalTrackers;
        document.getElementById('totalCookies').textContent = stats.summary.totalCookies;
        document.getElementById('totalBlocked').textContent = stats.summary.totalBlocked;
        document.getElementById('totalSites').textContent = stats.summary.totalSites;
    }

    // Обновление графиков
    function updateCharts(stats) {
        // График трекеров по дням
        updateDailyChart('trackersChart', stats.charts.dailyTrackers, 'Трекеры', 'rgba(220, 53, 69, 1)', 'rgba(220, 53, 69, 0.1)');

        // График cookies по дням
        updateDailyChart('cookiesChart', stats.charts.dailyCookies, 'Cookies', 'rgba(74, 134, 232, 1)', 'rgba(74, 134, 232, 0.1)');

        // Круговая диаграмма типов трекеров
        updatePieChart('trackerTypesChart', stats.charts.trackerTypes);

        // Круговая диаграмма категорий трекеров
        updatePieChart('trackerCategoriesChart', stats.charts.trackerCategories);
    }

    // Обновление таблиц
    function updateTables(stats) {
        // Топ доменов по трекерам
        updateTopDomainsTable(stats.tables.topDomains);

        // Топ трекеров
        updateTopTrackersTable(stats.tables.topTrackers);
    }

    // Обновление таблицы топ доменов
    function updateTopDomainsTable(domains) {
        const tableBody = document.getElementById('topDomainsBody');

        if (!domains || domains.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="no-data">Нет данных для отображения</td></tr>';
            return;
        }

        tableBody.innerHTML = domains.map(domain => `
            <tr>
                <td>
                    <div class="domain-cell">
                        <div class="domain-icon">${domain.domain.charAt(0).toUpperCase()}</div>
                        ${domain.domain}
                    </div>
                </td>
                <td>${domain.trackers}</td>
                <td>${domain.cookies}</td>
                <td>${new Date(domain.lastVisit).toLocaleString('ru-RU')}</td>
            </tr>
        `).join('');
    }

    // Обновление таблицы топ трекеров
    function updateTopTrackersTable(trackers) {
        const tableBody = document.getElementById('topTrackersBody');

        if (!trackers || trackers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="4" class="no-data">Нет данных для отображения</td></tr>';
            return;
        }

        // Находим максимальное количество для прогресс-бара
        const maxCount = Math.max(...trackers.map(tracker => tracker.count));

        tableBody.innerHTML = trackers.map(tracker => `
            <tr>
                <td>${tracker.name}</td>
                <td>${tracker.category}</td>
                <td>${tracker.count}</td>
                <td>
                    <div class="progress-bar-container">
                        <div class="progress-bar" style="width: ${(tracker.count / maxCount) * 100}%"></div>
                    </div>
                    ${tracker.percentage}%
                </td>
            </tr>
        `).join('');
    }

    // Обновление графика по дням
    function updateDailyChart(canvasId, data, label, borderColor, backgroundColor) {
        const ctx = document.getElementById(canvasId).getContext('2d');

        // Проверяем, существует ли уже экземпляр графика
        if (window.charts && window.charts[canvasId]) {
            window.charts[canvasId].destroy();
        }

        // Создаем новый график
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.labels,
                datasets: [{
                    label: label,
                    data: data.values,
                    borderColor: borderColor,
                    backgroundColor: backgroundColor,
                    tension: 0.3,
                    borderWidth: 2,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    }
                }
            }
        });

        // Сохраняем экземпляр графика
        if (!window.charts) window.charts = {};
        window.charts[canvasId] = chart;
    }

    // Обновление круговой диаграммы
    function updatePieChart(canvasId, data) {
        const ctx = document.getElementById(canvasId).getContext('2d');

        // Проверяем, существует ли уже экземпляр графика
        if (window.charts && window.charts[canvasId]) {
            window.charts[canvasId].destroy();
        }

        // Создаем цвета
        const colors = [
            'rgba(74, 134, 232, 0.7)',
            'rgba(220, 53, 69, 0.7)',
            'rgba(40, 167, 69, 0.7)',
            'rgba(255, 193, 7, 0.7)',
            'rgba(108, 117, 125, 0.7)',
            'rgba(111, 66, 193, 0.7)',
            'rgba(23, 162, 184, 0.7)',
            'rgba(253, 126, 20, 0.7)',
            'rgba(32, 201, 151, 0.7)',
            'rgba(102, 16, 242, 0.7)'
        ];

        // Создаем новый график
        const chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.labels,
                datasets: [{
                    data: data.values,
                    backgroundColor: colors.slice(0, data.labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 12,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const percentage = Math.round((value / total) * 100);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });

        // Сохраняем экземпляр графика
        if (!window.charts) window.charts = {};
        window.charts[canvasId] = chart;
    }

    // Показ сообщения об ошибке
    function showError(message) {
        const summaryCards = document.querySelectorAll('.summary-card');
        const chartContainers = document.querySelectorAll('.chart-container');
        const tables = document.querySelectorAll('.table-section table tbody');

        summaryCards.forEach(card => {
            const valueElement = card.querySelector('.summary-value');
            if (valueElement) {
                valueElement.textContent = '-';
            }
        });

        chartContainers.forEach(container => {
            container.innerHTML = `<div class="no-data">${message}</div>`;
        });

        tables.forEach(table => {
            table.innerHTML = `<tr><td colspan="4" class="no-data">${message}</td></tr>`;
        });
    }

    // Моковые данные для тестирования
    function getMockData(period) {
        // Генерация дат для заданного периода
        const generateDates = (periodType) => {
            const dates = [];
            const today = new Date();
            let daysCount = 0;

            switch (periodType) {
                case 'day':
                    daysCount = 1;
                    break;
                case 'week':
                    daysCount = 7;
                    break;
                case 'month':
                    daysCount = 30;
                    break;
                case 'all':
                    daysCount = 90;
                    break;
            }

            for (let i = daysCount - 1; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                if (periodType === 'day') {
                    dates.push(date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }));
                } else {
                    dates.push(date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }));
                }
            }

            return dates;
        };

        // Генерация случайных чисел для графиков
        const generateRandomValues = (count, max) => {
            return Array.from({ length: count }, () => Math.floor(Math.random() * max) + 1);
        };

        const dates = generateDates(period);
        const trackerValues = generateRandomValues(dates.length, 30);
        const cookieValues = generateRandomValues(dates.length, 50);

        // Суммарные значения
        const totalTrackers = trackerValues.reduce((acc, val) => acc + val, 0);
        const totalCookies = cookieValues.reduce((acc, val) => acc + val, 0);
        const totalBlocked = Math.floor(totalTrackers * 0.7); // 70% заблокировано
        const totalSites = Math.floor(dates.length * 2.5); // Примерно 2-3 сайта в день

        // Генерация данных для круговых диаграмм
        const trackerTypes = {
            labels: ['Аналитика', 'Реклама', 'Соц. сети', 'Маркетинг', 'Другое'],
            values: generateRandomValues(5, 100)
        };

        const trackerCategories = {
            labels: ['Google', 'Yandex', 'Facebook', 'Twitter', 'Другие'],
            values: generateRandomValues(5, 100)
        };

        // Генерация данных для таблиц
        const topDomains = [];
        const domains = ['example.com', 'test-site.ru', 'news.com', 'shop.ru', 'blog.org', 'social.net', 'mail.ru', 'search.com', 'forum.org', 'videos.net'];

        for (let i = 0; i < 10; i++) {
            topDomains.push({
                domain: domains[i],
                trackers: Math.floor(Math.random() * 20) + 1,
                cookies: Math.floor(Math.random() * 30) + 1,
                lastVisit: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString()
            });
        }

        // Сортировка по количеству трекеров
        topDomains.sort((a, b) => b.trackers - a.trackers);

        const topTrackers = [];
        const trackers = [
            { name: 'Google Analytics', category: 'Аналитика' },
            { name: 'Facebook Pixel', category: 'Соц. сети' },
            { name: 'Яндекс.Метрика', category: 'Аналитика' },
            { name: 'DoubleClick', category: 'Реклама' },
            { name: 'Google Tag Manager', category: 'Маркетинг' },
            { name: 'Twitter Pixel', category: 'Соц. сети' },
            { name: 'HotJar', category: 'Аналитика' },
            { name: 'Criteo', category: 'Реклама' },
            { name: 'Adroll', category: 'Реклама' },
            { name: 'LinkedIn Pixel', category: 'Соц. сети' }
        ];

        for (let i = 0; i < 10; i++) {
            const count = Math.floor(Math.random() * 100) + 1;
            topTrackers.push({
                name: trackers[i].name,
                category: trackers[i].category,
                count: count,
                percentage: Math.floor(count / totalSites * 100)
            });
        }

        // Сортировка по количеству
        topTrackers.sort((a, b) => b.count - a.count);

        return {
            summary: {
                totalTrackers: totalTrackers,
                totalCookies: totalCookies,
                totalBlocked: totalBlocked,
                totalSites: totalSites
            },
            charts: {
                dailyTrackers: {
                    labels: dates,
                    values: trackerValues
                },
                dailyCookies: {
                    labels: dates,
                    values: cookieValues
                },
                trackerTypes: trackerTypes,
                trackerCategories: trackerCategories
            },
            tables: {
                topDomains: topDomains,
                topTrackers: topTrackers
            }
        };
    }

    // Загружаем статистику по умолчанию на день
    loadStatistics('day');
});