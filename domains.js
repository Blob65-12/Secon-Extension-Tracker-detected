// domains.js
document.addEventListener('DOMContentLoaded', function () {
    // Инициализация переменных
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    const blocklistDomainInput = document.getElementById('blocklistDomainInput');
    const whitelistDomainInput = document.getElementById('whitelistDomainInput');
    const addToBlocklistButton = document.getElementById('addToBlocklist');
    const addToWhitelistButton = document.getElementById('addToWhitelist');
    const blocklistDomains = document.getElementById('blocklistDomains');
    const whitelistDomains = document.getElementById('whitelistDomains');
    const backButton = document.getElementById('backButton');

    // Переключение вкладок
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');

            // Активируем выбранную вкладку
            tabs.forEach(item => item.classList.remove('active'));
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

    // Обработчик кнопки "Назад"
    backButton.addEventListener('click', () => {
        window.history.back();
    });

    // Получаем и отображаем текущий домен при загрузке страницы
    function updateCurrentDomainDisplay() {
        // Получаем domainToBlock из URL параметров
        const urlParams = new URLSearchParams(window.location.search);
        const domainParam = urlParams.get('domain');

        if (domainParam) {
            // Если домен передан в параметрах, отображаем его
            const currentDomainElement = document.getElementById('currentDomainBlock');
            if (currentDomainElement) {
                currentDomainElement.textContent = domainParam;
            }
            document.getElementById('blocklistDomainInput').value = domainParam;
        } else {
            // Иначе пытаемся получить активную вкладку
            chrome.tabs.query({ active: true, lastFocusedWindow: true }, (tabs) => {
                if (tabs && tabs.length > 0) {
                    try {
                        const url = new URL(tabs[0].url);
                        const domain = url.hostname;

                        const currentDomainElement = document.getElementById('currentDomainBlock');
                        if (currentDomainElement) {
                            currentDomainElement.textContent = domain;
                        }

                        document.getElementById('blocklistDomainInput').value = domain;
                    } catch (error) {
                        console.error("Ошибка при получении домена:", error);
                    }
                }
            });
        }
    }

    // Загрузка списка заблокированных доменов
    function loadBlockedDomains() {
        chrome.runtime.sendMessage({ type: "getBlockedDomains" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Ошибка получения списка заблокированных доменов:", chrome.runtime.lastError);
                showEmptyBlocklist();
                return;
            }

            const domains = response.domains || [];
            if (domains.length === 0) {
                showEmptyBlocklist();
            } else {
                renderBlockedDomains(domains);
            }
        });
    }

    // Загрузка белого списка
    function loadWhitelistedDomains() {
        chrome.runtime.sendMessage({ type: "getWhitelistedDomains" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Ошибка получения белого списка:", chrome.runtime.lastError);
                showEmptyWhitelist();
                return;
            }

            const domains = response.domains || [];
            if (domains.length === 0) {
                showEmptyWhitelist();
            } else {
                renderWhitelistedDomains(domains);
            }
        });
    }

    // Отображение пустого списка заблокированных доменов
    function showEmptyBlocklist() {
        blocklistDomains.innerHTML = '<li class="empty-list">Список заблокированных доменов пуст</li>';
    }

    // Отображение пустого белого списка
    function showEmptyWhitelist() {
        whitelistDomains.innerHTML = '<li class="empty-list">Белый список пуст</li>';
    }

    // Отображение списка заблокированных доменов
    function renderBlockedDomains(domains) {
        blocklistDomains.innerHTML = domains.map(domain => `
            <li class="domain-item">
                <div class="domain-name">
                    <div class="domain-icon">${domain.charAt(0).toUpperCase()}</div>
                    ${domain}
                </div>
                <div class="domain-actions">
                    <button class="remove-domain" data-domain="${domain}">Удалить</button>
                </div>
            </li>
        `).join('');

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('#blocklistDomains .remove-domain').forEach(button => {
            button.addEventListener('click', function () {
                const domain = this.getAttribute('data-domain');
                removeFromBlocklist(domain);
            });
        });
    }

    // Отображение белого списка
    function renderWhitelistedDomains(domains) {
        whitelistDomains.innerHTML = domains.map(domain => `
            <li class="domain-item">
                <div class="domain-name">
                    <div class="domain-icon">${domain.charAt(0).toUpperCase()}</div>
                    ${domain}
                </div>
                <div class="domain-actions">
                    <button class="remove-domain" data-domain="${domain}">Удалить</button>
                </div>
            </li>
        `).join('');

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('#whitelistDomains .remove-domain').forEach(button => {
            button.addEventListener('click', function () {
                const domain = this.getAttribute('data-domain');
                removeFromWhitelist(domain);
            });
        });
    }

    // Добавление домена в список блокировки
    function addToBlocklist(domain) {
        if (!domain) return;

        // Проверка корректности домена
        if (!isValidDomain(domain)) {
            alert("Пожалуйста, введите корректный домен (например, example.com)");
            return;
        }

        chrome.runtime.sendMessage({ type: "blockDomain", domain }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Ошибка добавления домена в блок-лист:", chrome.runtime.lastError);
                alert(`Ошибка: ${chrome.runtime.lastError.message || 'Не удалось добавить домен'}`);
                return;
            }

            if (!response) {
                console.error("Нет ответа при блокировке домена");
                alert("Ошибка: Не удалось добавить домен");
                return;
            }

            if (response.success) {
                blocklistDomainInput.value = '';
                loadBlockedDomains();
                alert(`Домен ${domain} успешно заблокирован. Изменения вступят в силу при следующем посещении сайта.`);
            } else {
                alert(`Ошибка: ${response.message || response.error || 'Не удалось добавить домен'}`);
            }
        });
    }

    // Добавление домена в белый список
    function addToWhitelist(domain) {
        if (!domain) return;

        // Проверка корректности домена
        if (!isValidDomain(domain)) {
            alert("Пожалуйста, введите корректный домен (например, example.com)");
            return;
        }

        chrome.runtime.sendMessage({ type: "addToWhitelist", domain }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Ошибка добавления домена в белый список:", chrome.runtime.lastError);
                alert(`Ошибка: ${chrome.runtime.lastError.message || 'Не удалось добавить домен'}`);
                return;
            }

            if (!response) {
                console.error("Нет ответа при добавлении в белый список");
                alert("Ошибка: Не удалось добавить домен");
                return;
            }

            if (response.success) {
                whitelistDomainInput.value = '';
                loadWhitelistedDomains();
                alert(`Домен ${domain} успешно добавлен в белый список.`);
            } else {
                alert(`Ошибка: ${response.message || response.error || 'Не удалось добавить домен'}`);
            }
        });
    }

    // Удаление домена из списка блокировки
    function removeFromBlocklist(domain) {
        chrome.runtime.sendMessage({ type: "allowDomain", domain }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Ошибка удаления домена из блок-листа:", chrome.runtime.lastError);
                alert(`Ошибка: ${chrome.runtime.lastError.message || 'Не удалось удалить домен'}`);
                return;
            }

            if (response.success) {
                loadBlockedDomains();
                alert(`Домен ${domain} успешно разблокирован.`);
            } else {
                alert(`Ошибка: ${response.message || response.error || 'Не удалось удалить домен'}`);
            }
        });
    }

    // Удаление домена из белого списка
    function removeFromWhitelist(domain) {
        chrome.runtime.sendMessage({ type: "removeFromWhitelist", domain }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Ошибка удаления домена из белого списка:", chrome.runtime.lastError);
                alert(`Ошибка: ${chrome.runtime.lastError.message || 'Не удалось удалить домен'}`);
                return;
            }

            if (response.success) {
                loadWhitelistedDomains();
                alert(`Домен ${domain} успешно удален из белого списка.`);
            } else {
                alert(`Ошибка: ${response.message || response.error || 'Не удалось удалить домен'}`);
            }
        });
    }

    // Функция для проверки корректности домена
    function isValidDomain(domain) {
        // Простая проверка на типичные ошибки
        return domain.length > 3 &&
            domain.includes('.') &&
            !domain.includes('http://') &&
            !domain.includes('https://') &&
            !domain.includes('/*');
    }

    // Обработчики кнопок добавления доменов
    addToBlocklistButton.addEventListener('click', () => {
        const domain = blocklistDomainInput.value.trim();
        if (domain) {
            addToBlocklist(domain);
        }
    });

    addToWhitelistButton.addEventListener('click', () => {
        const domain = whitelistDomainInput.value.trim();
        if (domain) {
            addToWhitelist(domain);
        }
    });

    // Обработчики ввода для полей доменов (добавление по Enter)
    blocklistDomainInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const domain = blocklistDomainInput.value.trim();
            if (domain) {
                addToBlocklist(domain);
            }
        }
    });

    whitelistDomainInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const domain = whitelistDomainInput.value.trim();
            if (domain) {
                addToWhitelist(domain);
            }
        }
    });

    // Дополнительные кнопки для текущего домена
    const blockDomainButton = document.getElementById('blockDomain');
    const allowDomainButton = document.getElementById('allowDomain');

    if (blockDomainButton) {
        blockDomainButton.addEventListener('click', () => {
            const currentDomain = document.getElementById('currentDomainBlock').textContent;
            if (currentDomain && currentDomain !== 'example.com') {
                chrome.runtime.sendMessage({ type: "isDomainBlocked", domain: currentDomain }, (response) => {
                    if (response.isBlocked) {
                        alert(`Домен ${currentDomain} уже заблокирован, так как находится в списке заблокированных доменов.`);
                    } else if (response.isWhitelisted) {
                        alert(`Домен ${currentDomain} находится в белом списке. Уберите его из белого списка, чтобы заблокировать.`);
                    } else {
                        addToBlocklist(currentDomain);
                    }
                });
            } else {
                alert("Не удалось определить текущий домен");
            }
        });
    }

    if (allowDomainButton) {
        allowDomainButton.addEventListener('click', () => {
            const currentDomain = document.getElementById('currentDomainBlock').textContent;
            if (currentDomain && currentDomain !== 'example.com') {
                chrome.runtime.sendMessage({ type: "isDomainWhitelisted", domain: currentDomain }, (response) => {
                    if (response.isWhitelisted) {
                        alert(`Домен ${currentDomain} уже находится в белом списке и доступен для вас.`);
                    } else if (response.isBlocked) {
                        alert(`Домен ${currentDomain} находится в списке заблокированных. Уберите его из списка заблокированных, чтобы разрешить.`);
                    } else {
                        addToWhitelist(currentDomain);
                    }
                });
            } else {
                alert("Не удалось определить текущий домен");
            }
        });
    }

    // Проверка правил блокировки (для отладки)
    const checkRulesButton = document.getElementById('checkRules');
    if (checkRulesButton) {
        checkRulesButton.addEventListener('click', () => {
            chrome.runtime.sendMessage({ type: "logRules" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Ошибка получения правил:", chrome.runtime.lastError);
                    alert("Ошибка получения правил блокировки");
                    return;
                }

                console.log("Текущие правила блокировки:", response.rules);
                alert(`Текущие правила блокировки: ${JSON.stringify(response.rules)}`);
            });
        });
    }

    // Загружаем данные при открытии страницы
    updateCurrentDomainDisplay();
    loadBlockedDomains();
    loadWhitelistedDomains();
});