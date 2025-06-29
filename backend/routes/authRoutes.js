const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');

// Rota de registro
router.post('/register', async (req, res, next) => {
  const { username, password } = req.body;

  try {
    // Verificar se o usuário já existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Utilizador já existe.' });
    }

    // Criar novo usuário
    const user = new User({ username, password });
    await user.save();

    // Fazer login automaticamente
    req.login(user, (err) => {
      if (err) return next(err);
      return res.json({
        success: true,
        user: { id: user._id, username: user.username }
      });
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao registrar utilizador.' });
  }
});

// Rota de login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info.message });
    }

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.json({
        success: true,
        user: { id: user._id, username: user.username }
      });
    });
  })(req, res, next);
});

// Rota de logout
router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout.' });
    }
    res.json({ success: true });
  });
});

// Verificar sessão
router.get('/check-session', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: { id: req.user._id, username: req.user.username }
    });
  } else {
    res.json({ authenticated: false });
  }
});

module.exports = router;