document.addEventListener('DOMContentLoaded', function() {
    const sortableList = document.getElementById('sortableList');
    const noContentParagraph = document.getElementById('emptyMessage');
    const dragHint = document.getElementById('dragHint');

    // Add content to the list
    content.forEach(item => {
        const div = document.createElement('div');
        div.className = 'list-group-item d-flex justify-content-between align-items-center';
        div.dataset.id = item.id; // Bind the item's id using a data attribute

        // Item title
        const titleSpan = document.createElement('span');
        titleSpan.textContent = item.title;
        div.appendChild(titleSpan);

        // Button group
        const buttonGroup = document.createElement('div');

        // Toggle Visibility Button
        const toggleVisibilityBtn = document.createElement('button');
        toggleVisibilityBtn.className = `btn ${item.is_visible ? 'btn-primary' : 'btn-outline-primary'} me-2 list-item-button`;
        toggleVisibilityBtn.innerHTML = `<i class="bi ${item.is_visible ? 'bi-eye in-button-icon' : 'bi-eye-slash in-button-icon'}"></i>`;
        toggleVisibilityBtn.title = 'Sichtbarkeit umschalten';
        toggleVisibilityBtn.addEventListener('click', function () {
            item.is_visible = !item.is_visible;
            toggleVisibilityBtn.className = `btn ${item.is_visible ? 'btn-primary in-button-icon' : 'btn-outline-primary in-button-icon'} me-2 list-item-button`;
            toggleVisibilityBtn.innerHTML = `<i class="bi ${item.is_visible ? 'bi-eye in-button-icon' : 'bi-eye-slash in-button-icon'}"></i>`;

            fetch('/set_visibility', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: item.id, is_visible: item.is_visible }),
            })
        });
        buttonGroup.appendChild(toggleVisibilityBtn);

        // Edit Content Button
        const editContentBtn = document.createElement('button');
        editContentBtn.className = 'btn btn-secondary me-2 list-item-button';
        editContentBtn.innerHTML = `<i class="bi bi-pencil in-button-icon"></i>`;
        editContentBtn.title = 'Inhalt bearbeiten';
        editContentBtn.addEventListener('click', function () {
            window.location.href = `/edit_content?id=${item.id}`;
        });
        buttonGroup.appendChild(editContentBtn);

        // Delete Content Button
        const deleteContentBtn = document.createElement('button');
        deleteContentBtn.className = 'btn btn-danger list-item-button';
        deleteContentBtn.innerHTML = `<i class="bi bi-trash in-button-icon"></i>`;
        deleteContentBtn.title = 'Inhalt löschen';
        deleteContentBtn.addEventListener('click', function () {
            if (confirm('Soll dieser Inhalt wirklich gelöscht werden?')) {
                div.remove();

                fetch('/delete_content', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id: item.id }),
                })

                if (sortableList.children.length === 0) {
                    noContentParagraph.style.display = 'block';
                    dragHint.style.display = 'none';
                }
            }
        });
        buttonGroup.appendChild(deleteContentBtn);

        div.appendChild(buttonGroup);
        sortableList.appendChild(div);
    });

    // Initialize SortableJS
    let initialOrder = Array.from(sortableList.children).map(child => child.dataset.id);

    Sortable.create(sortableList, {
        animation: 50,
        onEnd: function() {
            // Get the updated order of IDs
            const updatedOrder = Array.from(sortableList.children).map(child => child.dataset.id);

            // Check if the order has changed
            if (JSON.stringify(updatedOrder) !== JSON.stringify(initialOrder)) {
                fetch('/change_order', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ id_list: updatedOrder }),
                })
            }
            initialOrder = updatedOrder;
        }
    });

    if (sortableList.children.length === 0) {
        noContentParagraph.style.display = 'block';
        dragHint.style.display = 'none';
    } else {
        noContentParagraph.style.display = 'none';
        dragHint.style.display = 'block';
    }
});
