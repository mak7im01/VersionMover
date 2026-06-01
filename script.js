// Скрипт для перемещения номера версии с поддержкой настроек
(function() {
    'use strict';

    // --- Хелперы для нового PulseSync API ---

    function unwrapSetting(entry, fallback) {
        if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
            if (typeof entry.value !== 'undefined') return entry.value;
            if (typeof entry.default !== 'undefined') return entry.default;
        }
        return typeof entry !== 'undefined' ? entry : fallback;
    }

    function readBooleanSetting(settings, key, fallback) {
        return Boolean(unwrapSetting(settings[key], fallback));
    }

    function readNumberSetting(settings, key, fallback) {
        return Number(unwrapSetting(settings[key], fallback));
    }

    function readStringSetting(settings, key, fallback) {
        return String(unwrapSetting(settings[key], fallback));
    }

    // Получение store настроек через новое API window.pulsesyncApi
    function getAddonSettings(addonName) {
        return (
            window.pulsesyncApi?.getSettings(addonName) ?? {
                getCurrent: () => ({}),
                onChange: () => () => {},
            }
        );
    }

    // --- Применение настроек ---

    function applySettings(settings) {
        let styleElement = document.getElementById('version-mover-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'version-mover-style';
            document.head.appendChild(styleElement);
        }

        styleElement.textContent = '';

        const hideVersion = readBooleanSetting(settings, 'hideVersion', false);
        if (hideVersion) {
            styleElement.textContent = `
                .MainPage_beta__y32vb,
                .MainPage_beta_withReleaseNotes__WOjUk {
                    display: none !important;
                }
            `;
            return;
        }

        {
            const rightPos = 15;
            const opacity  = readNumberSetting(settings, 'opacity', 100) / 100;

            // Вертикальное положение: 1 = вверху, 2 = по центру, 3 = внизу
            const vPos = readNumberSetting(settings, 'verticalPosition', 1);
            let verticalCSS;
            if (vPos === 2) {
                verticalCSS = 'top: 50% !important; transform: translateY(-50%) !important;';
            } else if (vPos === 3) {
                verticalCSS = 'top: auto !important; bottom: 16px !important;';
            } else {
                verticalCSS = 'top: 100px !important;';
            }

            let cssRules = `
                .MainPage_beta__y32vb,
                .MainPage_beta_withReleaseNotes__WOjUk {
                    position: fixed !important;
                    left: auto !important;
                    right: ${rightPos}px !important;
                    ${verticalCSS}
                    opacity: ${opacity} !important;
            `;

            const customBackground = readBooleanSetting(settings, 'customBackground', false);
            if (customBackground) {
                const bgColor = readStringSetting(settings, 'backgroundColor', '#1a1a1a');
                cssRules += `background-color: ${bgColor} !important;`;
            }

            cssRules += `}`;
            styleElement.textContent = cssRules;
        }
    }

    // --- Инициализация ---

    function init() {
        const settingsStore = getAddonSettings('VersionMover');
        let settings = settingsStore.getCurrent();

        // Применяем сразу
        applySettings(settings);

        // Подписываемся на изменения — больше не нужен setInterval
        settingsStore.onChange(function(nextSettings) {
            settings = nextSettings;
            applySettings(settings);
        });
    }

    // Запускаем после загрузки DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
