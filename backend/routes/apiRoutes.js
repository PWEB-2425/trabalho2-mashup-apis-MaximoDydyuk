const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const apiService = require('../services/apiService');

// Middleware de autenticação
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'Não autenticado.' });
};

// Pesquisar cidade
router.get('/search/city', ensureAuthenticated, async (req, res) => {
  try {
    const city = req.query.term;
    const data = await apiService.getCityData(city);
    
    // Criar entrada de histórico
    const historyEntry = {
      term: city,
      type: 'city',
      weather: {
        temp: data.weather.temp,
        description: data.weather.description,
        icon: data.weather.icon
      },
      country: {
        name: data.country.name,
        capital: data.country.capital
      }
    };

    // Salvar histórico
    await User.findByIdAndUpdate(req.user.id, {
      $push: { searches: historyEntry }
    });
    
    res.json(data);
  } catch (error) {
    console.error('Erro na pesquisa de cidade:', error);
    res.status(500).json({ error: error.message });
  }
});

// Pesquisar imagens
router.get('/search/image', ensureAuthenticated, async (req, res) => {
  try {
    const term = req.query.term;
    const data = await apiService.getImageData(term);
    
    // Criar entrada de histórico
    const historyEntry = {
      term,
      type: 'image',
      imageData: {
        count: data.length,
        firstImage: data.length > 0 ? data[0].webformatURL : null
      }
    };

    // Salvar histórico
    await User.findByIdAndUpdate(req.user.id, {
      $push: { searches: historyEntry }
    });
    
    res.json(data);
  } catch (error) {
    console.error('Erro na pesquisa de imagem:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obter histórico
router.get('/history', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('searches');
    // Ordenar do mais recente para o mais antigo
    const sortedHistory = user.searches.sort((a, b) => b.date - a.date);
    res.json(sortedHistory);
  } catch (error) {
    console.error('Erro ao obter histórico:', error);
    res.status(500).json({ error: 'Erro ao obter histórico.' });
  }
});

// Limpar histórico
router.delete('/history', ensureAuthenticated, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, {
      $set: { searches: [] }
    });
    res.json({ success: true, message: 'Histórico limpo com sucesso' });
  } catch (error) {
    console.error('Erro ao limpar histórico:', error);
    res.status(500).json({ error: 'Erro ao limpar histórico.' });
  }
});

module.exports = router;