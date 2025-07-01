const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Estratégia local de autenticação
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Utilizador não encontrado.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Senha incorreta.' });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

// Serialização: guarda apenas o ID do utilizador na sessão
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Desserialização: obtém o utilizador pelo ID guardado na sessão
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    if (!user) {
      return done(new Error('Utilizador não encontrado durante a desserialização'));
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
});

module.exports = passport;
