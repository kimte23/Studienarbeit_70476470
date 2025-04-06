document.addEventListener('DOMContentLoaded', function() {
    // Save settings on button click
    document.getElementById('saveButton').addEventListener('click', function() {
        const showNavbarCheckbox = document.getElementById('showNavbar');
        
        // Confirm if disabling the navbar
        if (!showNavbarCheckbox.checked) {
            const confirmDisable = confirm("Das Deaktivieren der Navbar blendet das Navigationsmenü auf dem Infodisplay aus. Um es wieder zu aktivieren, öffnen Sie den Server mit /settings. Möchten Sie fortfahren?");
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

        fetch('/save_settings', {
            method: 'POST',
            body: formData
        });

        // Show success toast
        const updatedToast = document.getElementById('updatedToast');
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(updatedToast);
        toastBootstrap.show();
    });
});