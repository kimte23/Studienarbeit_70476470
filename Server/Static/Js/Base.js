function setDateTime() {
    const daysOfWeek = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

    const now = new Date();

    const dayOfWeek = daysOfWeek[now.getDay()];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const dateTimeText = document.getElementById('dateTimeText');
    dateTimeText.textContent = `${dayOfWeek}, ${day}. ${month} ${year} ${hours}:${minutes}`;
}


function initializeDateTimeUpdater() {
    setDateTime();
    setInterval(setDateTime, 1000); // Update every second
}


document.addEventListener('DOMContentLoaded', function() {
    initializeDateTimeUpdater()
});