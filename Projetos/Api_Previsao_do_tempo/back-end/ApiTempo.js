const apiLocationKey = "2cdadc3ccefb45fca92bb32fe6561483";
const apiWeatherKey = "e1a0783237a3420634cabacb387c1461";

async function getLocation() {
    const cidade = document.getElementById("input").value.trim();

    if (!cidade) {
        console.error("Cidade não fornecida");
        return [null, null];
    }

    // Codifica a cidade para a URL
    const city = encodeURIComponent(cidade);
    let apiLocationUrl = `https://api.geoapify.com/v1/geocode/search?text=${city}&format=json&apiKey=${apiLocationKey}`;

    try {
        const resLoc = await fetch(apiLocationUrl);
        const dadosLoc = await resLoc.json();

        if (dadosLoc.results && dadosLoc.results.length > 0) {
            const lat = dadosLoc.results[0].lat;
            const long = dadosLoc.results[0].lon;
            return [lat, long];
        } else {
            console.error("Nenhum resultado encontrado para a localização.");
            return [null, null];
        }
    } catch (error) {
        console.error("Erro ao buscar localização:", error);
        return [null, null];
    }
}

async function getDados(lat, lon) {
    const apiUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiWeatherKey}&lang=pt_br`;

    try {
        const res = await fetch(apiUrl);
        const dados = await res.json();
        return dados;
    } catch (error) {
        console.error("Erro ao buscar dados climáticos:", error);
        return {};
    }
}

async function getDadosClima() {
    const [lat, lon] = await getLocation();

    if (lat === null || lon === null) {
        console.error("Não foi possível obter coordenadas válidas.");
        return [];
    }

    const dados = await getDados(lat, lon);
    const dadosClimaticos = [];

    if (dados.city && dados.list) {
        dadosClimaticos.push({
            cidade: dados.city.name,
            data: dados.list[0].dt_txt,
            temperatura: dados.list[0].main.temp,
            sensacao_termica: dados.list[0].main.feels_like,
            umidade: dados.list[0].main.humidity,
            clima: dados.list[0].weather[0].main,
            clima_desc: dados.list[0].weather[0].description,
            icon: dados.list[0].weather[0].icon,
            velocidadeVento_M_S: dados.list[0].wind.speed,
            pais: dados.city.country
        });

        dados.list.forEach((item) => {
            if (item.dt_txt.split(' ')[1] === "18:00:00" && dados.list[0].dt_txt.split(' ')[0] !== item.dt_txt.split(' ')[0]) {
                dadosClimaticos.push({
                    data: item.dt_txt,
                    temperatura: item.main.temp,
                    sensacao_termica: item.main.feels_like,
                    umidade: item.main.humidity,
                    clima: item.weather[0].main,
                    clima_desc: item.weather[0].description,
                    icon: item.weather[0].icon,
                    velocidadeVento_M_S: item.wind.speed,
                    pais: dados.city.country
                });
            }
        });
    } else {
        console.error("Dados climáticos inválidos.");
    }

    return dadosClimaticos;
}

function setBackgroundImage(clima) {
    const images = {
        Clear: 'url("../Assets/Backgrounds/sunnyBackground.jpg")',
        Clouds: 'url("../Assets/Backgrounds/cloudyBackground.webp")',
        Rain: 'url("../Assets/Backgrounds/rainingBackground.jpg")',
        Snow: 'url("../Assets/Backgrounds/snowingBackground.jpeg")',
        Thunderstorm: 'url("../Assets/Backgrounds/rainingBackground.jpg")',
        Drizzle: 'url("../Assets/Backgrounds/rainingBackground.jpg")',
        Fog: 'url("../Assets/Backgrounds/cloudyBackground.webp")',
        Default: 'url("../Assets/Backgrounds/sunnyBackground.jpg")'
    };

    const backgroundImage = images[clima] || images['Default'];

    document.body.style.backgroundImage = backgroundImage;
}

async function updateWeatherUI() {
    const dadosClimaticos = await getDadosClima();

    if (dadosClimaticos.length > 0) {
        const currentWeather = dadosClimaticos[0];
        const temperatureElem = document.getElementById('current-temperature');
        const weatherElem = document.getElementById('current-weather');
        const diaHojeElem = document.getElementById('diaHoje');

        if (temperatureElem && weatherElem) {
            const dataPartes = currentWeather.data.split(' ')[0].split("-")
            diaHojeElem.innerText = `${dataPartes[2]}/${dataPartes[1]}/${dataPartes[0]}`;
            temperatureElem.innerText = `${Math.round(currentWeather.temperatura)}°C`;
            weatherElem.innerText = (currentWeather.clima_desc).toUpperCase();
        } else {
            console.error("Elementos 'current-temperature' ou 'current-weather' não encontrados.");
        }

        setBackgroundImage(currentWeather.clima);

        dadosClimaticos.slice(1, 5).forEach((item, index) => {
            const cardIndex = index + 1;

            const dateElem = document.getElementById(`date${cardIndex}`);
            const tempElem = document.getElementById(`temperature${cardIndex}`);
            const iconElem = document.getElementById(`weather-icon${cardIndex}`);

            if (dateElem && tempElem && iconElem) {
                const dataPartes = item.data.split(' ')[0].split("-")
                dateElem.innerText = `${dataPartes[2]}/${dataPartes[1]}`;
                tempElem.innerText = `${Math.round(item.temperatura)}°C`;
                iconElem.src = `https://openweathermap.org/img/wn/${item.icon}.png`;
            } else {
                console.error(`Elementos para card ${cardIndex} não encontrados.`);
            }
        });
    } else {
        console.error("Não há dados climáticos para atualizar.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("input").addEventListener("keydown", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            updateWeatherUI();
        }
    });

    updateWeatherUI();
});
