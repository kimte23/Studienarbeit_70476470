document.addEventListener('DOMContentLoaded', function() {
    console.log("content to edit: ", content);

    // Hide all forms
    document.querySelectorAll('.forms-content-page form').forEach(form => {
        form.style.display = 'none';
    });

    // Convert PascalCase to camelCase
    const toCamelCase = str => str.charAt(0).toLowerCase() + str.slice(1);

    // Show the form corresponding to content.type
    const formToShow = document.getElementById(`${toCamelCase(content.type)}Form`);
    if (formToShow) {
        formToShow.style.display = 'block';
    }

    // Initialize Quill editors
    const quillText = new Quill('#quillTextEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'color': [] }, { 'background': [] }],
                ['clean']
            ]
        }
    });

    const quillImageText = new Quill('#quillImageTextEditor', {
        theme: 'snow',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'color': [] }, { 'background': [] }],
                ['clean']
            ]
        }
    });

    // Fill Quill editors with existing content
    if (content.type === 'TextContent') {
        quillText.root.innerHTML = content.content.text;
    }
    if (content.type === 'ImageTextContent') {
        quillImageText.root.innerHTML = content.content.text;
    }

    // Auto-fill program content form
    if (content.type === 'ProgramContent') {
        const programData = content.content.programTable;
        const tableBody = document.getElementById('programDetailsTable').querySelector('tbody');
        programData.time.forEach((time, index) => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="time" class="form-control" name="time" value="${time}" required></td>
                <td><input type="text" class="form-control" name="activity" value="${programData.activity[index]}" required></td>
                <td><input type="text" class="form-control" name="location" value="${programData.location[index]}"></td>
                <td><input type="text" class="form-control" name="notes" value="${programData.notes[index]}"></td>
                <td><button type="button" class="btn btn-danger removeRowButton">Entfernen</button></td>
            `;
            tableBody.appendChild(newRow);
            newRow.querySelector('.removeRowButton').addEventListener('click', function() {
                tableBody.removeChild(newRow);
            });
        });
    }

    // Auto-fill birthday content form
    if (content.type === 'BirthdayContent') {
        const birthdayData = content.content.birthdayTable;
        const tableBody = document.getElementById('birthdayDetailsTable').querySelector('tbody');
        birthdayData.birthday.forEach((birthday, index) => {
            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td><input type="date" class="form-control" name="birthday" value="${birthday}" required></td>
                <td><input type="text" class="form-control" name="name" value="${birthdayData.name[index]}" required></td>
                <td>
                    <input type="file" class="form-control" name="image" accept="image/*">
                    <small class="form-text text-muted truncate">
                        ${birthdayData.image[index] ? `Aktuelle Datei: ${birthdayData.image[index]}` : ''}
                    </small>
                </td>
                <td><button type="button" class="btn btn-danger removeRowButton">Entfernen</button></td>
            `;
            tableBody.appendChild(newRow);
            newRow.querySelector('.removeRowButton').addEventListener('click', function() {
                tableBody.removeChild(newRow);
            });
        });
    }

    // Add row to program table
    document.getElementById('addRowButton').addEventListener('click', function() {
        const tableBody = document.getElementById('programDetailsTable').querySelector('tbody');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="time" class="form-control" name="time" required></td>
            <td><input type="text" class="form-control" name="activity" required></td>
            <td><input type="text" class="form-control" name="location"></td>
            <td><input type="text" class="form-control" name="notes"></td>
            <td><button type="button" class="btn btn-danger removeRowButton">Entfernen</button></td>
        `;
        tableBody.appendChild(newRow);
        newRow.querySelector('.removeRowButton').addEventListener('click', function() {
            tableBody.removeChild(newRow);
        });
    });

    // Add row to birthday table
    document.getElementById('addBirthdayRowButton').addEventListener('click', function() {
        const tableBody = document.getElementById('birthdayDetailsTable').querySelector('tbody');
        const newRow = document.createElement('tr');
        newRow.innerHTML = `
            <td><input type="date" class="form-control" name="birthday" required></td>
            <td><input type="text" class="form-control" name="name" required></td>
            <td>
                <input type="file" class="form-control" name="image" accept="image/*">
                <small class="form-text text-muted truncate"></small>
            </td>
            <td><button type="button" class="btn btn-danger removeRowButton">Entfernen</button></td>
        `;
        tableBody.appendChild(newRow);
        newRow.querySelector('.removeRowButton').addEventListener('click', function() {
            tableBody.removeChild(newRow);
        });
    });

    document.getElementById('saveButton').addEventListener('click', function() {
        // Check if form is valid
        if (!formToShow.checkValidity()) {
            formToShow.reportValidity();
            return;
        }

        const formData = new FormData(formToShow);
        formData.append('id', content.id);

        // Append file inputs to FormData
        let filesChanged = false;
        formToShow.querySelectorAll('input[type="file"]').forEach(input => {
            if (input.files.length > 0) {
                filesChanged = true;
                for (let i = 0; i < input.files.length; i++) {
                    const file = input.files[i];
                    const fileName = file.name.split('/').pop(); // Remove folder name
                    if (content.type === 'SlideshowContent' && !file.type.startsWith('image/')) // Filter all non-image files
                        continue;
                    else
                        formData.append('file', file, fileName);
                }
            }
        });

        // Append Quill editor content to formData
        if (content.type === 'TextContent') {
            formData.append('text', quillText.root.innerHTML);
        }
        if (content.type === 'ImageTextContent') {
            formData.append('text', quillImageText.root.innerHTML);
        }

        // Handle program content form data
        if (content.type === 'ProgramContent') {
            const programData = {
                time: [],
                activity: [],
                location: [],
                notes: []
            };
            formToShow.querySelectorAll('tbody tr').forEach(row => {
                const timeInput = row.querySelector('input[name="time"]');
                const activityInput = row.querySelector('input[name="activity"]');
                const locationInput = row.querySelector('input[name="location"]');
                const notesInput = row.querySelector('input[name="notes"]');
                if (timeInput && activityInput && locationInput && notesInput) {
                    const timeValue = timeInput.value.trim();
                    const activityValue = activityInput.value.trim();
                    const locationValue = locationInput.value.trim();
                    const notesValue = notesInput.value.trim();
                    if (timeValue || activityValue || locationValue || notesValue) {
                        programData.time.push(timeValue);
                        programData.activity.push(activityValue);
                        programData.location.push(locationValue);
                        programData.notes.push(notesValue);
                    }
                }
            });
            formData.delete('time');
            formData.delete('activity');
            formData.delete('location');
            formData.delete('notes');
            formData.append('programTable', JSON.stringify(programData));
        }

        // Handle birthday content form data
        if (content.type === 'BirthdayContent') {
            const birthdayData = {
                birthday: [],
                name: [],
                image: []
            };
            const existingFiles = [];
            formToShow.querySelectorAll('tbody tr').forEach((row, rowIndex) => {
                const birthdayInput = row.querySelector('input[name="birthday"]');
                const nameInput = row.querySelector('input[name="name"]');
                const imageInput = row.querySelector('input[name="image"]');
                if (birthdayInput && nameInput && imageInput) {
                    const birthdayValue = birthdayInput.value.trim();
                    const nameValue = nameInput.value.trim();
                    if (birthdayValue || nameValue) {
                        birthdayData.birthday.push(birthdayValue);
                        birthdayData.name.push(nameValue);
                        if (imageInput.files.length > 0) {
                            birthdayData.image.push(imageInput.files[0].name);
                        } else {
                            const smallText = imageInput.nextElementSibling;
                            if (smallText && smallText.classList.contains('form-text')) {
                                const currentFileText = smallText.textContent.trim().replace('Aktuelle Datei: ', '');
                                birthdayData.image.push(currentFileText);
                                existingFiles.push(currentFileText);
                            } else {
                                const existingFile = content.content.birthdayTable.image[rowIndex];
                                birthdayData.image.push(existingFile);
                                existingFiles.push(existingFile);
                            }
                        }
                    }
                }
            });
            formData.delete('birthday');
            formData.delete('name');
            formData.delete('image');
            formData.append('birthdayTable', JSON.stringify(birthdayData));

            // Append existing files if no new files were uploaded for those entries
            existingFiles.forEach(file => {
                formData.append('files', file);
            });
        }

        // Append existing files if no new files were uploaded
        if (!filesChanged && content.content.files) {
            content.content.files.forEach(file => {
                formData.append('files', file);
            });
        }

        fetch('/update_content', {
            method: 'POST',
            body: formData
        })
        
        // Update the current file text if files were changed
        if (filesChanged) {
            formToShow.querySelectorAll('input[type="file"]').forEach((input, index) => {
                const smallText = input.nextElementSibling;
                if (smallText && smallText.classList.contains('form-text')) {
                    const fileNames = Array.from(input.files).map(file => file.name);
                    if (fileNames.length === 1) {
                        smallText.innerHTML = `Aktuelle Datei: ${fileNames[0]}`;
                    } else if (fileNames.length > 1) {
                        const fileNamesHtml = fileNames.map(name => `<div>${name}</div>`).join('');
                        smallText.innerHTML = `Aktuelle Dateien: ${fileNamesHtml}`;
                        smallText.classList.add('truncate');
                    } else {
                        const existingFile = content.content.birthdayTable.image[index];
                        smallText.innerHTML = `Aktuelle Datei: ${existingFile}`;
                    }
                }
            });
        }

        // Show success toast
        const updatedToast = document.getElementById('updatedToast');
        const toastBootstrap = bootstrap.Toast.getOrCreateInstance(updatedToast);
        toastBootstrap.show();

    });
});