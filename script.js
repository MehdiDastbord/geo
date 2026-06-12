const map = L.map("map", {
    zoomControl: true
}).setView([25, 10], 2);

L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "&copy; OpenStreetMap Contributors"
    }
).addTo(map);

let currentMarker = null;
let countriesData = [];

const countryName = document.getElementById("countryName");
const capital = document.getElementById("capital");
const flag = document.getElementById("flag");
const population = document.getElementById("population");
const currency = document.getElementById("currency");
const continent = document.getElementById("continent");
const language = document.getElementById("language");
const coords = document.getElementById("coords");
const localTime = document.getElementById("localTime");
const temperature = document.getElementById("temperature");
const weatherDesc = document.getElementById("weatherDesc");
const searchInput = document.getElementById("countrySearch");

let activeTimezone = null;

async function loadCountries() {
    try {
        const res = await fetch(
            "https://restcountries.com/v3.1/all?fields=name,capital,flags,population,currencies,languages,continents,latlng,timezones"
        );

        countriesData = await res.json();
    } catch (err) {
        console.error(err);
    }
}

loadCountries();

function formatPopulation(num) {
    return new Intl.NumberFormat("fa-IR").format(num);
}

function updateClock() {
    if (!activeTimezone) return;

    try {
        const time = new Date().toLocaleTimeString("fa-IR", {
            timeZone: activeTimezone,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit"
        });

        localTime.textContent = time;
    } catch (e) {}
}

setInterval(updateClock, 1000);

async function loadWeather(lat, lon) {
    try {
        const url =
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.current_weather) {
            temperature.textContent =
                data.current_weather.temperature + "°C";

            weatherDesc.innerHTML = `
                سرعت باد:
                ${data.current_weather.windspeed}
                km/h
                <br>
                جهت باد:
                ${data.current_weather.winddirection}°
            `;
        }
    } catch (err) {
        console.error(err);
    }
}

function showCountry(country) {
    const lat = country.latlng[0];
    const lon = country.latlng[1];

    if (currentMarker) {
        map.removeLayer(currentMarker);
    }

    currentMarker = L.marker([lat, lon]).addTo(map);

    map.flyTo([lat, lon], 5, {
        duration: 1.5
    });

    countryName.textContent =
        country.name?.common || "-";

    capital.textContent =
        "پایتخت: " +
        (country.capital
            ? country.capital[0]
            : "-");

    flag.src =
        country.flags?.png ||
        country.flags?.svg;

    population.textContent =
        formatPopulation(
            country.population || 0
        );

    continent.textContent =
        country.continents
            ? country.continents[0]
            : "-";

    coords.textContent =
        lat.toFixed(2) +
        " , " +
        lon.toFixed(2);

    const langs =
        country.languages
            ? Object.values(
                  country.languages
              ).join("، ")
            : "-";

    language.textContent = langs;

    if (country.currencies) {
        currency.textContent =
            Object.values(
                country.currencies
            )[0].name;
    } else {
        currency.textContent = "-";
    }

    activeTimezone =
        country.timezones
            ? country.timezones[0]
            : null;

    updateClock();

    loadWeather(lat, lon);

    currentMarker.bindPopup(`
        <b>${country.name.common}</b>
    `).openPopup();
}

searchInput.addEventListener(
    "input",
    function () {
        const value =
            this.value
                .trim()
                .toLowerCase();

        if (!value) return;

        const country =
            countriesData.find(c =>
                c.name.common
                    .toLowerCase()
                    .includes(value)
            );

        if (country) {
            showCountry(country);
        }
    }
);

map.on("click", async function (e) {
    try {
        const lat = e.latlng.lat;
        const lon = e.latlng.lng;

        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        );

        const data =
            await response.json();

        const countryNameClicked =
            data.address?.country;

        if (!countryNameClicked)
            return;

        const country =
            countriesData.find(
                c =>
                    c.name.common ===
                    countryNameClicked
            );

        if (country) {
            showCountry(country);
        }
    } catch (err) {
        console.error(err);
    }
});

setTimeout(() => {
    const iran = countriesData.find(
        c => c.name.common === "Iran"
    );

    if (iran) {
        showCountry(iran);
    }
}, 2500);
