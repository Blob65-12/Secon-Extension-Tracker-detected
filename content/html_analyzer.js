/// html_analyzer.js
(function (window) {
    class HTMLAnalyzer {
        constructor() {
            this.recommendationKeywords = [
                // Русский
                "рекомендуемые", "персонализированные", "специально для вас",
                "исходя из ваших интересов", "рекомендации", "вам может понравиться",
                "похожие товары", "персональная подборка", "на основе вашей истории",
                "вы интересовались", "вы смотрели", "на основе ваших предпочтений",
                "с учетом ваших интересов", "персонализированный контент",
                "ваша лента", "рекомендованные для вас", "подобрано для вас",
                // Английский (для международных сайтов)
                "recommended for you", "personalized", "based on your preferences",
                "you may also like", "related items", "personally selected",
                "tailored for you", "because you viewed", "recommendations"
            ];

            // Расширенный список селекторов контейнеров
            this.recommendationContainers = [
                ".recommendations", ".suggestions", ".personalized-content",
                ".recommended-products", ".for-you", ".similar-items",
                "[data-recommendation]", "[data-personalized]", ".recommended",
                ".personal-offers", ".you-may-like", ".recommendation-widget",
                ".based-on-history", ".recommended-for-you", ".personal-feed",
                ".also-viewed", ".related-products", ".personalized-items"
            ];

            // Данные о персонализации
            this.personalizationData = {
                recommendationElements: [],
                hasPersonalizedContent: false,
                personalizationScore: 0,
                containersFound: [],
                recommendationServices: [],
                personalizationLevel: "Неизвестно",
                userSpecificMentions: []
            };
        }

        async analyzeHTML(document) {
            // Сбрасываем данные
            this.personalizationData = {
                recommendationElements: [],
                hasPersonalizedContent: false,
                personalizationScore: 0,
                containersFound: [],
                recommendationServices: [],
                personalizationLevel: "Неизвестно",
                userSpecificMentions: []
            };

            // Шаг 1: Поиск по контейнерам рекомендаций
            this.searchRecommendationContainers(document);

            // Шаг 2: Поиск по ключевым словам в тексте
            this.searchKeywordsInContent(document);

            // Шаг 3: Проверка наличия скриптов рекомендательных систем
            this.checkRecommendationScripts(document);

            // Шаг 4: Анализ прямых упоминаний о пользователе
            this.findUserSpecificContent(document);

            // Шаг 5: Подсчет итоговой оценки персонализации
            this.calculatePersonalizationScore();

            return this.personalizationData;
        }

        searchRecommendationContainers(document) {
            for (const selector of this.recommendationContainers) {
                const elements = document.querySelectorAll(selector);
                if (elements.length > 0) {
                    this.personalizationData.containersFound.push({
                        selector: selector,
                        count: elements.length
                    });

                    elements.forEach(element => {
                        this.personalizationData.recommendationElements.push({
                            type: 'container',
                            text: element.innerText.substring(0, 100),
                            selector: this.getFullSelector(element)
                        });
                    });

                    if (elements.length > 0) {
                        this.personalizationData.hasPersonalizedContent = true;
                    }
                }
            }
        }

        searchKeywordsInContent(document) {
            const textNodes = this.getAllTextNodes(document.body);

            for (const node of textNodes) {
                const text = node.textContent.toLowerCase();
                for (const keyword of this.recommendationKeywords) {
                    if (text.includes(keyword.toLowerCase())) {
                        const parentElement = node.parentElement;
                        this.personalizationData.recommendationElements.push({
                            type: 'keyword',
                            keyword: keyword,
                            text: text.substring(0, 100),
                            selector: this.getFullSelector(parentElement)
                        });
                        this.personalizationData.hasPersonalizedContent = true;
                        break;
                    }
                }
            }
        }

        checkRecommendationScripts(document) {
            const recommendationServices = [
                { name: "Google Recommendations", pattern: /googleadservices|doubleclick|recommendations/i },
                { name: "Яндекс Рекомендации", pattern: /yandex.*recommendations|zen\.yandex/i },
                { name: "RetailRocket", pattern: /retailrocket/i },
                { name: "Criteo", pattern: /criteo/i },
                { name: "Taboola", pattern: /taboola/i },
                { name: "Outbrain", pattern: /outbrain/i }
            ];

            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
                const src = script.src || '';
                const content = script.innerText || '';

                for (const service of recommendationServices) {
                    if (service.pattern.test(src) || service.pattern.test(content)) {
                        this.personalizationData.recommendationElements.push({
                            type: 'script',
                            service: service.name,
                            src: src
                        });
                        this.personalizationData.hasPersonalizedContent = true;
                    }
                }
            }
        }

        // Поиск прямых упоминаний о пользователе
        findUserSpecificContent(document) {
            const userPatterns = [
                /Привет,\s+\w+/i,
                /Здравствуйте,\s+\w+/i,
                /Добро пожаловать,\s+\w+/i,
                /Добрый день,\s+\w+/i,
                /Добрый вечер,\s+\w+/i,
                /Hello,\s+\w+/i,
                /Welcome back,\s+\w+/i
            ];

            const textNodes = this.getAllTextNodes(document.body);

            for (const node of textNodes) {
                const text = node.textContent;

                for (const pattern of userPatterns) {
                    if (pattern.test(text)) {
                        const parentElement = node.parentElement;
                        this.personalizationData.userSpecificMentions.push({
                            text: text.trim(),
                            selector: this.getFullSelector(parentElement)
                        });
                        break;
                    }
                }
            }
        }

        // Улучшенный расчет оценки персонализации
        calculatePersonalizationScore() {
            const weights = {
                container: 3,
                keyword: 1,
                script: 5,
                userMention: 7
            };

            let score = 0;

            // Элементы рекомендаций
            for (const element of this.personalizationData.recommendationElements) {
                score += weights[element.type] || 1;
            }

            // Прямые упоминания пользователя
            score += this.personalizationData.userSpecificMentions.length * weights.userMention;

            this.personalizationData.personalizationScore = score;

            // Определяем уровень персонализации
            if (score === 0) {
                this.personalizationData.personalizationLevel = "Отсутствует";
            } else if (score < 5) {
                this.personalizationData.personalizationLevel = "Низкий";
            } else if (score < 15) {
                this.personalizationData.personalizationLevel = "Средний";
            } else {
                this.personalizationData.personalizationLevel = "Высокий";
            }
        }

        getAllTextNodes(node) {
            const textNodes = [];
            const walker = document.createTreeWalker(
                node,
                NodeFilter.SHOW_TEXT,
                null,
                false
            );

            let currentNode;
            while (currentNode = walker.nextNode()) {
                if (currentNode.nodeValue.trim() !== '') {
                    textNodes.push(currentNode);
                }
            }

            return textNodes;
        }

        getFullSelector(element) {
            if (!element || element.nodeType !== 1) {
                return '';
            }

            const parts = [];
            let currentElement = element;

            while (currentElement && currentElement !== document.body) {
                let selector = currentElement.nodeName.toLowerCase();

                if (currentElement.id) {
                    selector += `#${currentElement.id}`;
                    parts.unshift(selector);
                    break;
                } else {
                    if (currentElement.className) {
                        const classes = currentElement.className.split(/\s+/)
                            .filter(c => c)
                            .map(c => `.${c}`)
                            .join('');
                        if (classes) {
                            selector += classes;
                        }
                    }

                    // Добавляем индекс среди одноименных элементов, если есть родитель
                    if (currentElement.parentNode) {
                        const siblings = Array.from(currentElement.parentNode.children || []);
                        if (siblings.length > 1) {
                            const index = siblings.indexOf(currentElement) + 1;
                            if (index > 0) {
                                selector += `:nth-child(${index})`;
                            }
                        }
                    }

                    parts.unshift(selector);
                    currentElement = currentElement.parentElement;
                }
            }

            return parts.join(' > ');
        }
    }

    // Делаем класс доступным глобально
    window.HTMLAnalyzer = HTMLAnalyzer;
})(window);

