// content.js
(async function () {
    if (typeof HTMLAnalyzer === 'undefined') {
        console.error("HTMLAnalyzer не определен. Возможно, скрипт html_analyzer.js не загружен.");
        return;
    }
    function sendMessage(message) {
        return new Promise((resolve) => chrome.runtime.sendMessage(message, resolve));
    }
    
    chrome.storage.local.get("enabled", async (data) => {
        if (!data.enabled) return;

        document.addEventListener('submit', (e) => {
            const formData = new FormData(e.target);
            const formFields = {};
            formData.forEach((value, key) => {
                formFields[key] = value;
            });

            chrome.storage.local.get("collectedInfo", (data) => {
                if (chrome.runtime.lastError) {
                    console.error("Ошибка получения collectedInfo для форм:", chrome.runtime.lastError);
                    return;
                }
                const updatedData = data.collectedInfo || {};
                updatedData.forms = updatedData.forms || [];
                updatedData.forms.push({
                    url: window.location.href,
                    fields: Object.keys(formFields),
                    timestamp: new Date().toISOString()
                });
                chrome.storage.local.set({ collectedInfo: updatedData }, () => {
                    if (chrome.runtime.lastError) {
                        console.error("Ошибка сохранения collectedInfo:", chrome.runtime.lastError);
                    } else {
                        console.log("collectedInfo сохранено:", updatedData);
                        createNotification(updatedData);
                    }
                });
            });
        });

        const collectedData = {
            ip: { value: "Неизвестно", collected: false },
            cookies: { value: [], collected: false },
            geolocation: { value: "Не определено", collected: false },
            userAgent: { value: navigator.userAgent, collected: false },
            trackers: [],
            hasRecommendationNotice: false,
            hasSpecificCookieNotice: false
        };

        // Инициализируем анализатор уведомлений о 149-ФЗ
        const privacyAnalyzer = new PrivacyNoticeAnalyzer();
        const privacyNoticeResults = await privacyAnalyzer.analyzePageNotices(document);
        collectedData.privacyNotice = privacyNoticeResults;

        const htmlAnalyzer = new HTMLAnalyzer(); // Создание экземпляра анализатора
        const personalizationData = await htmlAnalyzer.analyzeHTML(document); // Анализ HTML
        collectedData.personalization = personalizationData;

        const style = document.createElement('style');
        style.textContent = `
            .data-tracker-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
                padding: 25px;
                width: 400px;
                max-height: 80vh;
                overflow-y: auto;
                z-index: 999999;
                font-family: Arial, sans-serif;
                animation: slideIn 0.5s ease-out;
            }
            .data-tracker-notification.warning {
                border-left: 4px solid #dc3545;
            }
            .data-tracker-notification.safe {
                border-left: 4px solid #28a745;
            }
            .data-tracker-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }
            .data-tracker-title {
                font-weight: bold;
                font-size: 18px;
                margin: 0;
                color: #333;
                max-width: 85%;
            }
            .data-tracker-close {
                background: none;
                border: none;
                cursor: pointer;
                color: #666;
                font-size: 24px;
                padding: 5px;
                line-height: 1;
                transition: color 0.2s;
            }
            .data-tracker-close:hover {
                color: #333;
            }
            .data-tracker-content {
                font-size: 14px;
                color: #666;
            }
            .data-section {
                margin: 15px 0;
                padding: 15px;
                background: #f8f9fa;
                border-radius: 8px;
            }
            .data-section-title {
                font-weight: bold;
                color: #333;
                margin-bottom: 10px;
                font-size: 15px;
            }
            .data-item {
                margin: 8px 0;
                line-height: 1.4;
            }
            .data-item-label {
                font-weight: 600;
                color: #555;
                margin-right: 5px;
            }
            .data-item-value {
                word-break: break-word;
            }
            .cookies-list {
                max-height: 200px;
                overflow-y: auto;
                margin-top: 10px;
                padding: 10px;
                background: white;
                border-radius: 4px;
                border: 1px solid #eee;
            }
            .cookie-item {
                padding: 5px 0;
                border-bottom: 1px solid #eee;
            }
            .cookie-item:last-child {
                border-bottom: none;
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `;
        document.head.appendChild(style);

        async function getIP() {
            try {
                const response = await fetch("https://api.ipify.org?format=json");
                const data = await response.json();
                return { value: data.ip, collected: false };
            } catch (e) {
                chrome.storage.local.get("eventLog", (data) => {
                    const log = data.eventLog || [];
                    log.push({ event: `Ошибка получения IP: ${e.message}`, timestamp: new Date().toISOString() });
                    chrome.storage.local.set({ eventLog });
                });
                return { value: "Не удалось получить", collected: false };
            }
        }

        async function getGeolocation() {
            return new Promise((resolve) => {
                if ("geolocation" in navigator) {
                    navigator.geolocation.getCurrentPosition(
                        (position) => resolve({ value: `${position.coords.latitude}, ${position.coords.longitude}`, collected: true }),
                        (error) => {
                            chrome.storage.local.get("eventLog", (data) => {
                                const log = data.eventLog || [];
                                log.push({ event: `Ошибка геолокации: ${error.message}`, timestamp: new Date().toISOString() });
                                chrome.storage.local.set({ eventLog });
                            });
                            resolve({ value: "Не определено", collected: false });
                        },
                        { timeout: 5000 }
                    );
                } else {
                    resolve({ value: "Не поддерживается", collected: false });
                }
            });
        }

        function checkRecommendationNotice() {
            const keywords = [
                "рекомендательные технологии", "персонализация", "рекомендации", "cookies для персонализации",
                "мы используем cookies, чтобы сохранять ваш поиск, рекомендовать полезное и создавать другие удобства на сайте"
            ];
            return Array.from(document.querySelectorAll("p, div, span"))
                .some(el => keywords.some(keyword => el.textContent.toLowerCase().includes(keyword)));
        }

        collectedData.hasRecommendationNotice = checkRecommendationNotice();
        collectedData.trackers = detectTrackers();
        collectedData.ip.collected = await checkWebRTCLeak();

        function detectTrackers() {
            const trackers = {
                "Google Analytics": /ga\.js|analytics\.js/,
                "Meta Pixel": /facebook\.com\/tr|fbq/,
                "Яндекс.Метрика": /mc\.yandex\.ru/
            };
            const scripts = Array.from(document.getElementsByTagName("script")).map(s => s.src);
            const found = [];
            for (const [name, regex] of Object.entries(trackers)) {
                if (scripts.some(src => regex.test(src))) {
                    found.push(name);
                }
            }
            return found.length > 0 ? found : ["Не найдено"];
        }

        function checkWebRTCLeak() {
            return new Promise((resolve) => {
                if (!window.RTCPeerConnection) {
                    resolve(false);
                    return;
                }
                const pc = new RTCPeerConnection({ iceServers: [] });
                pc.createDataChannel("");
                pc.createOffer().then(offer => {
                    pc.setLocalDescription(offer);
                    pc.onicecandidate = (event) => {
                        if (event.candidate && event.candidate.candidate.includes("candidate")) {
                            resolve(true);
                        } else {
                            resolve(false);
                        }
                        pc.close();
                    };
                }).catch(() => resolve(false));
            });
        }

        collectedData.ip = await getIP();
        collectedData.geolocation = await getGeolocation();
        collectedData.hasRecommendationNotice = checkRecommendationNotice();
        collectedData.trackers = detectTrackers();
        collectedData.ip.collected = await checkWebRTCLeak();

        function formatDateTime(date) {
            return new Date(date).toLocaleString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
        }

        function createNotification(data) {
            const notification = document.createElement('div');
            const trackerCookiesCollected = (data.cookies?.value || []).some(cookie =>
                cookie.includes("_ga") || cookie.includes("_fbp") || cookie.includes("_ym_uid") ||
                cookie.includes("uid") || cookie.includes("track")
            );
            const isDataCollected = trackerCookiesCollected || (data.geolocation?.collected || false) || (data.userAgent?.collected || false) || (data.ip?.collected || false);
            notification.className = `data-tracker-notification ${isDataCollected ? 'warning' : 'safe'}`;

            notification.innerHTML = `
        <div class="data-tracker-header">
            <h3 class="data-tracker-title">
                ${isDataCollected ? '⚠️ Сайт собирает данные о вас' : '✅ Сайт не собирает данные'}
            </h3>
            <button class="data-tracker-close">×</button>
        </div>
        <div class="data-tracker-content">
            <div class="data-section">
                <div class="data-section-title">🌐 Основная информация</div>
                <div class="data-item">
                    <span class="data-item-label">IP-адрес:</span>
                    <span class="data-item-value">${data.ip?.value || 'Неизвестно'} - ${data.ip?.collected ? 'сайт собрал' : 'сайт не собрал'}</span>
                </div>
                <div class="data-item">
                    <span class="data-item-label">User-Agent:</span>
                    <span class="data-item-value">${data.userAgent?.value || 'Неизвестно'} - ${data.userAgent?.collected ? 'сайт собрал' : 'сайт не собрал'}</span>
                </div>
                <div class="data-item">
                    <span class="data-item-label">Геолокация:</span>
                    <span class="data-item-value">${data.geolocation?.value || 'Не определено'} - ${data.geolocation?.collected ? 'сайт собрал' : 'сайт не собрал'}</span>
                </div>
                <div class="data-item">
                    <span class="data-item-label">Дата и время проверки:</span>
                    <span class="data-item-value">${formatDateTime(new Date())}</span>
                </div>
                <div class="data-item">
                    <span class="data-item-label">Домен:</span>
                    <span class="data-item-value">${window.location.hostname}</span>
                </div>
            </div>

            ${(data.cookies?.collected && data.cookies?.value?.length > 0) ? `
                <div class="data-section">
                    <div class="data-section-title">🍪 Cookies (${data.cookies.value.length})</div>
                    <div class="cookies-list">
                        ${data.cookies.value.map(cookie => `
                            <div class="cookie-item">
                                <div class="data-item-value">${cookie} - сайт собрал</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <div class="data-section">
                <div class="data-section-title">📈 Трекеры</div>
                <div class="data-item">
                    <span class="data-item-value">${(data.trackers || ['Не найдено']).join(", ")}</span>
                </div>
            </div>

           <div class="data-section">
             <div class="data-section-title">📜 Уведомления</div>
             <div class="data-item">
                 <span class="data-item-label">О рекомендациях и cookies:</span>
                 <span class="data-item-value">${data.hasRecommendationNotice ? 'Есть' : 'Нет'}</span>
            </div>
        </div>
            ${data.personalization ? `
                <div class="data-section">
                    <div class="data-section-title">🎯 Персонализация</div>
                    <div class="data-item">
                        <span class="data-item-label">Уровень:</span>
                        <span class="data-item-value">${data.personalization.personalizationLevel}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-item-label">Элементы:</span>
                        <span class="data-item-value">${data.personalization.recommendationElements.length}</span>
                    </div>
                </div>
            ` : ''}
            
            <!-- НОВЫЙ КОД НАЧИНАЕТСЯ ЗДЕСЬ -->
            ${data.privacyNotice ? `
                <div class="data-section">
                    <div class="data-section-title">📝 Соответствие 149-ФЗ</div>
                    <div class="data-item">
                        <span class="data-item-label">Уведомление о рекомендациях:</span>
                        <span class="data-item-value">${data.privacyNotice.hasRecommendationNotice ? 'Есть' : 'Нет'}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-item-label">Возможность отказа:</span>
                        <span class="data-item-value">${data.privacyNotice.requirementsCompliance.hasOptOut ? 'Есть' : 'Нет'}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-item-label">Описание алгоритмов:</span>
                        <span class="data-item-value">${data.privacyNotice.requirementsCompliance.hasDescription ? 'Есть' : 'Нет'}</span>
                    </div>
                    <div class="data-item">
                        <span class="data-item-label">Оценка соответствия:</span>
                        <span class="data-item-value">${data.privacyNotice.requirementsCompliance.score}%</span>
                    </div>
                </div>
            ` : ''}
            <!-- НОВЫЙ КОД ЗАКАНЧИВАЕТСЯ ЗДЕСЬ -->
        </div>
    `;

            document.body.appendChild(notification);

            const closeBtn = notification.querySelector('.data-tracker-close');
            closeBtn.addEventListener('click', () => {
                notification.style.opacity = '0';
                notification.style.transform = 'translateX(100%)';
                notification.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
                setTimeout(() => notification.remove(), 300);
            });
        }

        const cookiesResponse = await sendMessage({
            type: "getCookies",
            domain: window.location.hostname
        });
        if (cookiesResponse?.cookies && cookiesResponse.cookies.length > 0) {
            collectedData.cookies = { value: cookiesResponse.cookies.map(c => `${c.name}=${c.value}`), collected: true };
        }

        chrome.storage.local.get("collectedInfo", (storageData) => {
            if (chrome.runtime.lastError) {
                console.error("Ошибка получения collectedInfo:", chrome.runtime.lastError);
                return;
            }
            const updatedData = storageData.collectedInfo || {};
            updatedData.ip = collectedData.ip;
            updatedData.geolocation = collectedData.geolocation;
            updatedData.userAgent = updatedData.userAgent || collectedData.userAgent;
            updatedData.cookies = collectedData.cookies;
            updatedData.trackers = collectedData.trackers;
            updatedData.hasRecommendationNotice = collectedData.hasRecommendationNotice;
            updatedData.lastUpdated = new Date().toISOString();

            chrome.storage.local.set({ collectedInfo: updatedData }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Ошибка сохранения collectedInfo:", chrome.runtime.lastError);
                } else {
                    createNotification(updatedData);
                }
            });
        });
    });
})();
