/* -------------------------------------------------------------------------- */
/*                                   Helpers                                  */
/* -------------------------------------------------------------------------- */
// Highlight button on click
function highlightButton(buttonId) {
    const button = document.getElementById(buttonId);
    const originalColor = button.style.backgroundColor; // Save the original color
    button.style.backgroundColor = '#0d6efd'; // Primary color
    setTimeout(() => {
        button.style.backgroundColor = originalColor; // Reset to original color
    }, 800); // Highlight for 800ms
}

function onVideoEnd() {
    if (isFrozen) {
        videoElement.play();
    } else {
        videoElement.removeEventListener('ended', onVideoEnd);
        showNextContent();
    }
}

function pauseVideoIfCurrentlyDisplayed() {
    if (currentContent && currentContent.type === 'VideoContent') {
        const videoElement = document.getElementById('videoElement');
        videoElement.pause();
        videoElement.currentTime = 0;
    }
}

// Toggle freeze
let isFrozen = false;
let freezeButton = null;
let autoUnfreezeTimer = null;
const autoUnfreezeTimeout = 10 * 60 * 1000; // 10 Min timer for stop-gesture


function toggle_freeze() {
    isFrozen = !isFrozen;
    if (isFrozen) {
        freezeButton.classList.remove('btn-dark');
        freezeButton.classList.add('btn-danger');
        freezeButton.style.backgroundColor = 'red'; // Explicitly set red color

        // start Auto-Unfreeze-Timer 
        if (autoUnfreezeTimer) clearTimeout(autoUnfreezeTimer);
        autoUnfreezeTimer = setTimeout(() => {
            console.log("Auto-Unfreeze nach 10 Minuten.");
            isFrozen = false;
            freezeButton.classList.remove('btn-danger');
            freezeButton.classList.add('btn-dark');
            freezeButton.style.backgroundColor = '';
            if (currentContent && currentContent.type !== 'VideoContent') {
                startContentTimer();
            }
        }, autoUnfreezeTimeout);

        if (currentContent) {
            if (contentTimer) {
                clearTimeout(contentTimer);

                // Handle autoplay for videos when frozen
                if (currentContent.type === 'VideoContent') {
                    const videoElement = document.getElementById('videoElement');
                    // Only bind the event listener once
                    if (!videoElement.hasAttribute('data-ended-bound')) {
                        videoElement.addEventListener('ended', onVideoEnd);
                        videoElement.setAttribute('data-ended-bound', 'true');
                    }
                }
            }
        }
        return;
    } else if (currentContent && currentContent.type !== 'VideoContent') {
        startContentTimer();
    }

    // Cancel timer when unfreezing manually
    if (autoUnfreezeTimer) clearTimeout(autoUnfreezeTimer);

    freezeButton.classList.remove('btn-danger');
    freezeButton.classList.add('btn-dark');
    freezeButton.style.backgroundColor = ''; // Reset to default
}


const getBootstrapIconClass = (weatherCode) => {
    switch (true) {
        // Clear sky
        case weatherCode === 0:
            return 'bi bi-sun';

        // Mainly clear, partly cloudy, overcast
        case weatherCode >= 1 && weatherCode <= 3:
            return 'bi bi-cloud-sun';

        // Fog and depositing rime fog
        case weatherCode >= 45 && weatherCode <= 48:
            return 'bi bi-cloud-fog';

        // Drizzle
        case weatherCode >= 51 && weatherCode <= 55: // Light to dense drizzle
            return 'bi bi-cloud-drizzle';

        // Freezing drizzle
        case weatherCode >= 56 && weatherCode <= 57: // Light to dense freezing drizzle
            return 'bi bi-cloud-drizzle-fill';

        // Rain
        case weatherCode >= 61 && weatherCode <= 63: // Slight to moderate rain
            return 'bi bi-cloud-rain';
        case weatherCode === 65: // Heavy rain
            return 'bi bi-cloud-rain-heavy';

        // Freezing rain
        case weatherCode >= 66 && weatherCode <= 67: // Light to heavy freezing rain
            return 'bi bi-cloud-rain-heavy';

        // Snowfall
        case weatherCode >= 71 && weatherCode <= 75: // Slight to heavy snow
            return 'bi bi-cloud-snow';

        // Snow grains
        case weatherCode === 77:
            return 'bi bi-cloud-snow-fill';

        // Rain showers
        case weatherCode >= 80 && weatherCode <= 81: // Slight to moderate rain showers
            return 'bi bi-cloud-rain';
        case weatherCode === 82: // Violent rain showers
            return 'bi bi-cloud-rain-heavy';

        // Snow showers
        case weatherCode >= 85 && weatherCode <= 86: // Slight to heavy snow showers
            return 'bi bi-cloud-snow';

        // Thunderstorms
        case weatherCode === 95: // Slight or moderate thunderstorm
            return 'bi bi-cloud-lightning';
        case weatherCode === 96 || weatherCode === 99: // Thunderstorm with hail
            return 'bi bi-cloud-lightning-rain';

        // Default fallback
        default:
            return 'bi bi-question-circle'; // Unknown or unmapped weather code
    }
};


/* -------------------------------------------------------------------------- */
/*                               Render content                               */
/* -------------------------------------------------------------------------- */
let currentContentIndex = 0
let currentContent = null; // Define currentContent globally

function showNextContent(){
    currentContentIndex = (currentContentIndex + 1) % content.length
    renderContent()
}


function showPreviousContent(){
    currentContentIndex = (currentContentIndex - 1 + content.length) % content.length;
    renderContent()
}


let contentContainers = {}
let currentlyVisibleContentContainer = null
// Start the timer when content is rendered
function renderContent() {
    // Exit if there is no content
    if (content.length === 0) {
        console.log("No content to display");
        return;
    }

    currentContent = content[currentContentIndex];
    console.log("Current content:", currentContent);

    // Hide currently visible content
    if (currentlyVisibleContentContainer) {
        currentlyVisibleContentContainer.style.display = 'none';
        currentlyVisibleContentContainer.classList.add('d-none');
    }

    // Get the appropriate container for the given content type
    currentlyVisibleContentContainer = contentContainers[currentContent.type];
    
    if (currentlyVisibleContentContainer) {
        currentlyVisibleContentContainer.style.display = 'flex';
        currentlyVisibleContentContainer.classList.remove('d-none');

        // Cache-busting query parameter
        const cacheBuster = `?v=${new Date().getTime()}`;

        switch (currentContent.type) {
            case 'TextContent':
                currentlyVisibleContentContainer.innerHTML = currentContent.content.text;
                currentlyVisibleContentContainer.style.lineHeight = '1.5';
                currentlyVisibleContentContainer.style.fontSize = '3em';
                break;
            case 'ImageContent':
                const imageElement = document.getElementById('imageElement');
                const imageUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}${cacheBuster}`;
                if (imageElement.src !== imageUrl) {
                    imageElement.src = imageUrl;
                }
                break;
            case 'VideoContent':
                const videoElement = document.getElementById('videoElement');
                const videoUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}${cacheBuster}`;
                if (videoElement.src !== videoUrl) {
                    videoElement.src = videoUrl;
                    videoElement.play(); // Video will only play if window is focused
                }
                videoElement.controls = false; // Hide controls
                if (isFrozen) {
                    videoElement.addEventListener('ended', onVideoEnd);
                }
                break;
            case 'PdfContent':
                const pdfUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}`;
                renderPdf(pdfUrl);
                break;
            case 'SlideshowContent':
                const slideshowElement = document.getElementById('slideshowElement');
                let currentSlideIndex = 0;
                const updateSlide = () => {
                    if (currentContent.type !== 'SlideshowContent') {
                        return;
                    }

                    const slideUrl = `get_file/${currentContent.id}/${currentContent.content.files[currentSlideIndex]}${cacheBuster}`;
                    if (slideshowElement.src !== slideUrl) {
                        slideshowElement.src = slideUrl;
                    }
                    currentSlideIndex = (currentSlideIndex + 1) % currentContent.content.files.length;
                };
                updateSlide();
                if (!slideshowElement.hasAttribute('data-interval-set')) {
                    setInterval(updateSlide, currentContent.content.duration_per_image * 1000);
                    slideshowElement.setAttribute('data-interval-set', 'true');
                }
                break;
            case 'ExcelContent':
                const excelUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}`;
                renderExcel(excelUrl);
                break;
            case 'ProgramContent':
                renderProgram();
                break;
            case 'BirthdayContent':
                const birthdayImage = document.getElementById('birthdayImage');
                const birthdayText = document.getElementById('birthdayText');

                // Ensure current_index is initialized and incremented correctly
                if (typeof currentContent.current_index === 'undefined') {
                    currentContent.current_index = 0;
                } else {
                    currentContent.current_index = (currentContent.current_index + 1) % currentContent.birthday_indices.length;
                }

                const birthdayIndex = currentContent.birthday_indices[currentContent.current_index];
                const birthdayPerson = currentContent.content.birthdayTable.name[birthdayIndex];
                const birthdayImageUrl = currentContent.content.birthdayTable.image[birthdayIndex];

                birthdayText.textContent = `${birthdayPerson} hat heute Geburtstag!`;

                if (birthdayImageUrl) {
                    birthdayImage.src = `get_file/${currentContent.id}/${birthdayImageUrl}`;
                    birthdayImage.classList.remove('d-none');
                } else {
                    birthdayImage.classList.add('d-none');
                }
                break;
            case 'WeatherContent':
                renderWeather(currentContent);
                break;
            case 'NewsContent':
                const newsImage = document.getElementById('newsImage');
                const newsTitle = document.getElementById('newsTitle');
                const newsDescription = document.getElementById('newsDescription');                
                const newsQRCode = document.getElementById('newsQRCode');

                // Ensure current_index is initialized and incremented correctly
                if (typeof currentContent.current_index === 'undefined') {
                    currentContent.current_index = 0;
                } else {
                    currentContent.current_index = (currentContent.current_index + 1) % currentContent.content.articles.length;
                }

                const article = currentContent.content.articles[currentContent.current_index];
                newsTitle.textContent = article.title;
                newsDescription.textContent = article.description;

                // Generate QR code for the article URL
                newsQRCode.innerHTML = '';
                new QRCode(newsQRCode, {
                    text: article.url,
                    width: 128,
                    height: 128
                });

                // Check if the image is available
                const img = new Image();
                img.onload = function() {
                    newsImage.src = article.urlToImage;
                    newsImage.style.display = 'block';
                };
                img.onerror = function() {
                    newsImage.style.display = 'none';
                };
                img.src = article.urlToImage;

                break;
            case 'GameContent':
                const gameElement = document.getElementById('gameElement');
                const gameUrl = `get_file/${currentContent.id}/${currentContent.content.html}${cacheBuster}`;
                if (gameElement.src !== gameUrl) {
                    gameElement.src = gameUrl;
                }
                break;
            case 'ImageTextContent':
                const text = document.getElementById('imageTextTextElement');
                text.innerHTML = currentContent.content.text;
                text.style.lineHeight = '1.5';
                text.style.fontSize = '3em';

                const image = document.getElementById('imageTextImageElement');
                const imageTextUrl = `get_file/${currentContent.id}/${currentContent.content.files[0]}${cacheBuster}`;
                if (image.src !== imageTextUrl) {
                    image.src = imageTextUrl;
                }
                break;
            default:
                console.error("Undefined content type. Content: ", currentContent);
        }
        
        startContentTimer();
    } else {
        console.error("Undefined content type. Content: ", currentContent);
    }
}


let contentTimer = null;
function startContentTimer() {
    if (contentTimer) {
        clearTimeout(contentTimer);
    }

    if (!isFrozen) {
        if (content.length > 0) {
            contentTimer = setTimeout(() => {
                showNextContent();
            }, content[currentContentIndex].duration * 1000);
        }
    }
}

let pdfRenderTask = null;

function renderPdf(url) {
    const pdfCanvas = document.getElementById('pdfCanvas');
    const pdfContext = pdfCanvas.getContext('2d');

    if (pdfRenderTask) {
        pdfRenderTask.cancel();
    }

    pdfjsLib.getDocument(url).promise.then(pdf => {
        pdf.getPage(1).then(page => {
            const viewport = page.getViewport({ scale: 1.5 });
            pdfCanvas.height = viewport.height;
            pdfCanvas.width = viewport.width;

            const renderContext = {
                canvasContext: pdfContext,
                viewport: viewport
            };
            pdfRenderTask = page.render(renderContext);
            pdfRenderTask.promise.then(() => {
                pdfRenderTask = null;
            }).catch(error => {
                if (error.name !== 'RenderingCancelledException') {
                    console.error('Error rendering PDF:', error);
                }
            });
        });
    });
}

function renderExcel(url) {
    const excelElement = document.getElementById('excelContent');
    fetch(url)
        .then(response => response.arrayBuffer())
        .then(data => {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const html = XLSX.utils.sheet_to_html(worksheet, { id: "excelTable", editable: true });

            // Create a heading element
            const heading = document.createElement('h1');
            heading.textContent = currentContent.title;
            heading.classList.add('table-heading');
            heading.style.marginBottom = '32px'; // Add margin to the heading

            // Clear previous content and append the heading and table
            excelElement.innerHTML = '';
            excelElement.appendChild(heading);
            const tableContainer = document.createElement('div');
            tableContainer.classList.add('page-table-content');
            tableContainer.style.marginBottom = '32px'; // Add margin to the table
            tableContainer.innerHTML = html;
            excelElement.appendChild(tableContainer);

            // Add Bootstrap table classes and increase font size
            const table = document.getElementById('excelTable');
            if (table) {
                table.classList.add('table', 'table-striped', 'table-bordered');
                table.querySelectorAll('th').forEach(th => th.style.fontSize = '1.2em'); // Increase font size for header
                table.querySelectorAll('td').forEach(td => td.style.fontSize = '1.1em'); // Increase font size for body

                // Make the first row bold
                const firstRow = table.querySelector('tbody tr');
                if (firstRow) {
                    firstRow.querySelectorAll('td').forEach(td => td.style.fontWeight = 'bold');
                }
            }
        })
        .catch(error => console.error('Error rendering Excel:', error));
}

function renderProgram() {
    const programElement = document.getElementById('programContent');
    const programTable = currentContent.content.programTable;

    // Create a heading element
    const heading = document.createElement('h1');
    heading.textContent = currentContent.title;
    heading.classList.add('table-heading');
    heading.style.marginBottom = '32px'; // Add margin to the heading

    // Create a table element
    const table = document.createElement('table');
    table.id = 'programTable';
    table.classList.add('table', 'table-striped', 'table-bordered');
    table.style.marginBottom = '32px'; // Add margin to the table

    // Define the order of columns and their German translations
    const columns = [
        { key: 'time', label: 'Zeit' },
        { key: 'activity', label: 'Aktivität' },
        { key: 'location', label: 'Ort' },
        { key: 'notes', label: 'Anmerkungen' }
    ];

    // Create table header
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    columns.forEach(column => {
        const th = document.createElement('th');
        th.textContent = column.label;
        th.style.fontSize = '1.2em'; // Increase font size for header
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    // Create table body
    const tbody = document.createElement('tbody');
    const rowCount = programTable[columns[0].key].length;
    for (let i = 0; i < rowCount; i++) {
        const row = document.createElement('tr');
        columns.forEach(column => {
            const td = document.createElement('td');
            td.textContent = programTable[column.key][i];
            td.style.fontSize = '1.1em'; // Increase font size for body
            row.appendChild(td);
        });
        tbody.appendChild(row);
    }
    table.appendChild(tbody);

    // Clear previous content and append the heading and table
    programElement.innerHTML = '';
    programElement.appendChild(heading);
    const tableContainer = document.createElement('div');
    tableContainer.classList.add('page-table-content');
    tableContainer.appendChild(table);
    programElement.appendChild(tableContainer);
}

const renderWeather = (content) => {
    const container = document.createElement('div');
    const weatherElement = document.getElementById('weatherElement');
    weatherElement.innerHTML = ''; // Clear previous content
    weatherElement.appendChild(container);
    container.className = 'd-flex flex-column justify-content-center align-items-center'; // Center the table
    container.style.width = '100%'; // Full width
    container.style.marginBottom = '80px'; // Add some space below the table

    const daysOfWeekShort = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa']; // Days in German

    // Todays section
    const todayContainer = document.createElement('div');
    todayContainer.className = 'd-flex justify-content-center align-items-center'; // Flexbox for today's weather
    todayContainer.style.width = '100%'; // Full width
    container.appendChild(todayContainer);

    // Today's big card
    const todayCard = document.createElement('div');
    todayCard.className = 'card text-center p-4 mb-3 shadow'; // Add shadow and padding
    todayCard.style.width = '60%'; // Adjust width for better proportions
    todayContainer.appendChild(todayCard);

    // Today's weather data
    const todayData = {
        time: content.content.weather.daily.time[0],
        weather_code: content.content.weather.daily.weather_code[0],
        temperature_2m_max: content.content.weather.daily.temperature_2m_max[0],
        temperature_2m_min: content.content.weather.daily.temperature_2m_min[0]
    };

    // Date or Day Name
    const todayDate = document.createElement('h2');
    todayDate.innerText = `Wetter in ${content.content.location}`;
    todayDate.className = 'fw-bold mb-2';
    todayDate.style.fontSize = '3rem'; // Larger text
    todayCard.appendChild(todayDate);

    // Weather Icon
    const todayIcon = document.createElement('i');
    todayIcon.className = getBootstrapIconClass(todayData.weather_code);
    todayIcon.style.fontSize = '7rem'; // Larger icon size
    todayCard.appendChild(todayIcon);

    // Current Temperature
    const currentTemp = document.createElement('div');
    currentTemp.innerHTML = `
        <span style="font-size: 2rem;">Aktuell: ${content.content.weather.current.temperature_2m}°C</span>`;
    currentTemp.className = 'mt-3'; // Add some margin-top
    todayCard.appendChild(currentTemp);

    // Temperatures
    const todayTemp = document.createElement('div');
    todayTemp.innerHTML = `
        <span style="font-size: 2rem;">Max: ${todayData.temperature_2m_max}°C</span><br>
        <span style="font-size: 2rem;">Min: ${todayData.temperature_2m_min}°C</span>`;
    todayTemp.className = 'mt-3'; // Add some margin-top
    todayCard.appendChild(todayTemp);

    // Create forecasts section
    const forecastsContainer = document.createElement('div');
    forecastsContainer.className = 'card d-flex flex-row p-4 shadow'; // Flexbox for row layout
    forecastsContainer.style.width = '60%'; // Constrain container width
    forecastsContainer.style.justifyContent = 'space-between'; // Distribute cards evenly
    container.appendChild(forecastsContainer);

    for (let i = 1; i < content.content.weather.daily.time.length; i++) {
        // Extract data for the current day
        const dailyData = {
            time: content.content.weather.daily.time[i],
            weather_code: content.content.weather.daily.weather_code[i],
            temperature_2m_max: content.content.weather.daily.temperature_2m_max[i],
            temperature_2m_min: content.content.weather.daily.temperature_2m_min[i]
        };
        
        // Forecast card
        const divForecast = document.createElement('div');
        divForecast.className = 'd-flex flex-column align-items-center text-center';
        divForecast.style.flex = '1'; // Each card takes equal width
        divForecast.style.margin = '0 5px'; // Small margin between cards
        forecastsContainer.appendChild(divForecast);

        // Day name
        const day = new Date(dailyData.time).getDay();
        const dayName = document.createElement('div');
        dayName.innerText = daysOfWeekShort[day];
        dayName.className = 'fw-bold mb-1'; // Reduce margin below
        dayName.style.fontSize = '2rem'; // Adjust text size
        divForecast.appendChild(dayName);

        // Weather icon
        const weatherIcon = document.createElement('i');
        weatherIcon.className = getBootstrapIconClass(dailyData.weather_code);
        weatherIcon.style.fontSize = '5rem'; // Adjust icon size
        divForecast.appendChild(weatherIcon);

        // Min/Max temperatures
        const temp = document.createElement('div');
        temp.innerHTML = `${dailyData.temperature_2m_max}°C<br>${dailyData.temperature_2m_min}°C`;
        temp.className = 'mt-1'; // Reduce margin
        temp.style.fontSize = '1.8rem'; // Adjust font size
        divForecast.appendChild(temp);
    }
};

/* -------------------------------------------------------------------------- */
/*                              DOMContentLoaded                              */
/* -------------------------------------------------------------------------- */
document.addEventListener('DOMContentLoaded', function() {
    console.log('RAW CONTENT:');
    console.log(content);

    /* ------------------------------- Containers ------------------------------- */
    contentContainers = {
        'TextContent': document.getElementById('textContent'),
        'ImageContent': document.getElementById('imageContent'),
        'ImageTextContent': document.getElementById('imageTextContent'),
        'VideoContent': document.getElementById('videoContent'),
        'SlideshowContent': document.getElementById('slideshowContent'),
        'PdfContent': document.getElementById('pdfContent'),
        'ExcelContent': document.getElementById('excelContent'),
        'ProgramContent': document.getElementById('programContent'),
        'BirthdayContent': document.getElementById('birthdayContent'),
        'WeatherContent': document.getElementById('weatherContent'),
        'NewsContent': document.getElementById('newsContent'),
        'GameContent': document.getElementById('gameContent')
    };

    // Hide the navbar if showNavbar is set to off
    if (showNavbar === 'off') {
        document.querySelector('.base-navbar').style.display = 'none';
        document.querySelector('.below-navbar').style.marginTop = '0';
        document.querySelectorAll('.centered-content').forEach(element => {
            element.style.height = '100vh';
        });
    }

    // Show first element of content list
    renderContent()

    const imageElement = document.getElementById('imageElement');
    const videoElement = document.getElementById('videoElement');
    const slideshowElement = document.getElementById('slideshowElement');

    if (imageElement) {
        imageElement.src += '?v=' + new Date().getTime();
    }

    if (videoElement) {
        videoElement.src += '?v=' + new Date().getTime();
    }

    if (slideshowElement) {
        slideshowElement.src += '?v=' + new Date().getTime();
    }

    /* ----------------------------- Navbar buttons ----------------------------- */
    // Show previous content on button click
    document.getElementById('previousContentButton').addEventListener('click', function() {
        pauseVideoIfCurrentlyDisplayed();
        showPreviousContent()
    });
    

    // Show next content on button click
    document.getElementById('nextContentButton').addEventListener('click', function() {
        pauseVideoIfCurrentlyDisplayed();
        showNextContent()
    });


    // Bind freeze button callback to toggle_freeze
    freezeButton = document.getElementById('toggleFreezeButton');
    freezeButton.addEventListener('click', toggle_freeze);
});


/* -------------------------------------------------------------------------- */
/*                                  SocketIO Server                           */
/* -------------------------------------------------------------------------- */
function connectSocketIo() {
    const socket = io(socketIoUrl);

    socket.on('connect', () => {
        console.log('Connected to SocketIO server');
    });
    
    socket.on('content_updated', (newContent) => {
        console.log('Content updated:', newContent);
        const wasContentEmpty = content.length === 0;
        const isContentEmpty = newContent.length === 0;
        content = newContent;

        // If content was empty and now is not empty, start rendering
        if (wasContentEmpty && !isContentEmpty) {
            currentContentIndex = 0;
            renderContent();
        }

        // If the updated content is empty, clear the currently shown content
        if (isContentEmpty) {
            if (currentlyVisibleContentContainer) {
                currentlyVisibleContentContainer.style.display = 'none';
                currentlyVisibleContentContainer.classList.add('d-none');
                currentlyVisibleContentContainer = null;
            }
            currentContent = null;
            console.log("Cleared currently shown content as the updated content is empty.");
        }
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from SocketIO server');
    });
}
connectSocketIo();


/* -------------------------------------------------------------------------- */
/*                                  Websocket Gesture Recognition             */
/* -------------------------------------------------------------------------- */
let socket;
let reconnectInterval = 10000; // Time to wait before retrying (in milliseconds)
let maxRetries = 3;
let retryCount = 0;
function connectWebSocket() {
    socket = new WebSocket('ws://localhost:5001');

    // Connection opened
    socket.addEventListener('open', () => {
        retryCount = 0;
    });

    // Handle messages from the server
    socket.addEventListener('message', (event) => {
        if (event.data === 'switch_content_previous') {
            if (currentContent && currentContent.type !== 'GameContent') {
            highlightButton('previousContentButton');
            pauseVideoIfCurrentlyDisplayed();
            showPreviousContent();
            }
        } else if (event.data === 'switch_content_next') {
            if (currentContent && currentContent.type !== 'GameContent') {
            highlightButton('nextContentButton');
            pauseVideoIfCurrentlyDisplayed();
            showNextContent();
            }
        } else if (event.data === 'toggle_freeze'){
            toggle_freeze();
        } else if (event.data === 'ok' && currentContent && currentContent.type === 'GameContent') {
            if (!isFrozen) {
                toggle_freeze();
            }
        }
    });

    // Handle connection closure
    socket.addEventListener('close', () => {
        console.log('WebSocket connection closed');
        if (retryCount < maxRetries) {
            console.log(`Retrying connection in ${reconnectInterval / 1000} seconds...`);
            retryCount++;
            setTimeout(connectWebSocket, reconnectInterval);
        } else {
            console.error('Maximum reconnection attempts reached. Giving up.');
        }
    });
}

// Start the WebSocket connection
connectWebSocket();


