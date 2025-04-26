document.addEventListener('DOMContentLoaded', function() {
  // Save settings on button click
  document.getElementById('saveButton').addEventListener('click', function() {
    const showNavbarCheckbox = document.getElementById('showNavbar');
    const navbarColorInput = document.getElementById('navbarColor');
    const backgroundColorInput = document.getElementById('backgroundColor');

    // Confirm if disabling the navbar
    if (!showNavbarCheckbox.checked) {
      const confirmDisable = confirm(
          'Das Deaktivieren der Navbar blendet das Navigationsmenü auf dem Infodisplay aus. Um es wieder zu aktivieren, öffnen Sie den Server mit /settings. Möchten Sie fortfahren?');
      if (!confirmDisable) {
        return;
      }
    }

    // Create form data
    const formData = new FormData(document.getElementById('settingsForm'));

    // Handle unchecked case by appending 'false' when not checked
    if (!showNavbarCheckbox.checked) {
      formData.append('show_navbar', 'off');
    }

    fetch('/save_settings', {method: 'POST', body: formData}).then(() => {
      // Dynamically apply the new colors
      const navbar = document.querySelector('.base-navbar');
      const body = document.body;

      if (navbarColorInput.value) {
        navbar.style.backgroundColor = navbarColorInput.value;
        navbar.style.setProperty(
            'background-color', navbarColorInput.value,
            'important');  // Ensure it overrides default styles
      }
      if (backgroundColorInput.value) {
        body.style.backgroundColor = backgroundColorInput.value;
      }

      // Show success toast
      const updatedToast = document.getElementById('updatedToast');
      const toastBootstrap = bootstrap.Toast.getOrCreateInstance(updatedToast);
      toastBootstrap.show();
    });
  });

  const resetNavbarColorButton = document.getElementById('resetNavbarColor');
  const resetBackgroundColorButton =
      document.getElementById('resetBackgroundColor');

  const defaultNavbarColor = '#212529';      // Default navbar color
  const defaultBackgroundColor = '#ffffff';  // Default background color

  resetNavbarColorButton.addEventListener('click', () => {
    const navbarColorInput = document.getElementById('navbarColor');
    navbarColorInput.value = defaultNavbarColor;
  });

  resetBackgroundColorButton.addEventListener('click', () => {
    const backgroundColorInput = document.getElementById('backgroundColor');
    backgroundColorInput.value = defaultBackgroundColor;
  });
});