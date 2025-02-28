// popup/popup.js
document.addEventListener('DOMContentLoaded', function () {
    // Инициализация интерфейса
    const tabItems = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const toggleButton = document.getElementById("toggle");
    const statusIndicator = document.querySelector('.status-indicator');
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');

    // Переключение вкладок
    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');

            // Активируем выбранную вкладку
            tabItems.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');

            // Отображаем содержимое выбранной вкладки
            tabContents.forEach(content => {
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                } else {
                    content.classList.remove('active');
                }
            });
        });
    });

    // Раскрывающиеся секции
    collapsibleHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const collapsible = header.parentElement;
            collapsible.classList.toggle('active');
        });
    });

    // Функция форматирования даты
    function formatDate(dateString) {
        return new Date(dateString).toLocaleString('ru-RU');
    }

    // Обновление кнопки включения/выключения
    function updateToggleButton(enabled) {
        toggleButton.querySelector('.toggle-text').innerText = enabled ? "Выключить" : "Включить";
        toggleButton.classList.toggle('active', enabled);
        statusIndicator.classList.toggle('active', enabled);
    }

    // Отображение статуса сбора данных
    function displayCollectionStatus(element, isCollected) {
        const statusElement = document.getElementById(element);
        if (statusElement) {
            statusElement.innerText = isCollected ? "✓" : "✗";
            statusElement.classList.toggle('collected', isCollected);
            statusElement.classList.toggle('not-collected', !isCollected);
        }
    }

    // Обновление информации о соответствии 149-ФЗ
    function updateComplianceStatus(hasRecommendationNotice, hasOptOut, hasDescription) {
        const noticeIndicator = document.getElementById('noticeIndicator');
        const recommendationIndicator = document.getElementById('recommendationIndicator');
        const optOutIndicator = document.getElementById('optOutIndicator');

        updateComplianceIcon(noticeIndicator, hasRecommendationNotice);
        updateComplianceIcon(recommendationIndicator, hasDescription);
        updateComplianceIcon(optOutIndicator, hasOptOut);

        document.getElementById('noticeText').textContent =
            hasRecommendationNotice ? "Уведомление о сборе данных: Есть" : "Уведомление о сборе данных: Отсутствует";
        document.getElementById('recommendationText').textContent =
            hasDescription ? "Информация о рекомендательных алгоритмах: Есть" : "Информация о рекомендательных алгоритмах: Отсутствует";
        document.getElementById('optOutText').textContent =
            hasOptOut ? "Возможность отключения: Есть" : "Возможность отключения: Отсутствует";
    }

    // Обновление иконки соответствия
    function updateComplianceIcon(element, isCompliant) {
        if (element) {
            element.textContent = isCompliant ? "check_circle" : "error";
            element.className = "material-icons";
            if (!isCompliant) {
                element.classList.add("error");
                element.style.color = "var(--danger-color)";
            }
        }
    }

    // Расчет и отображение оценки приватности
    function updatePrivacyScore(data) {
        const privacyScoreIndicator = document.getElementById('privacyScoreIndicator');
        const privacyScoreText = document.getElementById('privacyScoreText');
        let score = 100;

        // Снижаем оценку за собранные данные
        if (data.ip?.collected) score -= 20;
        if (data.geolocation?.collected) score -= 20;
        if (data.userAgent?.collected) score -= 10;

        // Снижаем оценку за cookies и трекеры
        if (data.cookies?.value?.length > 0) {
            score -= Math.min(data.cookies.value.length * 2, 20);
        }

        if (data.trackers?.length > 0 && data.trackers[0] !== "Не найдено") {
            score -= Math.min(data.trackers.length * 5, 20);
        }

        // Увеличиваем оценку за наличие уведомлений
        if (data.hasRecommendationNotice) score += 10;

        // Ограничиваем оценку в диапазоне 0-100
        score = Math.max(0, Math.min(score, 100));

        // Обновляем UI
        privacyScoreIndicator.textContent = score;
        privacyScoreIndicator.className = "score-circle";

        if (score >= 70) {
            privacyScoreIndicator.classList.add("good");
            privacyScoreText.textContent = "Хорошая";
        } else if (score >= 40) {
            // Оставляем стандартный желтый цвет
            privacyScoreText.textContent = "Средняя";
        } else {
            privacyScoreIndicator.classList.add("bad");
            privacyScoreText.textContent = "Плохая";
        }
    }

    // Обновление UI с полученными данными
    function updateUI(data) {
        console.log("Обновление UI с данными:", data);
        const info = data.collectedInfo || {};

        // Текущий домен
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            try {
                const url = new URL(tabs[0].url);
                const domain = url.hostname;
                document.getElementById("currentDomain").textContent = domain;
            } catch (e) {
                console.error("Ошибка при получении домена:", e);
            }
        });

        // Обновляем основную информацию
        document.getElementById("ip").textContent = info.ip?.value || 'Неизвестно';
        document.getElementById("geolocation").textContent = info.geolocation?.value || 'Не определено';
        document.getElementById("userAgent").textContent = info.userAgent?.value || 'Неизвестно';

        // Отображаем статус сбора данных
        displayCollectionStatus("ipCollectionStatus", info.ip?.collected);
        displayCollectionStatus("geoCollectionStatus", info.geolocation?.collected);
        displayCollectionStatus("uaCollectionStatus", info.userAgent?.collected);

        // Обновляем cookies
        const cookiesElement = document.getElementById("cookies");
        const cookiesCount = info.cookies?.value?.length || 0;
        document.getElementById("cookiesCount").textContent = cookiesCount;
        if (cookiesCount > 0) {
            const cookiesList = info.cookies.value.map(cookie =>
                `<div class="data-list-item">${cookie}</div>`
            ).join("");
            cookiesElement.innerHTML = cookiesList;
        } else {
            cookiesElement.innerHTML = "<div style='color: #6c757d;'>Нет cookies</div>";
        }

        // Обновляем трекеры
        const trackersElement = document.getElementById("trackers");
        const trackers = (info.trackers || ['Не найдено']);
        const trackersCount = trackers[0] === 'Не найдено' ? 0 : trackers.length;
        document.getElementById("trackersCount").textContent = trackersCount;
        if (trackersCount > 0) {
            const trackersList = trackers.map(tracker =>
                `<div class="data-list-item">${tracker}</div>`
            ).join("");
            trackersElement.innerHTML = trackersList;
        } else {
            trackersElement.innerHTML = "<div style='color: #6c757d;'>Трекеры не обнаружены</div>";
        }

        // Обновляем HTTP-запросы
        const requestsListElement = document.getElementById("requestsList");
        const requestsCount = info.requests?.length || 0;
        document.getElementById("requestsCount").textContent = requestsCount;
        if (requestsCount > 0) {
            const requestsList = info.requests.slice(-10).reverse().map(r =>
                `<div class="data-list-item">
                    <strong>${r.method}</strong> ${r.url}
                    <div style="font-size: 10px; color: #6c757d;">${formatDate(r.timestamp)}</div>
                </div>`
            ).join("");
            requestsListElement.innerHTML = requestsList;
        } else {
            requestsListElement.innerHTML = "<div style='color: #6c757d;'>Нет запросов</div>";
        }

        // Обновляем WebSocket
        const websocketsListElement = document.getElementById("websocketsList");
        if (info.websockets?.length > 0) {
            const websocketsList = info.websockets.slice(-10).reverse().map(w =>
                `<div class="data-list-item">
                    ${w.url}
                    <div style="font-size: 10px; color: #6c757d;">${formatDate(w.timestamp)}</div>
                </div>`
            ).join("");
            websocketsListElement.innerHTML = websocketsList;
        } else {
            websocketsListElement.innerHTML = "<div style='color: #6c757d;'>Нет WebSocket соединений</div>";
        }

        // Обновляем соответствие 149-ФЗ
        updateComplianceStatus(
            info.hasRecommendationNotice || false,
            false, // Пока у нас нет данных о возможности отказа
            false  // Пока у нас нет данных о описании алгоритмов
        );

        // Рассчитываем оценку приватности
        updatePrivacyScore(info);

        // Обновляем время последнего обновления
        const lastUpdateElements = document.querySelectorAll('.last-update');
        const lastUpdateText = info.lastUpdated
            ? `Последнее обновление: ${formatDate(info.lastUpdated)}`
            : "Последнее обновление: не проводилось";

        lastUpdateElements.forEach(element => {
            element.textContent = lastUpdateText;
        });
    }

    // Функция переключения блокировки
    async function toggleBlock(dataType, element) {
        try {
            const status = await sendMessage({ type: "getBlockedStatus" });
            const currentState = status[dataType];
            const newState = !currentState;

            const response = await sendMessage({
                type: "blockData",
                dataType,
                enabled: newState
            });

            if (response && response.success) {
                if (element) {
                    element.textContent = newState ? "Разблокировать" : "Блокировать";
                }
            } else {
                console.error("Ошибка переключения состояния:", dataType);
            }
        } catch (error) {
            console.error("Ошибка при переключении блокировки:", error);
        }
    }

    // Загрузка данных для графика
    async function loadChartData() {
        try {
            const data = await sendMessage({ type: "getVisualizationData" });
            console.log("Данные для графика:", data);

            if (!data) {
                console.error("Нет данных для графика");
                return;
            }

            const ctx = document.getElementById('trackingChart').getContext('2d');
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: data.labels,
                    datasets: [{
                        label: 'Трекеры',
                        data: data.trackers,
                        borderColor: 'rgba(220, 53, 69, 1)',
                        backgroundColor: 'rgba(220, 53, 69, 0.1)',
                        borderWidth: 2,
                        tension: 0.2,
                        fill: true
                    }, {
                        label: 'Cookies',
                        data: data.cookies,
                        borderColor: 'rgba(74, 134, 232, 1)',
                        backgroundColor: 'rgba(74, 134, 232, 0.1)',
                        borderWidth: 2,
                        tension: 0.2,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: { display: true, text: 'Количество' },
                            min: 0,
                            max: 10
                        },
                        x: {
                            title: { display: true, text: 'Время' }
                        }
                    }
                }
            });
        } catch (error) {
            console.error("Ошибка загрузки данных для графика:", error);
        }
    }

    // Обёртка для chrome.runtime.sendMessage
    function sendMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, response => {
                if (chrome.runtime.lastError) {
                    console.error("Ошибка отправки сообщения:", chrome.runtime.lastError);
                    reject(chrome.runtime.lastError);
                } else {
                    resolve(response);
                }
            });
        });
    }

    // Обработчики кнопок блокировки
    document.getElementById('blockCookies').addEventListener('click', e => toggleBlock('cookies', e.target));
    document.getElementById('blockTrackers').addEventListener('click', e => toggleBlock('trackers', e.target));
    document.getElementById('blockRequests').addEventListener('click', e => toggleBlock('requests', e.target));
    document.getElementById('blockWebsockets').addEventListener('click', e => toggleBlock('websockets', e.target));


    // Кнопка полной блокировки
    document.getElementById('blockAll').addEventListener('click', async () => {
        try {
            await Promise.all([
                toggleBlock('cookies'),
                toggleBlock('trackers'),
                toggleBlock('requests'),
                toggleBlock('websockets')
            ]);

            alert('Все типы данных заблокированы!');
        } catch (error) {
            console.error("Ошибка при блокировке всего:", error);
        }
    });

    // Обработчик кнопки детальной информации
    document.getElementById('showDetails').addEventListener('click', () => {
        // Переключаемся на вкладку трекинга
        document.querySelector('[data-tab="tracking"]').click();
    });

    // Включение/выключение расширения
    toggleButton.addEventListener("click", async () => {
        try {
            const { enabled } = await chrome.storage.local.get({ enabled: true });
            const newState = !enabled;

            await chrome.storage.local.set({ enabled: newState });
            updateToggleButton(newState);
        } catch (error) {
            console.error("Ошибка переключения состояния расширения:", error);
        }
    });

    try {
        // Инициализация UI
        chrome.storage.local.get({ enabled: true }, (data) => {
            updateToggleButton(data.enabled);
        });

        // Загрузка данных
        chrome.storage.local.get("collectedInfo", (data) => {
            updateUI(data);
        });

        // Загрузка графика
        loadChartData();
    } catch (error) {
        console.error("Ошибка инициализации интерфейса:", error);
    }

    // Обработчик обновления данных
    chrome.storage.onChanged.addListener((changes) => {
        console.log("Изменения в storage:", changes);

        if (changes.collectedInfo) {
            updateUI({ collectedInfo: changes.collectedInfo.newValue });
        }

        if (changes.enabled) {
            updateToggleButton(changes.enabled.newValue);
        }
    });
    // Переключение периодов статистики
    const periodButtons = document.querySelectorAll('.period-button');
    periodButtons.forEach(button => {
        button.addEventListener('click', () => {
            periodButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            loadStats(button.getAttribute('data-period'));
        });
    });

    // Обработчики событий для переключателей блокировки
    document.getElementById('cookiesSwitch').addEventListener('change', function (e) {
        toggleBlock('cookies', null, e.target.checked);
    });
    document.getElementById('thirdPartyCookiesSwitch').addEventListener('change', function (e) {
        toggleBlock('thirdPartyCookies', null, e.target.checked);
    });
    document.getElementById('trackersSwitch').addEventListener('change', function (e) {
        toggleBlock('trackers', null, e.target.checked);
    });
    document.getElementById('requestsSwitch').addEventListener('change', function (e) {
        toggleBlock('requests', null, e.target.checked);
    });
    document.getElementById('websocketsSwitch').addEventListener('change', function (e) {
        toggleBlock('websockets', null, e.target.checked);
    });
    document.getElementById('fingerprintingSwitch').addEventListener('change', function (e) {
        toggleBlock('fingerprinting', null, e.target.checked);
    });

    // Обработчики блокировки/разрешения домена
    document.getElementById('blockDomain').addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = new URL(tab.url);
            const domain = url.hostname;

            const response = await sendMessage({ type: "blockDomain", domain });
            if (response.success) {
                alert(`Домен ${domain} заблокирован. Изменения вступят в силу при следующем посещении сайта.`);
            } else {
                alert(`Ошибка блокировки домена: ${response.error || response.message || 'неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error("Ошибка блокировки домена:", error);
        }
    });

    document.getElementById('allowDomain').addEventListener('click', async () => {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const url = new URL(tab.url);
            const domain = url.hostname;

            const response = await sendMessage({ type: "allowDomain", domain });
            if (response.success) {
                alert(`Домен ${domain} разрешен`);
            } else {
                alert(`Ошибка разрешения домена: ${response.error || 'неизвестная ошибка'}`);
            }
        } catch (error) {
            console.error("Ошибка разрешения домена:", error);
        }
    });

    // Открытие менеджера доменов
    document.getElementById('openDomainManager').addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            try {
                const url = new URL(tabs[0].url);
                const domain = url.hostname;
                chrome.tabs.create({ url: `domains.html?domain=${domain}` });
            } catch (error) {
                console.error("Ошибка при получении домена:", error);
                chrome.tabs.create({ url: "domains.html" });
            }
        });
    });

    // Функция для загрузки статистики
    async function loadStats(period = 'day') {
        try {
            // Здесь будет запрос к background.js для получения статистики
            // Временно используем моковые данные
            let data = {
                totalTrackersBlocked: 0,
                totalCookiesDetected: 0,
                totalSitesVisited: 0,
                topTrackers: [],
                topDomains: []
            };

            switch (period) {
                case 'day':
                    data = {
                        totalTrackersBlocked: 47,
                        totalCookiesDetected: 125,
                        totalSitesVisited: 12,
                        topTrackers: [
                            { name: "Google Analytics", count: 15 },
                            { name: "Facebook Pixel", count: 8 },
                            { name: "Яндекс.Метрика", count: 7 },
                            { name: "DoubleClick", count: 6 },
                            { name: "Google Tag Manager", count: 4 }
                        ],
                        topDomains: [
                            { name: "example.com", count: 23 },
                            { name: "test-site.ru", count: 17 },
                            { name: "news.ru", count: 14 },
                            { name: "shop.com", count: 9 },
                            { name: "blog.example.org", count: 7 }
                        ]
                    };
                    break;
                case 'week':
                    data = {
                        totalTrackersBlocked: 312,
                        totalCookiesDetected: 782,
                        totalSitesVisited: 47,
                        topTrackers: [
                            { name: "Google Analytics", count: 87 },
                            { name: "Яндекс.Метрика", count: 52 },
                            { name: "Facebook Pixel", count: 45 },
                            { name: "DoubleClick", count: 41 },
                            { name: "Google Tag Manager", count: 33 }
                        ],
                        topDomains: [
                            { name: "example.com", count: 104 },
                            { name: "news.ru", count: 89 },
                            { name: "test-site.ru", count: 76 },
                            { name: "shop.com", count: 65 },
                            { name: "social-network.ru", count: 53 }
                        ]
                    };
                    break;
                case 'month':
                    data = {
                        totalTrackersBlocked: 1247,
                        totalCookiesDetected: 3215,
                        totalSitesVisited: 193,
                        topTrackers: [
                            { name: "Google Analytics", count: 342 },
                            { name: "Яндекс.Метрика", count: 218 },
                            { name: "Facebook Pixel", count: 187 },
                            { name: "DoubleClick", count: 165 },
                            { name: "Google Tag Manager", count: 129 }
                        ],
                        topDomains: [
                            { name: "example.com", count: 412 },
                            { name: "news.ru", count: 376 },
                            { name: "social-network.ru", count: 321 },
                            { name: "shop.com", count: 287 },
                            { name: "mail.ru", count: 243 }
                        ]
                    };
                    break;
            }

            // Обновляем статистику
            document.getElementById('totalTrackersBlocked').textContent = data.totalTrackersBlocked;
            document.getElementById('totalCookiesDetected').textContent = data.totalCookiesDetected;
            document.getElementById('totalSitesVisited').textContent = data.totalSitesVisited;

            // Отображаем топ трекеров
            const topTrackersElement = document.getElementById('topTrackers');
            const trackersHTML = data.topTrackers.map(tracker =>
                `<div class="top-item">
                <span class="top-item-name">${tracker.name}</span>
                <span class="top-item-value">${tracker.count}</span>
            </div>`
            ).join('');
            topTrackersElement.innerHTML = trackersHTML || '<div class="loading-placeholder">Нет данных</div>';

            // Отображаем топ доменов
            const topDomainsElement = document.getElementById('topDomains');
            const domainsHTML = data.topDomains.map(domain =>
                `<div class="top-item">
                <span class="top-item-name">${domain.name}</span>
                <span class="top-item-value">${domain.count}</span>
            </div>`
            ).join('');
            topDomainsElement.innerHTML = domainsHTML || '<div class="loading-placeholder">Нет данных</div>';
        } catch (error) {
            console.error("Ошибка загрузки статистики:", error);
        }
    }

    // Обновляем состояние переключателей блокировки
    function updateBlockingSwitches(blockedTypes) {
        document.getElementById("cookiesSwitch").checked = blockedTypes.cookies || false;
        document.getElementById("thirdPartyCookiesSwitch").checked = blockedTypes.thirdPartyCookies || false;
        document.getElementById("trackersSwitch").checked = blockedTypes.trackers || false;
        document.getElementById("requestsSwitch").checked = blockedTypes.requests || false;
        document.getElementById("websocketsSwitch").checked = blockedTypes.websockets || false;
        document.getElementById("fingerprintingSwitch").checked = blockedTypes.fingerprinting || false;
    }

    // Модифицированная функция toggleBlock
    async function toggleBlock(dataType, element, state) {
        try {
            const status = await sendMessage({ type: "getBlockedStatus" });
            const currentState = status[dataType];
            const newState = state !== undefined ? state : !currentState;

            const response = await sendMessage({
                type: "blockData",
                dataType,
                enabled: newState
            });

            if (response && response.success) {
                if (element) {
                    if (element.tagName === 'INPUT') {
                        element.checked = newState;
                    } else {
                        element.textContent = newState ? "Разблокировать" : "Блокировать";
                    }
                }

                // Также обновляем текст на кнопках в других разделах
                if (dataType === 'cookies') {
                    document.getElementById("blockCookies").textContent = newState ? "Разблокировать" : "Блокировать";
                    document.getElementById("cookiesSwitch").checked = newState;
                } else if (dataType === 'trackers') {
                    document.getElementById("blockTrackers").textContent = newState ? "Разблокировать" : "Блокировать";
                    document.getElementById("trackersSwitch").checked = newState;
                } else if (dataType === 'requests') {
                    document.getElementById("blockRequests").textContent = newState ? "Разблокировать" : "Блокировать";
                    document.getElementById("requestsSwitch").checked = newState;
                } else if (dataType === 'websockets') {
                    document.getElementById("blockWebsockets").textContent = newState ? "Разблокировать" : "Блокировать";
                    document.getElementById("websocketsSwitch").checked = newState;
                }
            } else {
                console.error("Ошибка переключения состояния:", dataType);
                // Возвращаем элемент в исходное состояние
                if (element && element.tagName === 'INPUT') {
                    element.checked = currentState;
                }
            }
        } catch (error) {
            console.error("Ошибка при переключении блокировки:", error);
        }
    }

    // Загружаем статистику при инициализации
    loadStats('day');

    // Получаем статус блокировки и обновляем переключатели
    sendMessage({ type: "getBlockedStatus" }).then(blockedTypes => {
        updateBlockingSwitches(blockedTypes);
    }).catch(error => {
        console.error("Ошибка получения статуса блокировки:", error);
    });

    // Открытие статистики
    document.getElementById('openStatistics').addEventListener('click', function () {
        chrome.tabs.create({ url: 'statistics.html' });
    });
});
