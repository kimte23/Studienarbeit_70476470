import json
import os


SETTINGS_FILE_PATH = 'Server/Savestate/Settings.json'


settings = {
    'show_navbar': 'on', # on, off
    'update_interval': 60 * 2, # 2 minutes
    'weather_update_interval': 60, # 1 hour
    'news_update_interval': 60 * 2, # 2 hours
    'news_api_key': '',
    'news_count_items': 5,
    'navbarColor': '#212529',
    'backgroundColor': '#FFFFFF',
}


def load_settings():
    # Ensure the directory exists
    os.makedirs(os.path.dirname(SETTINGS_FILE_PATH), exist_ok=True)

    # Create the file if it doesn't exist
    if not os.path.exists(SETTINGS_FILE_PATH):
        save_settings()
        return
    
    with open(SETTINGS_FILE_PATH, 'r') as file:
        settings.update(json.load(file))
    

def save_settings():
    with open(SETTINGS_FILE_PATH, 'w') as file:
        json.dump(settings, file, indent=4, sort_keys=True)


def get_setting(key):
    return settings[key]


def set_setting(key, value):
    settings[key] = value
    save_settings()

    


# Load settings when this module is imported
load_settings()