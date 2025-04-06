#!/bin/bash


# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
WHITE='\033[0m'


# Services
SERVICE_AUTOSTART_BROWSER="Services/AutostartBrowser.service"
SERVICE_AUTOSTART_GESTURE_RECOGNITION="Services/AutostartGestureRecognition.service"
SERVICE_AUTOSTART_SERVER="Services/AutostartServer.service"


# Function to uninstall a service
uninstall_service() {
    local service_file=$1

    if [ -f "/etc/systemd/system/$(basename "$service_file")" ]; then
        echo -e "${BLUE}Uninstalling service from ${service_file}${WHITE}"
        
        # Stop the service
        sudo systemctl stop $(basename "$service_file")
        
        # Disable the service
        sudo systemctl disable $(basename "$service_file")
        
        # Remove the service file
        sudo rm "/etc/systemd/system/$(basename "$service_file")"
        
        # Reload systemd
        sudo systemctl daemon-reload
    else
        echo -e "${GREEN}Service ${service_file} does not exist.${WHITE}"
    fi
}


# Function to reverse the setting of a static IP address
reverse_static_ip() {
    echo -e "${BLUE}Reversing static IP address settings${WHITE}"
    
    # Restore the backup dhcpcd.conf file if it exists
    if [ -f "/etc/dhcpcd.conf.bak" ]; then
        sudo mv /etc/dhcpcd.conf.bak /etc/dhcpcd.conf
        
        # Restart the dhcpcd service to apply changes
        sudo systemctl restart dhcpcd
    else
        echo -e "${GREEN}Backup dhcpcd.conf file does not exist. No changes made.${WHITE}"
    fi
}


# Uninstall services
uninstall_service $SERVICE_AUTOSTART_BROWSER
uninstall_service $SERVICE_AUTOSTART_GESTURE_RECOGNITION
uninstall_service $SERVICE_AUTOSTART_SERVER


# Reverse static IP settings
reverse_static_ip


echo -e "${GREEN}Uninstallation complete.${WHITE}"
