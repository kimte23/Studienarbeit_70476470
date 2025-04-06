import os
import time
from flask import json
from ContentTypes import BaseContent
from Settings import get_setting


CONTENT_FILE_PATH = 'Server/Savestate/Content.json'
UPLOAD_FOLDER = 'Server/Static/Uploads'


class ContentManager():
    def __init__(self, send_should_show_content_to_clients):
        self.content_list = []
        self.send_should_show_content_to_clients = send_should_show_content_to_clients
        self.load_content()
        self.save_content() # Some content gets updated on initialization, so save it again immediately
    

    def load_content(self):
        # Create empty content file if it doesn't exist
        if not os.path.exists(CONTENT_FILE_PATH):
            with open(CONTENT_FILE_PATH, 'w') as file:
                json.dump([], file)

        # Check if file is empty
        if os.path.getsize(CONTENT_FILE_PATH) == 0:
            return
        
        with open(CONTENT_FILE_PATH, 'r') as file:
            content_data_list = json.load(file)
            for content_data in content_data_list:
                self.create_and_add_content(content_data)
    
    
    def save_content(self):
        content_data_list = self.get_content_list_as_dict()

        # Add content to list
        with open(CONTENT_FILE_PATH, 'w') as file:
            json.dump(content_data_list, file, indent=4, sort_keys=True)


    def create_and_add_content(self, content_data):
        content_class = BaseContent.get_subclass(content_data['type'])
        content = content_class(**content_data)
        self.add_content(content)


    def get_content_as_dict_by_id(self, id):
        content = self.get_content_by_id(id)
        return content.__dict__


    def get_content_list_as_dict(self):
        content_dict_list = []
        for content in self.content_list:
            content_dict_list.append(content.__dict__)
        return content_dict_list

    
    def get_should_show_content_list_as_dict(self):
        content_dict_list = []
        for content in self.content_list:
            if content.should_show:
                content_dict_list.append(content.__dict__)
        return content_dict_list


    def get_content_by_id(self, id):
        for content in self.content_list:
            if content.id == id:
                return content
        return None


    def update_content(self, content_data):
        # Assuming content_data is a dictionary with the necessary keys
        id = content_data.get('id')
        content = self.get_content_by_id(id)
        
        # Remove files that were removed while editing
        if 'files' in content_data['content']:
            for filename in self.get_files(id):
                if filename not in content_data['content']['files']:
                    self.delete_file(id, filename)
    
        content.__dict__.update(content_data)
        content.update() # Update content if necessary (like fetching weather for other location)
        self.save_content()


    def refresh_content(self):
        something_changed = False
        for content in self.content_list:
            if content.refresh():
                self.save_content()
                something_changed = True

        # If content was actually updated, send it to the clients        
        if something_changed:
            self.send_should_show_content_to_clients()


    def add_content(self, content):
        self.content_list.append(content)
        self.save_content()
    
    def add_content_by_id(self, id, content):
        content = self.get_content_by_id(id)
        self.add_content(content)
    

    def delete_content(self, content):
        # Handle case where two people delete the same content at the same time
        if content == None:
            return
        
        if 'files' in content.content:
            self.delete_files(content.id)
            
        self.content_list.remove(content)
        self.save_content()

    def delete_content_by_id(self, id):
        content = self.get_content_by_id(id)
        self.delete_content(content)
    

    def set_content_visibility(self, content, is_visible):
        content.is_visible = is_visible
        self.save_content()

    def set_visibility_by_id(self, id, is_visible):
        content = self.get_content_by_id(id)
        self.set_content_visibility(content, is_visible)


    def change_order(self, id_list):
        new_content_list = []
        for id in id_list:
            content = self.get_content_by_id(id)
            new_content_list.append(content)
        self.content_list = new_content_list
        self.save_content()


    def save_file(self, id, file):
        file_path = f'{UPLOAD_FOLDER}/{id}'
        os.makedirs(file_path, exist_ok=True)
        file.save(os.path.join(file_path, file.filename))


    def get_files(self, id):
        file_path = f'{UPLOAD_FOLDER}/{id}'
        return os.listdir(file_path)
    

    def delete_files(self, id):
        # Remove all files in the folder and the folder itself
        file_path = f'{UPLOAD_FOLDER}/{id}'
        for root, dirs, files in os.walk(file_path, topdown=False):
            for file in files:
                os.remove(os.path.join(root, file))
            for dir in dirs:
                os.rmdir(os.path.join(root, dir))
        os.rmdir(file_path)
    

    def delete_file(self, id, filename):
        file_path = f'{UPLOAD_FOLDER}/{id}/{filename}'
        os.remove(file_path)

    def run(self):
        while True:
            time.sleep(int(get_setting('update_interval')))  # Sleep for the update interval in seconds
            self.refresh_content()
