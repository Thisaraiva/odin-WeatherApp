import { formatDate, roundNumber } from './utils.js';

const DomFactory = {
    createElement({ tag, className = '', textContent = '', attributes = {}, children = [] }) {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (textContent) element.textContent = textContent;
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
        children.forEach(child => element.appendChild(child));
        return element;
    },
    createImage({ src, alt, className = '' }) {
        return this.createElement({
            tag: 'img',
            className,
            attributes: { src, alt }
        });
    },
    createText({ tag = 'p', className = '', textContent = '' }) {
        return this.createElement({ tag, className, textContent });
    }
};

const DOM_ELEMENTS = {
    cityDisplay: document.querySelector('.city-name'),
    currentTemp: document.querySelector('.current-temp'),
    currentDesc: document.querySelector('.current-description'),
    currentIcon: document.querySelector('.current-icon'),
    forecastContainer: document.querySelector('.forecast-container'),
    loadingSpinner: document.querySelector('.loading-spinner'),
    errorMessage: document.querySelector('.error-message'),
    mainContent: document.querySelector('.main-content'),
    unitToggle: document.querySelector('#unitToggle'),
    body: document.body,
    currentWeatherContainer: document.querySelector('.current-weather'),
    currentDetails: document.querySelector('.current-details')
};

// Icon name mapping to match API response to file names
const ICON_NAME_MAPPING = {
    'clear-day': 'clear-day',
    'clear-night': 'clear-night',
    'partly-cloudy-day': 'partly-cloudy-day',
    'partly-cloudy-night': 'partly-cloudy-night',
    cloudy: 'cloudy',
    rain: 'rain',
    snow: 'snow',
    sleet: 'sleet',
    wind: 'wind',
    fog: 'fog',
    hail: 'hail',
    thunder: 'thunder',
    'thunder-rain': 'thunder-rain',
    'showers-day': 'showers-day',
    'showers-night': 'showers-night',
    'rain-snow': 'rain-snow'
};

const DETAIL_ICONS = {
    humidity: 'humidity',
    windspeed: 'windspeed',
    uvindex: 'uvindex',
    sunrise: 'sunrise',
    sunset: 'sunset'
};

const iconCache = {};
const detailIconCache = {};

async function getIconUrl(iconName) {
    const fileName = ICON_NAME_MAPPING[iconName] || iconName;
    const defaultIconName = 'clear-day';

    if (iconCache[fileName]) {
        return iconCache[fileName];
    }

    try {
        const iconModule = await import(`./assets/icons/${fileName}.png`);
        const iconUrl = iconModule.default;
        iconCache[fileName] = iconUrl;
        return iconUrl;
    } catch (error) {
        console.warn(`Ícone '${fileName}.png' não encontrado. Usando ícone padrão.`, error);
        try {
            const defaultIconModule = await import(`./assets/icons/${defaultIconName}.png`);
            return defaultIconModule.default;
        } catch (defaultError) {
            console.error('Erro ao carregar ícone padrão:', defaultError);
            return '';
        }
    }
}

async function getDetailIconUrl(iconName) {
    const fileName = DETAIL_ICONS[iconName] || iconName;
    const defaultIconName = 'humidity';

    if (detailIconCache[fileName]) {
        return detailIconCache[fileName];
    }

    try {
        const iconModule = await import(`./assets/icons/${fileName}.png`);
        const iconUrl = iconModule.default;
        detailIconCache[fileName] = iconUrl;
        return iconUrl;
    } catch (error) {
        console.warn(`Ícone de detalhe '${fileName}.png' não encontrado. Usando ícone padrão.`, error);
        try {
            const defaultIconModule = await import(`./assets/icons/${defaultIconName}.png`);
            return defaultIconModule.default;
        } catch (defaultError) {
            console.error('Erro ao carregar ícone padrão de detalhe:', defaultError);
            return '';
        }
    }
}

async function displayWeatherData(data, unit) {
    hideLoading();
    hideError();

    if (!data) {
        showError('Não foi possível carregar os dados do clima.');
        return;
    }

    if (DOM_ELEMENTS.cityDisplay) DOM_ELEMENTS.cityDisplay.textContent = data.city;
    if (DOM_ELEMENTS.currentDesc) DOM_ELEMENTS.currentDesc.textContent = data.description || 
    (data.currentConditions && data.currentConditions.conditions);

    if (data.currentConditions) {
        if (DOM_ELEMENTS.currentTemp) DOM_ELEMENTS.currentTemp.textContent = `${roundNumber(data.currentConditions.temp)}°${unit.toUpperCase()}`;
        if (DOM_ELEMENTS.currentIcon) DOM_ELEMENTS.currentIcon.src = await getIconUrl(data.currentConditions.icon);

        if (DOM_ELEMENTS.currentDetails) {
            DOM_ELEMENTS.currentDetails.innerHTML = '';
            const details = [
                { icon: 'humidity', label: 'Umidade', value: `${data.currentConditions.humidity}%` },
                { icon: 'windspeed', label: 'Vento', value: `${data.currentConditions.windspeed} ${unit === 'c' ? 'km/h' : 'mph'}` },
                { icon: 'uvindex', label: 'Índice UV', value: data.currentConditions.uvindex },
                { icon: 'sunrise', label: 'Nascer do Sol', value: data.currentConditions.sunrise },
                { icon: 'sunset', label: 'Pôr do Sol', value: data.currentConditions.sunset }
            ];

            for (const detail of details) {
                const detailItem = DomFactory.createElement({
                    tag: 'div',
                    className: 'detail-item',
                    children: [
                        DomFactory.createImage({
                            src: await getDetailIconUrl(detail.icon),
                            alt: `${detail.label} Ícone`,
                            className: 'detail-icon'
                        }),
                        DomFactory.createText({
                            tag: 'p',
                            textContent: `${detail.label}: ${detail.value}`
                        })
                    ]
                });
                DOM_ELEMENTS.currentDetails.appendChild(detailItem);
            }
        }

        if (DOM_ELEMENTS.currentWeatherContainer) DOM_ELEMENTS.currentWeatherContainer.style.display = 'block';
    } else {
        if (DOM_ELEMENTS.currentWeatherContainer) DOM_ELEMENTS.currentWeatherContainer.style.display = 'none';
    }

    if (DOM_ELEMENTS.forecastContainer) {
        DOM_ELEMENTS.forecastContainer.innerHTML = '';

        if (data.forecast && data.forecast.length > 0) {
            for (const day of data.forecast) {
                const dayCard = DomFactory.createElement({
                    tag: 'div',
                    className: 'day-card',
                    children: [
                        DomFactory.createText({
                            tag: 'p',
                            textContent: formatDate(day.date)
                        }),
                        DomFactory.createImage({
                            src: await getIconUrl(day.icon),
                            alt: day.conditions
                        }),
                        DomFactory.createText({
                            tag: 'p',
                            textContent: `${roundNumber(day.tempMax)}°${unit.toUpperCase()} / ${roundNumber(day.tempMin)}°${unit.toUpperCase()}`
                        }),
                        DomFactory.createText({
                            tag: 'p',
                            textContent: day.description || day.conditions
                        })
                    ]
                });

                DOM_ELEMENTS.forecastContainer.appendChild(dayCard);
            }
        } else {
            DOM_ELEMENTS.forecastContainer.appendChild(
                DomFactory.createText({
                    tag: 'p',
                    textContent: 'Previsão de dias não disponível.'
                })
            );
        }
    }

    updateBackground(data.currentConditions ? data.currentConditions.icon : 'clear-day');
}

function updateBackground(icon) {
    let newBackground = '';
    if (icon.includes('clear')) {
        newBackground = 'linear-gradient(to bottom, #87CEEB, #FFFFFF)';
    } else if (icon.includes('cloudy') || icon.includes('partly-cloudy')) {
        newBackground = 'linear-gradient(to bottom, #B0C4DE, #F0F8FF)';
    } else if (icon.includes('rain')) {
        newBackground = 'linear-gradient(to bottom, #708090, #D3D3D3)';
    } else if (icon.includes('snow')) {
        newBackground = 'linear-gradient(to bottom, #ADD8E6, #F8F8FF)';
    } else {
        newBackground = 'linear-gradient(to bottom, #A9CCE3, #E8F6F3)';
    }
    if (DOM_ELEMENTS.body) {
        DOM_ELEMENTS.body.style.background = newBackground;
        DOM_ELEMENTS.body.style.transition = 'background 1s ease-in-out';
    }
}

function showLoading() {
    if (DOM_ELEMENTS.loadingSpinner) DOM_ELEMENTS.loadingSpinner.style.display = 'block';
    if (DOM_ELEMENTS.mainContent) DOM_ELEMENTS.mainContent.style.display = 'none';
    hideError();
}

function hideLoading() {
    if (DOM_ELEMENTS.loadingSpinner) DOM_ELEMENTS.loadingSpinner.style.display = 'none';
    if (DOM_ELEMENTS.mainContent) DOM_ELEMENTS.mainContent.style.display = 'block';
}

function showError(message) {
    if (DOM_ELEMENTS.errorMessage) {
        DOM_ELEMENTS.errorMessage.textContent = message;
        DOM_ELEMENTS.errorMessage.style.display = 'block';
    }
    hideLoading();
}

function hideError() {
    if (DOM_ELEMENTS.errorMessage) {
        DOM_ELEMENTS.errorMessage.textContent = '';
        DOM_ELEMENTS.errorMessage.style.display = 'none';
    }
}

export { showLoading, hideLoading, showError, displayWeatherData, DOM_ELEMENTS, DomFactory };