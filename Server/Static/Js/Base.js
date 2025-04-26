function setDateTime() {
  const daysOfWeek = [
    'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag',
    'Sonntag'
  ];
  const months = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August',
    'September', 'Oktober', 'November', 'Dezember'
  ];

  const now = new Date();

  const dayOfWeek = daysOfWeek[now.getDay()];
  const day = String(now.getDate()).padStart(2, '0');
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const dateTimeText = document.getElementById('dateTimeText');
  dateTimeText.textContent =
      `${dayOfWeek}, ${day}. ${month} ${year} ${hours}:${minutes} Uhr`;
}


function initializeDateTimeUpdater() {
  setDateTime();
  setInterval(setDateTime, 1000);  // Update every second
}


document.addEventListener('DOMContentLoaded', function() {
  initializeDateTimeUpdater();

  // Apply navbar and background colors
  const body = document.body;
  const navbar = document.querySelector('.base-navbar');
  const navbarColor = body.getAttribute('data-navbar-color');
  const backgroundColor = body.getAttribute('data-background-color');

  if (navbarColor) {
    navbar.style.backgroundColor = navbarColor;
    navbar.style.setProperty(
        'background-color', navbarColor,
        'important');  // Ensure it overrides default styles

    // Update button colors to match the navbar
    const navbarButtons = document.querySelectorAll('.navbar-button');
    navbarButtons.forEach(button => {
      const isFreezeButton = button.id === 'toggleFreezeButton';
      button.style.backgroundColor = isFreezeButton ? 'inherit' : navbarColor;
      button.style.borderColor = isFreezeButton ?
          'transparent' :
          navbarColor;  // Remove border for freeze button

      // Add highlighting effect on hover
      button.addEventListener('mouseenter', () => {
        if (!isFreezeButton || !button.classList.contains('btn-danger')) {
          button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }
      });
      button.addEventListener('mouseleave', () => {
        if (!isFreezeButton || !button.classList.contains('btn-danger')) {
          button.style.backgroundColor =
              isFreezeButton ? 'inherit' : navbarColor;
        }
      });

      // Ensure click does not override hover effect
      button.addEventListener('mousedown', () => {
        if (!isFreezeButton || !button.classList.contains('btn-danger')) {
          button.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
        }
      });
      button.addEventListener('mouseup', () => {
        if (!isFreezeButton || !button.classList.contains('btn-danger')) {
          button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        }
      });
    });
  }
  if (backgroundColor) {
    body.style.backgroundColor = backgroundColor;
  }
});