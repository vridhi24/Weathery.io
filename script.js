
class WeatherApp {
    constructor() {
        // OpenWeatherMap API configuration
        this.apiKey = '20e964138169d9a187fb01a0d7d84833';
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
        
        // DOM elements
        this.elements = {
            searchInput: document.getElementById('searchInput'),
            searchBtn: document.getElementById('searchBtn'),
            refreshBtn: document.getElementById('refreshBtn'),
            errorMessage: document.getElementById('errorMessage'),
            loading: document.getElementById('loading'),
            weatherContent: document.getElementById('weatherContent'),
            
            // Weather data elements
            weatherIcon: document.getElementById('weatherIcon'),
            temperature: document.getElementById('temperature'),
            description: document.getElementById('description'),
            location: document.getElementById('location'),
            feelsLike: document.getElementById('feelsLike'),
            humidity: document.getElementById('humidity'),
            windSpeed: document.getElementById('windSpeed'),
            pressure: document.getElementById('pressure'),
            
            // Forecast containers
            hourlyContainer: document.getElementById('hourlyContainer'),
            dailyContainer: document.getElementById('dailyContainer')
        };
        
        // Current weather data
        this.currentWeatherData = null;
        this.currentLocation = '';
        
        this.init();
    }
    
 
    init() {
        this.bindEvents();
        this.loadLastLocation();
    }
    

    bindEvents() {
        // Search functionality
        this.elements.searchBtn.addEventListener('click', () => this.handleSearch());
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Refresh functionality
        this.elements.refreshBtn.addEventListener('click', () => this.refreshWeather());
        
        // Focus on search input
        this.elements.searchInput.focus();
    }
    
    /**
     * Handle search button click
     */
    async handleSearch() {
        const location = this.elements.searchInput.value.trim();
        
        if (!location) {
            this.showError('Please enter a city name');
            return;
        }
        
        await this.fetchWeatherData(location);
    }
    
    /**
     * Refresh current weather data
     */
    async refreshWeather() {
        if (this.currentLocation) {
            await this.fetchWeatherData(this.currentLocation);
        }
    }
    
    /**
     * Fetch weather data from API
     */
    async fetchWeatherData(location) {
        try {
            this.showLoading();
            
            // Fetch current weather
            const currentWeatherUrl = `${this.baseUrl}/weather?q=${location}&units=metric&appid=${this.apiKey}`;
            const currentResponse = await fetch(currentWeatherUrl);
            const currentData = await currentResponse.json();
            
            if (currentData.cod === '404') {
                this.showError('Location not found. Please try again.');
                return;
            }
            
            // Fetch forecast data
            const forecastUrl = `${this.baseUrl}/forecast?q=${location}&units=metric&appid=${this.apiKey}`;
            const forecastResponse = await fetch(forecastUrl);
            const forecastData = await forecastResponse.json();
            
            // Store data and update UI
            this.currentWeatherData = currentData;
            this.currentLocation = location;
            this.saveLastLocation(location);
            
            this.displayCurrentWeather(currentData);
            this.displayForecast(forecastData);
            this.showWeatherContent();
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            this.showError('Failed to fetch weather data. Please try again.');
        }
    }
    
    /**
     * Display current weather information
     */
    displayCurrentWeather(data) {
        // Weather icon
        const iconCode = data.weather[0].icon;
        this.elements.weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        this.elements.weatherIcon.alt = data.weather[0].description;
        
        // Temperature and description
        this.elements.temperature.textContent = `${Math.round(data.main.temp)}°C`;
        this.elements.description.textContent = data.weather[0].description;
        this.elements.location.textContent = `${data.name}, ${data.sys.country}`;
        
        // Weather details
        this.elements.feelsLike.textContent = `${Math.round(data.main.feels_like)}°C`;
        this.elements.humidity.textContent = `${data.main.humidity}%`;
        this.elements.windSpeed.textContent = `${Math.round(data.wind.speed * 3.6)} km/h`;
        this.elements.pressure.textContent = `${data.main.pressure} hPa`;
    }
    
    /**
     * Display forecast information
     */
    displayForecast(data) {
        this.displayHourlyForecast(data);
        this.displayDailyForecast(data);
    }
    
    /**
     * Display hourly forecast
     */
    displayHourlyForecast(data) {
        const hourlyData = data.list.slice(0, 8); // Next 24 hours (3-hour intervals)
        
        this.elements.hourlyContainer.innerHTML = hourlyData.map(item => {
            const time = new Date(item.dt * 1000).toLocaleTimeString('en-US', {
                hour: 'numeric',
                hour12: true
            });
            const temp = Math.round(item.main.temp);
            const iconCode = item.weather[0].icon;
            
            return `
                <div class="hourly-item">
                    <div class="hourly-time">${time}</div>
                    <img src="https://openweathermap.org/img/wn/${iconCode}.png" 
                         alt="${item.weather[0].description}" 
                         class="hourly-icon">
                    <div class="hourly-temp">${temp}°C</div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Display daily forecast
     */
    displayDailyForecast(data) {
        const dailyData = this.groupForecastByDay(data.list);
        
        this.elements.dailyContainer.innerHTML = dailyData.slice(0, 5).map(day => {
            const date = new Date(day.dt * 1000);
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            const iconCode = day.weather[0].icon;
            const maxTemp = Math.round(day.main.temp_max);
            const minTemp = Math.round(day.main.temp_min);
            
            return `
                <div class="daily-item">
                    <div class="daily-day">${dayName}</div>
                    <img src="https://openweathermap.org/img/wn/${iconCode}.png" 
                         alt="${day.weather[0].description}" 
                         class="daily-icon">
                    <div class="daily-temp">
                        <span class="daily-high">${maxTemp}°</span>
                        <span class="daily-low">${minTemp}°</span>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    /**
     * Group forecast data by day
     */
    groupForecastByDay(list) {
        const grouped = {};
        
        list.forEach(item => {
            const date = new Date(item.dt * 1000).toDateString();
            
            if (!grouped[date]) {
                grouped[date] = {
                    dt: item.dt,
                    weather: item.weather,
                    main: {
                        temp_max: item.main.temp_max,
                        temp_min: item.main.temp_min
                    }
                };
            } else {
                grouped[date].main.temp_max = Math.max(grouped[date].main.temp_max, item.main.temp_max);
                grouped[date].main.temp_min = Math.min(grouped[date].main.temp_min, item.main.temp_min);
            }
        });
        
        return Object.values(grouped);
    }
    
    /**
     * Show loading state
     */
    showLoading() {
        this.hideAllStates();
        this.elements.loading.classList.add('show');
        this.elements.searchBtn.disabled = true;
    }
    
    /**
     * Show error message
     */
    showError(message) {
        this.hideAllStates();
        this.elements.errorMessage.querySelector('p').textContent = message;
        this.elements.errorMessage.classList.add('show');
        this.elements.searchBtn.disabled = false;
    }
    
    /**
     * Show weather content
     */
    showWeatherContent() {
        this.hideAllStates();
        this.elements.weatherContent.classList.add('show');
        this.elements.searchBtn.disabled = false;
    }
    
    /**
     * Hide all state elements
     */
    hideAllStates() {
        this.elements.errorMessage.classList.remove('show');
        this.elements.loading.classList.remove('show');
        this.elements.weatherContent.classList.remove('show');
    }
    
    /**
     * Save last searched location to localStorage
     */
    saveLastLocation(location) {
        localStorage.setItem('weatherApp_lastLocation', location);
    }
    
    /**
     * Load last searched location from localStorage
     */
    loadLastLocation() {
        const lastLocation = localStorage.getItem('weatherApp_lastLocation');
        if (lastLocation) {
            this.elements.searchInput.value = lastLocation;
        }
    }
}

// Initialize the Weathery.io when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});
