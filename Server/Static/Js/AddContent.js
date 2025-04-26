document.addEventListener('DOMContentLoaded', function() {
  // Hide all forms
  document.querySelectorAll('.forms-content-page form').forEach(form => {
    form.style.display = 'none';
  });

  // Hide the save button
  const addButton = document.getElementById('addButton');
  addButton.style.display = 'none';

  // Show the form for the selected content type
  let formToShow = null;
  document.getElementById('contentTypeSelect')
      .addEventListener('change', function() {
        // Reset all form data
        document.querySelectorAll('.forms-content-page form').forEach(form => {
          form.reset();
        });

        // Remove all program rows
        const programTableBody = document.getElementById('programDetailsTable')
                                     .querySelector('tbody');
        while (programTableBody.firstChild) {
          programTableBody.removeChild(programTableBody.firstChild);
        }

        // Remove all birthday rows
        const birthdayTableBody =
            document.getElementById('birthdayDetailsTable')
                .querySelector('tbody');
        while (birthdayTableBody.firstChild) {
          birthdayTableBody.removeChild(birthdayTableBody.firstChild);
        }

        // Reset Quill editors
        quillText.setText('');
        quillImageText.setText('');

        if (formToShow !== null)
          formToShow.style.display = 'none';
        else
          addButton.style.display = 'block';

        const contentType = document.getElementById('contentTypeSelect').value;
        formToShow = document.getElementById(`${contentType}ContentForm`);
        formToShow.style.display = 'block';

        // Ensure the start_date field is left empty
        const startDateField =
            formToShow.querySelector('input[name="start_date"]');
        if (startDateField) {
          startDateField.value = '';
        }

        // Add default row for program content form
        if (contentType === 'program') {
          addProgramRow();
        }

        // Add default row for birthday content form
        if (contentType === 'birthday') {
          addBirthdayRow();
        }
      });

  // Save the content
  addButton.addEventListener('click', function() {
    const contentType = document.getElementById('contentTypeSelect').value;
    const formElement = document.getElementById(`${contentType}ContentForm`);

    // Standard form validation
    if (!formElement.checkValidity()) {
      formElement.reportValidity();
      return;
    }

    // Quill editor validation
    if (contentType === 'text' && quillText.getText().trim().length === 0) {
      alert('Bitte befüllen Sie das Textfeld.');
      return;
    }
    if (contentType === 'imageText' &&
        quillImageText.getText().trim().length === 0) {
      alert('Bitte befüllen Sie das Textfeld.');
      return;
    }

    const formData = new FormData(formElement);

    // Append start_date and end_date to FormData
    const startDate =
        formElement.querySelector('input[name="start_date"]').value;
    const endDate = formElement.querySelector('input[name="end_date"]').value;
    if (startDate) formData.append('start_date', startDate);
    if (endDate) formData.append('end_date', endDate);

    const capitalizedContentType =
        contentType.charAt(0).toUpperCase() + contentType.slice(1) + 'Content';
    formData.append('type', capitalizedContentType);
    const id = generateUUID();
    formData.append('id', id);

    // Append file inputs to FormData
    formElement.querySelectorAll('input[type="file"]').forEach(input => {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];
        const fileName = file.name.split('/').pop();  // Remove folder name
        if (contentType === 'slideshow' &&
            !file.type.startsWith('image/'))  // Filter all non-image files
          continue;
        else
          formData.append('file', file, fileName);
      }
    });

    // Append Quill editor content to formData
    if (contentType === 'text') {
      formData.append('text', quillText.root.innerHTML);
    }
    if (contentType === 'imageText') {
      formData.append('text', quillImageText.root.innerHTML);
    }

    // Handle program content form data
    if (contentType === 'program') {
      const programData = {time: [], activity: [], location: [], notes: []};
      formElement.querySelectorAll('tbody tr').forEach(row => {
        programData.time.push(row.querySelector('input[name="time"]').value);
        programData.activity.push(
            row.querySelector('input[name="activity"]').value);
        programData.location.push(
            row.querySelector('input[name="location"]').value);
        programData.notes.push(row.querySelector('input[name="notes"]').value);
      });
      formData.delete('time');
      formData.delete('activity');
      formData.delete('location');
      formData.delete('notes');
      formData.append('programTable', JSON.stringify(programData));
    }

    // Handle birthday content form data
    if (contentType === 'birthday') {
      const birthdayData = {birthday: [], name: [], image: []};
      formElement.querySelectorAll('tbody tr').forEach(row => {
        birthdayData.birthday.push(
            row.querySelector('input[name="birthday"]').value);
        birthdayData.name.push(row.querySelector('input[name="name"]').value);
        const imageInput = row.querySelector('input[name="image"]');
        if (imageInput.files.length > 0) {
          birthdayData.image.push(imageInput.files[0].name);
        } else {
          birthdayData.image.push('');
        }
      });
      formData.delete('birthday');
      formData.delete('name');
      formData.delete('image');
      formData.append('birthdayTable', JSON.stringify(birthdayData));
    }

    fetch('/add_content', {
      method: 'POST',
      body: formData  // Send FormData directly
    })

    // Hide the addButton and reset the content type selection
    addButton.style.display = 'none';
    document.getElementById('contentTypeSelect').value = '';
    if (formToShow !== null) {
      formToShow.style.display = 'none';
      formToShow = null;
    }

    // Show success toast
    const updatedToast = document.getElementById('updatedToast');
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(updatedToast);
    toastBootstrap.show();
  });

  // Add row to program details table when button is clicked
  const addRowButton = document.getElementById('addRowButton');
  addRowButton.addEventListener('click', function() {
    addProgramRow()
  });

  function addProgramRow() {
    const tableBody =
        document.getElementById('programDetailsTable').querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
            <td><input type="time" class="form-control" name="time" required></td>
            <td><input type="text" class="form-control" name="activity" required></td>
            <td><input type="text" class="form-control" name="location"></td>
            <td><input type="text" class="form-control" name="notes"></td>
            <td><button type="button" class="btn btn-danger removeRowButton">Entfernen</button></td>
        `;
    tableBody.appendChild(newRow);
    newRow.querySelector('.removeRowButton')
        .addEventListener('click', function() {
          tableBody.removeChild(newRow);
        });
  }

  // Add row to birthday details table when button is clicked
  const addBirthdayRowButton = document.getElementById('addBirthdayRowButton');
  addBirthdayRowButton.addEventListener('click', function() {
    addBirthdayRow();
  });

  function addBirthdayRow() {
    const tableBody =
        document.getElementById('birthdayDetailsTable').querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.innerHTML = `
            <td><input type="date" class="form-control" name="birthday" required></td>
            <td><input type="text" class="form-control" name="name" required></td>
            <td><input type="file" class="form-control" name="image" accept="image/*"></td>
            <td><button type="button" class="btn btn-danger removeRowButton">Entfernen</button></td>
        `;
    tableBody.appendChild(newRow);
    newRow.querySelector('.removeRowButton')
        .addEventListener('click', function() {
          tableBody.removeChild(newRow);
        });
  }

  // Initialize Quill editors
  const quillText = new Quill('#quillTextEditor', {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'], [{'color': []}, {'background': []}],
        ['clean']
      ]
    }
  });

  const quillImageText = new Quill('#quillImageTextEditor', {
    theme: 'snow',
    modules: {
      toolbar: [
        ['bold', 'italic', 'underline'], [{'color': []}, {'background': []}],
        ['clean']
      ]
    }
  });

  // Add event listener to file inputs for copyright confirmation
  document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', function(event) {
      if (event.target.files.length > 0) {
        const confirmRights =
            confirm('Haben Sie die Rechte, dieses Material hochzuladen?');
        if (!confirmRights) {
          event.target.value = '';  // Clear the file input
        }
      }
    });
  });
});

// Custom UUID generation function because crypto.randomUUID() is not supported
// in all browsers
function generateUUID() {
  let d = new Date().getTime();
  let d2 = (performance && performance.now && (performance.now() * 1000)) || 0;
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}