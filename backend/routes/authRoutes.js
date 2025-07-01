const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');


router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  console.log(`[REGISTER] Tentativa de registro para: ${username}`);

  try {

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log(`[REGISTER] Utilizador já existe: ${username}`);
      return res.status(400).json({ error: 'Utilizador já existe.' });
    }


    const user = new User({ username, password });
    await user.save();
    console.log(`[REGISTER] Novo utilizador criado: ${user._id}`);


    req.login(user, (err) => {
      if (err) {
        console.error('[REGISTER] Erro no login automático:', err);
        return res.status(500).json({ error: 'Erro no login após registro' });
      }
      console.log(`[REGISTER] Sessão criada para: ${user._id} | SessionID: ${req.sessionID}`);
      return res.json({
        success: true,
        user: { id: user._id, username: user.username }
      });
    });
  } catch (error) {
    console.error('[REGISTER] Erro crítico:', error);
    res.status(500).json({ error: 'Erro ao registrar utilizador.' });
  }
});

router.post('/login', (req, res, next) => {
  const { username } = req.body;
  console.log(`[LOGIN] Tentativa de login para: ${username}`);

  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('[LOGIN] Erro na autenticação:', err);
      return next(err);
    }
    
    if (!user) {
      console.log(`[LOGIN] Falha: ${info.message || 'Credenciais inválidas'}`);
      return res.status(401).json({ error: info.message || 'Credenciais inválidas' });
    }

    req.logIn(user, (err) => {
      if (err) {
        console.error('[LOGIN] Erro ao criar sessão:', err);
        return next(err);
      }
      console.log(`[LOGIN] Sessão criada para: ${user._id} | SessionID: ${req.sessionID}`);
      return res.json({
        success: true,
        user: { id: user._id, username: user.username }
      });
    });
  })(req, res, next);
});


router.get('/logout', (req, res) => {
  if (!req.user) {
    console.log('[LOGOUT] Tentativa sem utilizador autenticado');
    return res.status(400).json({ error: 'Nenhuma sessão ativa' });
  }

  console.log(`[LOGOUT] Terminando sessão de: ${req.user.username}`);
  req.logout((err) => {
    if (err) {
      console.error('[LOGOUT] Erro:', err);
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    console.log('[LOGOUT] Sessão terminada com sucesso');
    res.json({ success: true });
  });
});


router.get('/check-session', (req, res) => {
  console.log('[CHECK-SESSION] Verificando sessão...');
  console.log(`SessionID: ${req.sessionID}`);
  console.log(`req.isAuthenticated(): ${req.isAuthenticated()}`);
  console.log(`req.user: ${req.user ? req.user.username : 'null'}`);

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
