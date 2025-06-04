import { fetchWeatherData } from './weatherService';
import { showLoading, showError, displayWeatherData } from './uiManager';

// Debounce utility
function debounce(fn, delay) {
    let timeoutId;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

let currentUnit = 'c';
let currentCity = 'Joinville';
let currentNumberOfDays = 5;

async function initWeatherApp() {
    const cityNameInput = document.getElementById('cityName');
    const searchButton = document.querySelector('.search');
    const daysSelect = document.getElementById('daysSelect');
    const unitToggleButton = document.getElementById('unitToggle');

    if (cityNameInput) cityNameInput.value = currentCity;
    if (daysSelect) daysSelect.value = currentNumberOfDays;

    async function updateWeatherDisplay() {
        showLoading();
        try {
            const data = await fetchWeatherData(currentCity, currentUnit, currentNumberOfDays);
            displayWeatherData(data, currentUnit);
        } catch (error) {
            showError(`Erro ao carregar dados do clima. Por favor, tente novamente. ${error.message}`);
            
        }
    }

    const debouncedUpdate = debounce(updateWeatherDisplay, 500);

    if (searchButton) {
        searchButton.addEventListener('click', () => {
            if (cityNameInput.value) {
                currentCity = cityNameInput.value;
                debouncedUpdate();
            } else {
                showError('Por favor, digite um nome de cidade.');
            }
        });
    }

    if (daysSelect) {
        daysSelect.addEventListener('change', () => {
            currentNumberOfDays = parseInt(daysSelect.value, 10);
            debouncedUpdate();
        });
    }

    if (unitToggleButton) {
        unitToggleButton.addEventListener('click', () => {
            currentUnit = currentUnit === 'c' ? 'f' : 'c';
            unitToggleButton.textContent = currentUnit === 'c' ? 'Fahrenheit' : 'Celsius';
            debouncedUpdate();
        });
    }

    updateWeatherDisplay();
}

document.addEventListener('DOMContentLoaded', initWeatherApp);