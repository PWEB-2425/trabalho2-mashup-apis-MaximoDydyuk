const axios = require('axios');

class ApiService {
  constructor() {
    if (!process.env.OPENWEATHER_API_KEY) {
      throw new Error('OPENWEATHER_API_KEY não definida');
    }
    if (!process.env.PIXABAY_API_KEY) {
      throw new Error('PIXABAY_API_KEY não definida');
    }
    
    this.weatherApiKey = process.env.OPENWEATHER_API_KEY;
    this.pixabayApiKey = process.env.PIXABAY_API_KEY;
  }

  async getCityData(city) {
    try {
      // 1. Obter dados meteorológicos
      const weatherResponse = await axios.get(
        `https://api.openweathermap.org/data/2.5/weather`,
        {
          params: {
            q: city,
            appid: this.weatherApiKey,
            units: 'metric',
            lang: 'pt'
          },
          timeout: 10000 // 10 segundos timeout
        }
      );

      if (weatherResponse.status !== 200) {
        throw new Error(`OpenWeatherMap retornou status ${weatherResponse.status}`);
      }

      const weatherData = weatherResponse.data;
      const countryCode = weatherData.sys.country;
      
      // 2. Obter dados do país
      const countryResponse = await axios.get(
        `https://restcountries.com/v3.1/alpha/${countryCode}`,
        { timeout: 10000 }
      );

      if (!countryResponse.data || countryResponse.data.length === 0) {
        throw new Error(`País com código ${countryCode} não encontrado`);
      }

      const country = countryResponse.data[0];
      
      return {
        weather: {
          temp: weatherData.main.temp,
          description: weatherData.weather[0].description,
          icon: weatherData.weather[0].icon,
          humidity: weatherData.main.humidity,
          wind: weatherData.wind.speed
        },
        country: {
          name: country.name.common,
          capital: country.capital ? country.capital[0] : 'Não disponível',
          flag: country.flags.svg,
          population: country.population
        }
      };
      
    } catch (error) {
      console.error('Erro no getCityData:', error.message);
      throw new Error('Erro ao obter dados da cidade: ' + error.message);
    }
  }

  async getImageData(term) {
    try {
      // Obter imagens do Pixabay
      const response = await axios.get(
        `https://pixabay.com/api/`,
        {
          params: {
            key: this.pixabayApiKey,
            q: term,
            per_page: 6,
            image_type: 'photo'
          },
          timeout: 10000
        }
      );

      if (response.status !== 200) {
        throw new Error(`Pixabay retornou status ${response.status}`);
      }

      if (!response.data.hits || response.data.hits.length === 0) {
        throw new Error('Nenhuma imagem encontrada');
      }

      return response.data.hits.map(image => ({
        id: image.id,
        webformatURL: image.webformatURL,
        tags: image.tags,
        user: image.user
      }));
      
    } catch (error) {
      console.error('Erro no getImageData:', error.message);
      throw new Error('Erro ao obter imagens: ' + error.message);
    }
  }
}

module.exports = new ApiService();