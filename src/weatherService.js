async function fetchWeatherData(city, unit = 'c', numberOfDays = 5) {
    try {
        const unitGroup = unit === 'c' ? 'metric' : 'us';

        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${city}?unitGroup=${unitGroup}&include=days%2Calerts%2Ccurrent&key=Y2UKPCR7S6LPLM3URM2HSNZ7P&contentType=json`;

        const response = await fetch(url);

        if (!response.ok) {
            const errorData = await response.json().catch(() => response.text());
            let errorMessage = `Erro HTTP! Status: ${response.status}`;
            if (typeof errorData === 'object' && errorData.message) {
                errorMessage += ` - ${errorData.message}`;
            } else if (typeof errorData === 'string' && errorData.length > 0) {
                errorMessage += ` - ${errorData}`;
            } else {
                errorMessage += ` - Erro desconhecido`;
            }
            throw new Error(errorMessage);
        }

        const weatherData = await response.json();

        if (!weatherData.days || !Array.isArray(weatherData.days)) {
            throw new Error('Dados de dias não encontrados ou não estão no formato esperado.');
        }

        const actualNumberOfDays = Math.min(numberOfDays, weatherData.days.length, 15);

        const selectedDaysData = weatherData.days.slice(0, actualNumberOfDays);

        const formattedForecast = selectedDaysData.map(day => ({
            date: day.datetime,
            temp: day.temp,
            tempMax: day.tempmax,
            tempMin: day.tempmin,
            humidity: day.humidity,
            windSpeed: day.windspeed,
            uviIndex: day.uvindex,
            sunrise: day.sunrise,
            sunset: day.sunset,
            description: day.description,
            icon: day.icon,
            conditions: day.conditions
        }));

        return {
            city: weatherData.resolvedAddress || weatherData.address,
            description: weatherData.description,
            timezone: weatherData.timezone,
            currentConditions: weatherData.currentConditions,
            forecast: formattedForecast,
            alerts: weatherData.alerts || []
        };
    } catch (error) {
        console.error('Erro ao buscar dados do clima:', error);
        throw error;
    }
}

export { fetchWeatherData };