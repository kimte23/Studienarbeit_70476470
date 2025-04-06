function setDateTime() {
    const daysOfWeek = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];

    const now = new Date();

    const dayOfWeek = daysOfWeek[now.getDay()];
    const day = String(now.getDate()).padStart(2, '0');
    const month = months[now.getMonth()];
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const dateTimeText = document.getElementById('dateTimeText');
    dateTimeText.textContent = `${dayOfWeek}, ${day}. ${month} ${hours}:${minutes}`;
}


function initializeDateTimeUpdater() {
    setDateTime();
    setInterval(setDateTime, 1000); // Update every second
}


document.addEventListener('DOMContentLoaded', function() {
    initializeDateTimeUpdater()
});