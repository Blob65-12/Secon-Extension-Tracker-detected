// privacy-notice-analyzer.js
(function (window) {
    class PrivacyNoticeAnalyzer {
        constructor() {
            // Ключевые слова для обнаружения уведомлений о сборе данных
            this.privacyKeywords = {
                // Общие ключевые слова
                general: [
                    "cookie", "куки", "файлы cookie", "cookies",
                    "персональные данные", "personal data", "данные",
                    "конфиденциальность", "privacy", "privacy policy",
                    "политика конфиденциальности", "согласие", "consent",
                    "использование данных", "обработка данных", "data processing"
                ],

                // Ключевые слова специфичные для рекомендаций (149-ФЗ)
                recommendation: [
                    "рекомендательные технологии", "рекомендательные системы",
                    "рекомендации", "персонализация", "персональные рекомендации",
                    "персонализированный контент", "подбор контента",
                    "контент на основе ваших предпочтений", "индивидуальные предложения",
                    "алгоритмы рекомендаций", "recommendation systems",
                    "recommendation algorithms", "personalized content",
                    "контент, адаптированный под ваши интересы"
                ],

                // Ключевые слова для соответствия закону
                compliance: [
                    "ФЗ", "федеральный закон", "закон №149", "149-ФЗ", "статья 10.2",
                    "ФЗ от 27.07.2006", "закон о персональных данных",
                    "настройки рекомендательных алгоритмов", "отключить рекомендации",
                    "отказ от персонализации", "opt-out", "отключить персонализацию"
                ]
            };

            // Селекторы для элементов уведомлений
            this.noticeSelectors = [
                ".cookie-notice", ".cookie-banner", ".gdpr-notice",
                ".privacy-notice", ".consent-banner", ".cookie-consent",
                ".privacy-banner", ".cookie-policy", "#cookie-notice",
                "[data-purpose='cookie-policy']", ".cookie-warning",
                ".cookies-bar", ".privacy-alert", ".privacy-popup",
                ".data-notice", ".data-policy", "[data-testid='cookie-policy']"
            ];
        }

        // Анализ страницы на наличие уведомлений
        async analyzePageNotices(document) {
            const result = {
                hasAnyNotice: false,
                hasRecommendationNotice: false,
                notices: [],
                requirementsCompliance: {
                    hasOptOut: false, // Есть ли возможность отказаться
                    hasDescription: false, // Есть ли описание принципов работы
                    hasCompleteInfo: false, // Полное соответствие 149-ФЗ
                    score: 0 // Оценка соответствия от 0 до 100
                }
            };

            // Шаг 1: Поиск по CSS селекторам
            this.findNoticesBySelectors(document, result);

            // Шаг 2: Поиск по ключевым словам в тексте
            this.findNoticesByKeywords(document, result);

            // Шаг 3: Проверка наличия элементов управления уведомлениями
            this.findNoticeControls(document, result);

            // Шаг 4: Анализ соответствия требованиям закона
            this.analyzeComplianceRequirements(result);

            return result;
        }

        // Поиск уведомлений по CSS селекторам
        findNoticesBySelectors(document, result) {
            for (const selector of this.noticeSelectors) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    result.hasAnyNotice = true;

                    for (const element of elements) {
                        const text = element.innerText.toLowerCase();
                        const hasRecommendation = this.privacyKeywords.recommendation.some(keyword =>
                            text.includes(keyword.toLowerCase())
                        );

                        if (hasRecommendation) {
                            result.hasRecommendationNotice = true;
                        }

                        result.notices.push({
                            type: 'selector',
                            element: selector,
                            text: element.innerText.substring(0, 200) + (element.innerText.length > 200 ? '...' : ''),
                            hasRecommendation: hasRecommendation,
                            buttons: Array.from(element.querySelectorAll('button, .button, [role="button"], a.btn'))
                                .map(btn => ({ text: btn.innerText, className: btn.className }))
                        });
                    }
                }
            }
        }

        // Поиск уведомлений по ключевым словам
        findNoticesByKeywords(document, result) {
            const paragraphs = document.querySelectorAll('p, div, span');

            for (const para of paragraphs) {
                const text = para.innerText.toLowerCase();

                // Проверяем наличие общих ключевых слов
                const hasGeneral = this.privacyKeywords.general.some(keyword =>
                    text.includes(keyword.toLowerCase())
                );

                if (hasGeneral) {
                    // Если нашли общие ключевые слова, проверяем на наличие слов о рекомендациях
                    const hasRecommendation = this.privacyKeywords.recommendation.some(keyword =>
                        text.includes(keyword.toLowerCase())
                    );

                    // Проверяем наличие упоминаний закона
                    const hasCompliance = this.privacyKeywords.compliance.some(keyword =>
                        text.includes(keyword.toLowerCase())
                    );

                    // Добавляем только если есть упоминание о рекомендациях или законе
                    if (hasRecommendation || hasCompliance) {
                        result.hasAnyNotice = true;

                        if (hasRecommendation) {
                            result.hasRecommendationNotice = true;
                        }

                        // Избегаем дублирования текста
                        const existing = result.notices.find(notice => notice.text && notice.text.includes(text));
                        if (!existing) {
                            result.notices.push({
                                type: 'keyword',
                                text: para.innerText.substring(0, 200) + (para.innerText.length > 200 ? '...' : ''),
                                hasRecommendation: hasRecommendation,
                                hasCompliance: hasCompliance,
                                path: this.getElementPath(para)
                            });
                        }
                    }
                }
            }
        }

        // Поиск элементов управления уведомлениями
        findNoticeControls(document, result) {
            const optOutKeywords = [
                "отказаться", "отключить", "выключить", "reject", "decline",
                "не согласен", "не принимаю", "disable", "opt-out", "no thanks",
                "настроить", "customize", "settings", "настройки"
            ];

            const buttons = document.querySelectorAll('button, .button, [role="button"], a.btn, input[type="submit"]');

            for (const button of buttons) {
                const text = button.innerText.toLowerCase();

                // Проверяем текст кнопки на наличие ключевых слов отказа
                const isOptOutButton = optOutKeywords.some(keyword =>
                    text.includes(keyword.toLowerCase())
                );

                if (isOptOutButton) {
                    // Проверяем, не является ли кнопка частью уже найденного уведомления
                    let isPartOfNotice = false;
                    for (const notice of result.notices) {
                        if (notice.buttons?.some(btn => btn.text === button.innerText)) {
                            isPartOfNotice = true;
                            break;
                        }
                    }

                    if (!isPartOfNotice) {
                        result.requirementsCompliance.hasOptOut = true;

                        result.notices.push({
                            type: 'control',
                            text: `Кнопка управления: ${button.innerText}`,
                            element: this.getElementPath(button),
                            isOptOut: true
                        });
                    }
                }
            }
        }

        // Анализ соответствия требованиям закона
        analyzeComplianceRequirements(result) {
            // Проверка требований 149-ФЗ

            // 1. Есть ли явное уведомление о рекомендательных алгоритмах
            const hasExplicitNotice = result.hasRecommendationNotice;

            // 2. Есть ли описание принципов работы рекомендательных алгоритмов
            const hasDescription = result.notices.some(notice =>
                notice.text && this.privacyKeywords.recommendation.some(keyword =>
                    notice.text.toLowerCase().includes(keyword.toLowerCase())
                ) &&
                notice.text.length > 100 // Предполагаем, что описание принципов работы требует хотя бы 100 символов
            );

            // 3. Есть ли возможность отказа от рекомендаций
            const hasOptOut = result.requirementsCompliance.hasOptOut;

            // Обновляем результат
            result.requirementsCompliance.hasDescription = hasDescription;
            result.requirementsCompliance.hasCompleteInfo = hasExplicitNotice && hasDescription && hasOptOut;

            // Рассчитываем оценку соответствия
            let score = 0;
            if (hasExplicitNotice) score += 40;
            if (hasDescription) score += 30;
            if (hasOptOut) score += 30;

            result.requirementsCompliance.score = score;
        }

        // Получение пути к элементу
        getElementPath(element) {
            if (!element) return '';

            const path = [];
            let current = element;

            while (current && current.nodeType === Node.ELEMENT_NODE) {
                let selector = current.nodeName.toLowerCase();

                if (current.id) {
                    selector += '#' + current.id;
                    path.unshift(selector);
                    break;
                } else {
                    if (current.className) {
                        const classes = current.className.split(/\s+/).join('.');
                        if (classes) {
                            selector += '.' + classes;
                        }
                    }

                    // Добавляем индекс среди одноименных элементов, если есть родитель
                    if (current.parentNode) {
                        const siblings = Array.from(current.parentNode.children).filter(
                            child => child.nodeName === current.nodeName
                        );

                        if (siblings.length > 1) {
                            const index = siblings.indexOf(current) + 1;
                            if (index > 0) {
                                selector += `:nth-of-type(${index})`;
                            }
                        }
                    }

                    path.unshift(selector);
                    current = current.parentNode;
                }
            }

            return path.join(' > ');
        }
    }

    // Делаем класс доступным глобально
    window.PrivacyNoticeAnalyzer = PrivacyNoticeAnalyzer;
})(window);