// Скрипт для перемещения номера версии с поддержкой настроек
(function() {
    'use strict';
    
    // Получение настроек из PulseSync
    async function getSettings(name) {
        try {
            const response = await fetch(`http://localhost:2007/get_handle?name=${name}`);
            if (!response.ok) throw new Error(`Ошибка сети: ${response.status}`);
      
            const { data } = await response.json();
            if (!data?.sections) {
                console.warn("Структура данных не соответствует ожидаемой");
                return null;
            }

            return transformJSON(data);
        } catch (error) {
            console.error(error);
            return null;
        }
    }

    // Трансформирование полученных настроек для удобного использования
    function transformJSON(data) {
        const result = {};

        try {
            data.sections.forEach(section => {
                section.items.forEach(item => {
                    if (item.type === "text" && item.buttons) {
                        result[item.id] = {};
                        item.buttons.forEach(button => {
                            result[item.id][button.id] = {
                                value: button.text,
                                default: button.defaultParameter
                            };
                        });
                    } else {
                        result[item.id] = {
                            value: item.bool || item.input || item.selected || item.value || item.filePath,
                            default: item.defaultParameter
                        };
                    }
                });
            });
        } finally {
            return result;
        }
    }
    
    // Применение настроек
    function applySettings(settings) {
        // Создание контейнера для динамического CSS
        let styleElement = document.getElementById('version-mover-style');
        if (!styleElement) {
            styleElement = document.createElement('style');
            styleElement.id = 'version-mover-style';
            document.head.appendChild(styleElement);
        }

        // Очищаем для перезаписи
        styleElement.textContent = '';

        // Если включено скрытие версии
        if (settings.hideVersion.value === true) {
            styleElement.textContent = `
                .MainPage_beta__y32vb,
                .MainPage_beta_withReleaseNotes__WOjUk {
                    display: none !important;
                }
            `;
            return;
        }

        // Применяем настройки только если перемещение включено
        if (settings.enableMove.value === true) {
            const rightPos = settings.horizontalPosition.value;
            const topPos = settings.verticalPosition.value;
            const opacity = settings.opacity.value / 100;
            
            let cssRules = `
                .MainPage_beta__y32vb,
                .MainPage_beta_withReleaseNotes__WOjUk {
                    position: fixed !important;
                    left: auto !important;
                    right: ${rightPos}px !important;
                    top: ${topPos}px !important;
                    opacity: ${opacity} !important;
            `;

            // Добавляем пользовательский фон если включено
            if (settings.customBackground.value === true) {
                cssRules += `
                    background-color: ${settings.backgroundColor.value} !important;
                `;
            }

            cssRules += `}`;
            styleElement.textContent = cssRules;
        }
    }
    
    // Функция для перемещения кнопки версии (резервная, если настройки не загружены)
    function moveVersionButton() {
        const versionButton = document.querySelector('.MainPage_beta__y32vb, .MainPage_beta_withReleaseNotes__WOjUk');
        
        if (versionButton && !versionButton.dataset.moved) {
            versionButton.dataset.moved = 'true';
            console.log('Номер версии обнаружен');
        }
    }
    
    // Запускаем при загрузке страницы
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', moveVersionButton);
    } else {
        moveVersionButton();
    }
    
    // Наблюдаем за изменениями DOM
    const observer = new MutationObserver(function(mutations) {
        moveVersionButton();
    });
    
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
    
    // Обновляем настройки каждые 2 секунды
    setInterval(async () => {
        const settings = await getSettings("VersionMover");
        if (!settings) return;

        applySettings(settings);
    }, 2000);
    
    // Первоначальная загрузка настроек
    (async () => {
        const settings = await getSettings("VersionMover");
        if (settings) {
            applySettings(settings);
        }
    })();
})();
