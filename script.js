// script.js

const apiKey = "97dbd936649fd76abfcce534af331f92"; // Replace with your weather API key
const recentSearchesKey = "recentSearches";

// Event listener for the search button
document.getElementById("search-btn").addEventListener("click", () => {
  const city = document.getElementById("city-input").value;
  if (city) {
    getWeather(city);
  } else {
    alert("Please enter a city name");
  }
});

// Event listener for current location button
document
  .getElementById("current-location-btn")
  .addEventListener("click", () => {
    if (navigator.geolocation) {
      showLoader(); // Show loader before fetching location
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          getWeatherByCoordinates(latitude, longitude);
        },
        () => {
          alert("Unable to retrieve your location.");
          hideLoader(); // Hide loader if geolocation fails
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  });

// Function to show loader
function showLoader() {
  document.getElementById("loader").classList.remove("hidden");
}

// Function to hide loader
function hideLoader() {
  document.getElementById("loader").classList.add("hidden");
}

// Function to get weather for a city
function getWeather(city) {
  showLoader(); // Show loader before fetching data
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`;
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        // Check for specific status codes and handle accordingly
        if (response.status === 404) {
          throw new Error(
            "City not found. Please check the name and try again."
          );
        } else if (response.status === 401) {
          throw new Error("Unauthorized request. Please check your API key.");
        } else {
          throw new Error(
            "An unexpected error occurred. Please try again later."
          );
        }
      }
      return response.json();
    })
    .then((data) => {
      displayWeather(data);
      fetchExtendedForecast(data.coord.lat, data.coord.lon); // Fetch extended forecast using coordinates
      saveToRecentSearches(city);
      updateRecentSearches();
    })
    .catch((error) => {
      alert(error.message); // Display the error message to the user
    })
    .finally(() => {
      hideLoader(); // Hide loader after fetching data
    });
}

// Function to fetch extended forecast
function fetchExtendedForecast(lat, lon) {
  showLoader(); // Show loader before fetching data
  const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        // Check for specific status codes and handle accordingly
        if (response.status === 404) {
          throw new Error(
            "Unable to retrieve extended forecast. Please check your request."
          );
        } else if (response.status === 401) {
          throw new Error("Unauthorized request. Please check your API key.");
        } else {
          throw new Error(
            "An unexpected error occurred while fetching the forecast. Please try again later."
          );
        }
      }
      return response.json();
    })
    .then((data) => {
      displayExtendedForecast(data);
    })
    .catch((error) => {
      alert(error.message); // Display the error message to the user
    })
    .finally(() => {
      hideLoader(); // Hide loader after fetching data
    });
}

// Function to display extended forecast
function displayExtendedForecast(data) {
  const forecastInfo = document.getElementById("forecast-info");
  forecastInfo.innerHTML = ""; // Clear previous forecast data

  const forecastDays = {};

  // Group data by date
  data.list.forEach((item) => {
    const date = item.dt_txt.split(" ")[0]; // Extract date from the timestamp
    if (!forecastDays[date]) {
      forecastDays[date] = [];
    }
    forecastDays[date].push(item);
  });

  Object.keys(forecastDays).forEach((date) => {
    const dayForecast = forecastDays[date];
    const dayWeather = dayForecast[0]; // Taking the first entry for that day

    const forecastHTML = `
            <div class="bg-white p-4 rounded shadow-md my-2">
                <h3 class="text-lg font-bold">${date}</h3>
                <p><img src="http://openweathermap.org/img/wn/${dayWeather.weather[0].icon}.png" alt="${dayWeather.weather[0].description}"> ${dayWeather.weather[0].description}</p>
                <p>Temperature: ${dayWeather.main.temp} °C</p>
                <p>Wind Speed: ${dayWeather.wind.speed} m/s</p>
                <p>Humidity: ${dayWeather.main.humidity} %</p>
            </div>
        `;

    forecastInfo.innerHTML += forecastHTML;
  });
}

// Function to display current weather
function displayWeather(data) {
  const weatherInfo = `
        <h2 class="text-2xl font-bold">${data.name}</h2>
        <p>Temperature: ${data.main.temp} °C</p>
        <p>Humidity: ${data.main.humidity} %</p>
        <p>Wind Speed: ${data.wind.speed} m/s</p>
    `;
  document.getElementById("weather-info").innerHTML = weatherInfo;
}

// Function to save recent searches
function saveToRecentSearches(city) {
  let recentSearches =
    JSON.parse(localStorage.getItem(recentSearchesKey)) || [];
  if (!recentSearches.includes(city)) {
    recentSearches.push(city);
    localStorage.setItem(recentSearchesKey, JSON.stringify(recentSearches));
  }
}

// Function to update recent searches dropdown
function updateRecentSearches() {
  const recentSearches =
    JSON.parse(localStorage.getItem(recentSearchesKey)) || [];
  const recentSearchesDiv = document.getElementById("recent-searches");
  recentSearchesDiv.innerHTML = "";

  if (recentSearches.length > 0) {
    const dropdown = document.createElement("select");
    dropdown.className = "border rounded p-2 mt-2";
    dropdown.id = "recent-search-dropdown";
    dropdown.addEventListener("change", () => {
      const selectedCity = dropdown.value;
      if (selectedCity) {
        getWeather(selectedCity);
      }
    });

    recentSearches.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      dropdown.appendChild(option);
    });

    recentSearchesDiv.appendChild(dropdown);
  }
}

// Function to get weather by coordinates
function getWeatherByCoordinates(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
  fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Unable to retrieve weather for your location");
      }
      return response.json();
    })
    .then((data) => {
      displayWeather(data);
      fetchExtendedForecast(data.coord.lat, data.coord.lon); // Fetch extended forecast
      saveToRecentSearches(data.name);
      updateRecentSearches();
    })
    .catch((error) => {
      alert(error.message); // Display the error message to the user
    });
}

// Initialize recent searches on page load
document.addEventListener("DOMContentLoaded", updateRecentSearches);
