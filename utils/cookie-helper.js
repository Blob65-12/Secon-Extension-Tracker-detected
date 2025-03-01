// utils/cookie-helper.js
export class CookieHelper {
    /**
     * Декодирует значение cookie, удаляя кавычки и преобразуя URL-закодированные символы
     * @param {string} value - Закодированное значение cookie
     * @return {string} - Декодированное значение
     */
    static read(value) {
        if (value[0] === '"') {
            value = value.slice(1, -1);
        }
        return value.replace(/(%[\dA-F]{2})+/gi, decodeURIComponent);
    }

    /**
     * Кодирует значение cookie для правильной передачи
     * @param {string} value - Исходное значение
     * @return {string} - Закодированное значение
     */
    static write(value) {
        return encodeURIComponent(value).replace(
            /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
            decodeURIComponent
        );
    }
}

export default CookieHelper;
