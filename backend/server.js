require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://trab2maximodydyuk.vercel.app',
  'https://trabalho2-mashup-apis-maximodydyuk-r1fm.onrender.com',
  'https://trabalho2-mashup-apis-maximodydyuk-7wtj.onrender.com'
];

// 1) Cors sempre antes de rotas e middlewares que usam req/res
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    callback(new Error('CORS não permitido'));
  },
  credentials: true
}));

// 2) Middleware para logs (opcional, mas ajuda a debugar)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// 3) Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4) Session - antes do passport e rotas
app.use(session({
  secret: process.env.SESSION_SECRET || 'uma_chave_qualquer_secreta',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

// 5) Passport inicialização e session
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// 6) Rotas API - antes de servir frontend estático
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// 7) Servir frontend estático (pasta frontend)
app.use(express.static(path.join(__dirname, 'frontend')));

// 8) Qualquer rota não API vai para index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// 9) Middleware para erros 404 e global
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada', path: req.originalUrl, method: req.method });
});
app.use((err, req, res, next) => {
  console.error('ERRO:', err.stack);
  const errorResponse = {
    error: {
      message: err.message || 'Erro interno no servidor',
      type: err.name || 'InternalServerError',
      status: err.status || 500
    }
  };
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }
  res.status(errorResponse.error.status).json(errorResponse);
});

// 10) Conexão com MongoDB e start do servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado ao MongoDB');
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`Servidor rodando na porta ${PORT}`);
    });
    process.on('SIGINT', () => { /* ... */ });
    process.on('SIGTERM', () => { /* ... */ });
  })
  .catch(err => {
    console.error('Erro no MongoDB:', err.message);
    process.exit(1);
  });
