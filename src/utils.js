export function formatDate(dateString, locale = 'pt-BR', options = { weekday: 'short', month: 'short', day: 'numeric' }) {
    return new Date(dateString).toLocaleDateString(locale, options);
}

export function roundNumber(value) {
    return Math.round(value);
}