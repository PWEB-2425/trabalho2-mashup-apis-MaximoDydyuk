require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Trust proxy para ambientes de produção (necessário para cookies "secure")
app.set('trust proxy', 1);

// Origens permitidas para CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://trab2maximodydyuk.vercel.app',
  'https://trabalho2-mashup-apis-maximodydyuk-7wtj.onrender.com'
];

// Configuração do CORS
app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitações sem 'origin' (ex: curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida por CORS'), false);
    }
  },
  credentials: true, // Fundamental para cookies cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares para JSON e URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sessão com MongoDB
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key_aleatoria',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 dia
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 dia
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true em produção para HTTPS
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // none para cross-site
  }
}));

// Passport.js
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// Middleware de logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware para definir Content-Type
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Rotas
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Servir arquivos estáticos (opcional)
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota de status
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'API Mashup',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Rota principal
app.get('/', (req, res) => {
  res.redirect('/status');
});

... (63 linhas)
Recolher
message.txt
5 KB
﻿
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Trust proxy para ambientes de produção (necessário para cookies "secure")
app.set('trust proxy', 1);

// Origens permitidas para CORS
const allowedOrigins = [
  'http://localhost:3000',
  'https://trab2maximodydyuk.vercel.app',
  'https://trabalho2-mashup-apis-maximodydyuk-7wtj.onrender.com'
];

// Configuração do CORS
app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitações sem 'origin' (ex: curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Origem não permitida por CORS'), false);
    }
  },
  credentials: true, // Fundamental para cookies cross-origin
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middlewares para JSON e URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Sessão com MongoDB
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key_aleatoria',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 24 * 60 * 60 // 1 dia
  }),
  cookie: {
    maxAge: 24 * 60 * 60 * 1000, // 1 dia
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // true em produção para HTTPS
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax' // none para cross-site
  }
}));

// Passport.js
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// Middleware de logs
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware para definir Content-Type
app.use((req, res, next) => {
  res.header('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Rotas
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Servir arquivos estáticos (opcional)
app.use(express.static(path.join(__dirname, 'frontend')));

// Rota de status
app.get('/status', (req, res) => {
  res.json({
    status: 'online',
    app: 'API Mashup',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Rota principal
app.get('/', (req, res) => {
  res.redirect('/status');
});

// Middleware 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Middleware global de erros
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

// Conexão ao MongoDB e inicialização do servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Conectado ao MongoDB');
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`\nServidor rodando na porta ${PORT}`);
      console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`URL: http://localhost:${PORT}`);
      console.log(`Database: ${mongoose.connection.readyState === 1 ? 'Conectado' : 'Desconectado'}`);
    });

    // Fechamento gracioso
    process.on('SIGINT', () => {
      console.log('\nRecebido SIGINT. Encerrando servidor...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('Conexões encerradas');
          process.exit(0);
        });
      });
    });
    process.on('SIGTERM', () => {
      console.log('\nRecebido SIGTERM. Encerrando servidor...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log('Conexões encerradas');
          process.exit(0);
        });
      });
    });
  })
  .catch(err => {
    console.error('Erro no MongoDB:', err.message);
    console.error('Verifique sua string de conexão MONGODB_URI no arquivo .env');
    process.exit(1);
  });
