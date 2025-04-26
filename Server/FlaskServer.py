import argparse
import json
import socket
import threading
from Settings import settings, set_setting, get_setting
from flask import Flask, render_template, request, send_from_directory
from ContentManager import ContentManager
from flask_socketio import SocketIO


# ---------------------------------------------------------------------------- #
#                                Initializations                               #
# ---------------------------------------------------------------------------- #
app = Flask(__name__, static_folder='Static', template_folder='Templates')
app.secret_key = 'super secret key'
socketio = SocketIO(app, cors_allowed_origins='*')

def send_should_show_content_to_clients():
    socketio.emit('content_updated', content_manager.get_should_show_content_list_as_dict())

content_manager = ContentManager(send_should_show_content_to_clients)
threading.Thread(target=content_manager.run, daemon=True).start()


# ---------------------------------------------------------------------------- #
#                              Info display routes                             #
# ---------------------------------------------------------------------------- #
@app.route('/')
def render_show_content():
    content = content_manager.get_should_show_content_list_as_dict()
    print(content)
    private_ip = socket.gethostbyname(socket.gethostname())
    return render_template(
        'ShowContent.html', 
        content=content, 
        socketIoUrl=f'http://{private_ip}:5000', 
        showNavbar=get_setting('show_navbar'),
        settings=settings  # Pass settings to the template
    )


@app.route('/get_file/<path:filename>')
def serve_file(filename):
    return send_from_directory('Static/Uploads', filename)


# ---------------------------------------------------------------------------- #
#                              Add content routes                              #
# ---------------------------------------------------------------------------- #
@app.route('/add_content')
def render_add_content():
    return render_template('AddContent.html', settings=settings)  # Pass settings to the template

@app.route('/add_content', methods=['POST'])
def add_content(): 
    # Cant use json because of file uploads
    content_data = {
        'type': request.form.get('type', ''),
        'id': request.form.get('id', ''),
        'title': request.form.get('title', ''),
        'duration': int(request.form.get('duration', 0)),
        'start_date': request.form.get('start_date', None),  # Add start_date
        'end_date': request.form.get('end_date', None),      # Add end_date
        'content': {key: value for key, value in request.form.items() if key not in ['id', 'title', 'duration', 'type', 'start_date', 'end_date']},
    }

    # Handle file uploads
    if request.files:
        files_set = set()
        for key in request.files:
            for file in request.files.getlist(key):
                files_set.add(file.filename)
                content_manager.save_file(content_data['id'], file)
        content_data['content']['files'] = list(files_set) if files_set else None

    # Convert nested JSON strings to dictionaries
    for key, value in content_data['content'].items():
        if isinstance(value, str):
            try:
                # Try to parse the string as JSON
                content_data['content'][key] = json.loads(value)
            except json.JSONDecodeError:
                # If it fails, keep the original string
                content_data['content'][key] = value

    content_manager.create_and_add_content(content_data)
    send_should_show_content_to_clients()
    return 'Content added', 200


# ---------------------------------------------------------------------------- #
#                             Manage content routes                            #
# ---------------------------------------------------------------------------- #
@app.route('/manage_content')
def render_manage_content():
    content = content_manager.get_content_list_as_dict()
    return render_template('ManageContent.html', content=content, settings=settings)

@app.route('/edit_content')
def edit_content():
    id = request.args.get('id')
    content = content_manager.get_content_as_dict_by_id(id)
    return render_template('EditContent.html', content=content, settings=settings)


@app.route('/update_content', methods=['POST'])
def update_content():
    # Cant use json because of file uploads
    content_data = {
        'id': request.form['id'],
        'title': request.form['title'],
        'duration': int(request.form.get('duration', 0)),
        'start_date': request.form.get('start_date', None),  # Add start_date
        'end_date': request.form.get('end_date', None),      # Add end_date
        'content': {key: value for key, value in request.form.items() if key not in ['id', 'title', 'duration', 'start_date', 'end_date']},
    }

    # Get existing files
    if 'files' in request.form:
        existing_files = set(request.form.getlist('files'))
    else:
        existing_files = set()

    # Handle file uploads
    if 'file' in request.files:
        for file in request.files.getlist('file'):
            existing_files.add(file.filename)
            content_manager.save_file(content_data['id'], file)
    
    if existing_files:
        content_data['content']['files'] = list(existing_files)

    for key, value in content_data['content'].items():
        if isinstance(value, str):
            try:
                # Try to parse the string as JSON
                content_data['content'][key] = json.loads(value)
            except json.JSONDecodeError:
                # If it fails, keep the original string
                content_data['content'][key] = value

    content_manager.update_content(content_data)
    send_should_show_content_to_clients()
    return 'Content updated', 200


@app.route('/set_visibility', methods=['POST'])
def set_visibility():
    data = request.get_json()
    id = data['id']
    is_visible = data['is_visible']
    content_manager.set_visibility_by_id(id, is_visible)
    send_should_show_content_to_clients() 
    return 'Visibility set', 200


@app.route('/delete_content', methods=['POST'])
def delete_content():
    data = request.get_json()
    id = data['id']
    content_manager.delete_content_by_id(id)
    send_should_show_content_to_clients() 
    return 'Content deleted', 200


@app.route('/change_order', methods=['POST'])
def change_order():
    data = request.get_json()
    id_list = data['id_list']
    content_manager.change_order(id_list)
    send_should_show_content_to_clients() 
    return 'Order changed', 200


# ---------------------------------------------------------------------------- #
#                                Settings routes                               #
# ---------------------------------------------------------------------------- #
@app.route('/settings')
def render_settings():
    return render_template('Settings.html', settings=settings)


@app.route('/save_settings', methods=['POST'])
def save_settings():
    data = request.form
    for key, value in data.items():
        set_setting(key, value)
    return 'Saved settings', 200
    

# ---------------------------------------------------------------------------- #
#                                     Main                                     #
# ---------------------------------------------------------------------------- #
if __name__ == '__main__':
    # Parse command line arguments
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', type=bool, default=False, help='Enable debug mode.')
    args = parser.parse_args()

    debug = args.debug

    # Run the app with SocketIO
    socketio.run(app, host='0.0.0.0', port=5000, debug=debug, allow_unsafe_werkzeug=True)
