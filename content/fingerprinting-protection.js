// fingerprinting-protection.js
(function () {
    // Проверяем, активирована ли защита от fingerprinting
    chrome.storage.local.get('blockedTypes', function (data) {
        const blockedTypes = data.blockedTypes || {};
        if (blockedTypes.fingerprinting) {
            applyFingerprintingProtection();
        }
    });

    function applyFingerprintingProtection() {
        console.log("Активирована защита от fingerprinting");

        // Canvas fingerprinting
        if (HTMLCanvasElement.prototype.toDataURL) {
            const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
            HTMLCanvasElement.prototype.toDataURL = function () {
                addNoise(this);
                return originalToDataURL.apply(this, arguments);
            };
        }

        if (HTMLCanvasElement.prototype.toBlob) {
            const originalToBlob = HTMLCanvasElement.prototype.toBlob;
            HTMLCanvasElement.prototype.toBlob = function () {
                addNoise(this);
                return originalToBlob.apply(this, arguments);
            };
        }

        // WebGL fingerprinting
        if (WebGLRenderingContext && WebGLRenderingContext.prototype.getParameter) {
            const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
            WebGLRenderingContext.prototype.getParameter = function (parameter) {
                // Подменяем некоторые параметры, чаще всего используемые для отпечатка
                if (parameter === 37445) { // UNMASKED_VENDOR_WEBGL
                    return "Generic Vendor";
                }
                if (parameter === 37446) { // UNMASKED_RENDERER_WEBGL
                    return "Generic Renderer";
                }
                return originalGetParameter.apply(this, arguments);
            };
        }

        // Audio fingerprinting
        if (window.AudioContext || window.webkitAudioContext) {
            const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
            if (AudioContextConstructor.prototype.createOscillator) {
                const originalCreateOscillator = AudioContextConstructor.prototype.createOscillator;
                AudioContextConstructor.prototype.createOscillator = function () {
                    const oscillator = originalCreateOscillator.apply(this, arguments);
                    const originalGetFrequency = oscillator.frequency.value;
                    Object.defineProperty(oscillator.frequency, 'value', {
                        get: function () {
                            return originalGetFrequency + Math.random() * 0.0001;
                        }
                    });
                    return oscillator;
                };
            }
        }

        // Font fingerprinting
        if (document.fonts && document.fonts.check) {
            const originalCheck = document.fonts.check;
            document.fonts.check = function (font) {
                // Случайным образом возвращаем false для некоторых редких шрифтов
                if (Math.random() < 0.1) {
                    return false;
                }
                return originalCheck.apply(this, arguments);
            };
        }
    }

    function addNoise(canvas) {
        try {
            // Добавляем минимальный шум к canvas
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Берем данные изображения
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Добавляем минимальные изменения (шум)
            for (let i = 0; i < data.length; i += 4) {
                // Вносим изменения только в каждый 1000-й пиксель для производительности
                if (i % 1000 === 0) {
                    data[i + 3] = data[i + 3] > 0 ? data[i + 3] - 1 : 0; // Изменяем альфа-канал
                }
            }

            // Возвращаем измененные данные
            ctx.putImageData(imageData, 0, 0);
        } catch (e) {
            console.error("Ошибка при добавлении шума в canvas:", e);
        }
    }
})();