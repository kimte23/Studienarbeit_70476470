#!/bin/bash


# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
WHITE='\033[0m'


# Requirements
REQUIREMENTS_GESTURE_RECOGNITION="Modules/GestureRecognition/Requirements.txt"
REQUIREMENTS_SERVER_REQUIREMENTS="Server/Requirements.txt"


# Services
SERVICE_AUTOSTART_BROWSER="Services/AutostartBrowser.service"
SERVICE_AUTOSTART_GESTURE_RECOGNITION="Services/AutostartGestureRecognition.service"
SERVICE_AUTOSTART_SERVER="Services/AutostartServer.service"


# Get the directory of the current script
INSTALL_DIR=$(dirname "$(readlink -f "$0")")


# ---------------------------------------------------------------------------- #
#                                    Helpers                                   #
# ---------------------------------------------------------------------------- #
install_requirements() {
    local requirements_file=$1

    echo -e "${BLUE}Installing requirements from ${requirements_file}${WHITE}"
    
    # Create virtual environment if it does not exist
    if [ ! -d ".venv" ]; then
        python3 -m venv .venv
    fi
    
    # Activate virtual environment
    source .venv/bin/activate
    
    # Install requirements
    pip install -r "$requirements_file"
    
    # Deactivate virtual environment
    deactivate
}

# Function to replace placeholders in service files
update_service_file() {
    local service_file=$1
    shift
    local placeholders=("$@")

    echo -e "${BLUE}Updating ${service_file} with placeholders${WHITE}"
    
    for placeholder in "${placeholders[@]}"; do
        local key=$(echo $placeholder | cut -d= -f1)
        local value=$(echo $placeholder | cut -d= -f2)
        sudo sed -i "s|${key}|${value}|g" "$service_file"
    done
}

install_service() {
    local service_file=$1
    shift
    local placeholders=("$@")

    echo -e "${BLUE}Installing service from ${service_file}${WHITE}"
    
    # Copy service file to systemd
    sudo cp "$service_file" /etc/systemd/system/
    
    # Update the service file with the actual placeholders
    update_service_file "/etc/systemd/system/$(basename "$service_file")" "${placeholders[@]}" "%USER_NAME%=$(whoami)"
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    # Enable service
    sudo systemctl enable $(basename "$service_file")

    # Start service
    sudo systemctl start $(basename "$service_file")
}

# Detect package manager
if command -v apt-get &> /dev/null; then
    PACKAGE_MANAGER="apt-get"
elif command -v pacman &> /dev/null; then
    PACKAGE_MANAGER="pacman"
else
    echo -e "${RED}Unsupported package manager. Please install Firefox manually.${WHITE}"
    exit 1
fi

install_firefox() {
    # Check if firefox is installed
    if ! command -v firefox &> /dev/null; then
        echo -e "${BLUE}Firefox not found. Installing Firefox...${WHITE}"
        if [ "$PACKAGE_MANAGER" == "apt-get" ]; then
            sudo apt-get update
            sudo apt-get install -y firefox
        elif [ "$PACKAGE_MANAGER" == "pacman" ]; then
            sudo pacman -Syu --noconfirm firefox
        fi
    else
        echo -e "${GREEN}Firefox is already installed.${WHITE}"
    fi
}

# Function to set a static IP address
set_static_ip() {
    local ip_address=$1
    local gateway=$2
    local interface=$3

    # Find the connection profile for the interface
    local connection_name=$(nmcli -t -f NAME,DEVICE con show | grep "$interface" | cut -d: -f1)

    if [ -z "$connection_name" ]; then
        echo -e "${RED}No connection profile found for interface ${interface}.${WHITE}"
        echo -e "${BLUE}Creating a new connection profile for ${interface}.${WHITE}"
        connection_name="static-${interface}"
        sudo nmcli con add type wifi ifname "$interface" con-name "$connection_name" ssid "YourSSID"
    fi

    echo -e "${BLUE}Setting static IP address: ${ip_address} on interface: ${interface}${WHITE}"

    # Apply the new static IP configuration
    sudo nmcli con mod "$connection_name" ipv4.addresses "$ip_address"
    sudo nmcli con mod "$connection_name" ipv4.gateway "$gateway"
    sudo nmcli con mod "$connection_name" ipv4.method manual
    sudo nmcli con up "$connection_name"

    echo -e "${GREEN}Static IP configuration applied successfully.${WHITE}"
}


# Function to get the current IP address
get_current_ip() {
    local interface=$1
    nmcli -g IP4.ADDRESS dev show "$interface" | head -n 1
}

# Function to configure static IP address
configure_static_ip() {
    # Ask if the user wants to set up a static IP address
    echo -e "${YELLOW}Completing this task will restart your internet connection. If youre using SSH, you will need to reconnect!${WHITE}"
    if [[ "$setup_static_ip" == "yes" || "$setup_static_ip" == "y" ]]; then
        # Get the current IP address
        echo -e "${YELLOW}Enter the network interface to get the current IP address (e.g., eth0 or wlan0):${WHITE}"
        read network_interface
        current_ip=$(get_current_ip $network_interface)
        echo -e "${GREEN}Current IP address of ${network_interface}: ${current_ip}${WHITE}"

        # Prompt user for static IP configuration
        echo -e "${YELLOW}Enter the static IP address you want to set (e.g., 192.168.X.Y/24 where X is the network address and Y is the address the device should use from now on):${WHITE}"
        read static_ip
        echo -e "${YELLOW}Enter the gateway IP address (e.g., 192.168.X.Y where X is the network address and Y is the routers address (usually '1')):${WHITE}"
        read gateway_ip
        
        set_static_ip $static_ip $gateway_ip $network_interface
    fi
}

# Function to set the DISPLAY variable permanently
set_display_variable() {
    local display_value=$1
    echo -e "${BLUE}Setting DISPLAY variable to ${display_value} permanently${WHITE}"
    
    # Add the DISPLAY variable to the .bashrc file
    echo "export DISPLAY=${display_value}" >> ~/.bashrc
    
    # Source the .bashrc file to apply changes
    source ~/.bashrc
}


# ---------------------------------------------------------------------------- #
#                         Installation implementations                         #
# ---------------------------------------------------------------------------- #
install_server() {
    install_requirements $REQUIREMENTS_SERVER_REQUIREMENTS
    install_service $SERVICE_AUTOSTART_SERVER "%INSTALL_DIR%=$INSTALL_DIR"
}

install_gesture_recognition() {
    install_requirements $REQUIREMENTS_GESTURE_RECOGNITION
    install_service $SERVICE_AUTOSTART_GESTURE_RECOGNITION "%INSTALL_DIR%=$INSTALL_DIR"
}

install_autostart_browser() {
    # Prompt user for the server's IP address
    echo -e "${YELLOW}Enter the server's IP address the browser should connect to (use "localhost" if the server is running on this device!):${WHITE}"
    read server_ip
    
    # Set the DISPLAY variable permanently
    set_display_variable ":0"
    
    install_firefox
    install_service $SERVICE_AUTOSTART_BROWSER "%SERVER_IP%=http://${server_ip}:5000"
}


# ---------------------------------------------------------------------------- #
#                        Prompting user for installation                       #
# ---------------------------------------------------------------------------- #
echo -e "${YELLOW}Do you want to setup a static IP? (yes/no)${WHITE}"
read setup_static_ip
if [[ "$setup_static_ip" == "yes" || "$setup_static_ip" == "y" ]]; then
    configure_static_ip
fi

echo
echo -e "${YELLOW}Do you want to install the Server? (yes/no)${WHITE}"
read install_server
if [[ "$install_server" == "yes" || "$install_server" == "y" ]]; then
    install_server
fi

echo
echo -e "${YELLOW}Do you want to install gesture recognition? This will only work if a camera is connected to the device! (yes/no)${WHITE}"
read install_gesture
if [[ "$install_gesture" == "yes" || "$install_gesture" == "y" ]]; then
    install_gesture_recognition
fi

echo
echo -e "${YELLOW}Do you want to enable autostarting the browser and showing the infodisplay? This installs firefox if not installed yet! (yes/no)${WHITE}"
read install_services
if [[ "$install_services" == "yes" || "$install_services" == "y" ]]; then
    install_autostart_browser
fi

echo
echo -e "${YELLOW}If you want to do any changes, rerun the Install.sh script. Changes will be overwritten.${WHITE}"
echo -e "${YELLOW}If you change the network or want to change the static IP address you have to make a clean reinstall. Execute Uninstall.sh first, then run Install.sh${WHITE}"
echo -e "${YELLOW}If you want to uninstall the project from your system run the Uninstall.sh script.${WHITE}"
