require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// 1. Configuração do CORS corrigida
const allowedOrigins = [
  'http://localhost:3000',
  'https://trabalho2-mashup-apis-maximodydyuk-r1fm.onrender.com',
  'https://trab2maximodydyuk.vercel.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`Origem bloqueada: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.options('*', cors());

// 2. Middleware para sanitizar URLs
app.use((req, res, next) => {
  // Sanitiza URLs malformadas
  const cleanPath = req.path.replace(/[^a-zA-Z0-9\/\-_\.\?=&]/g, '');
  
  if (req.path !== cleanPath) {
    console.warn(`URL sanitizada: ${req.path} -> ${cleanPath}`);
    req.url = req.url.replace(req.path, cleanPath);
  }
  
  next();
});

// Middlewares
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Configuração de sessão corrigida
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret_key_aleatoria',
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

// Passport
require('./config/passport-config');
app.use(passport.initialize());
app.use(passport.session());

// 4. Middleware de logs aprimorado
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Origin: ${req.headers.origin}`);
  next();
});

// Rotas
const authRoutes = require('./routes/authRoutes');
const apiRoutes = require('./routes/apiRoutes');
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Servir arquivos estáticos
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

// 5. Rota principal corrigida
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// 6. Rota de fallback SPA corrigida
app.get('*', (req, res) => {
  // Ignora solicitações para arquivos estáticos
  if (req.path.includes('.') && !req.path.endsWith('/')) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }
  
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Middleware para tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// 7. Middleware global de tratamento de erros aprimorado
app.use((err, req, res, next) => {
  console.error(' ERRO:', err.stack);
  
  // Trata erros específicos do path-to-regexp
  if (err.message.includes('Missing parameter name')) {
    return res.status(400).json({
      error: 'URL inválida',
      message: 'A URL contém parâmetros malformados'
    });
  }
  
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

// Iniciar servidor
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(' Conectado ao MongoDB');
    
    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`\n Servidor rodando na porta ${PORT}`);
      console.log(` Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(` Origens permitidas: ${allowedOrigins.join(', ')}`);
    });

    // Gerenciamento de encerramento
    const shutdown = () => {
      console.log('\n Encerrando servidor...');
      server.close(() => {
        mongoose.connection.close(false, () => {
          console.log(' Conexões encerradas');
          process.exit(0);
        });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  })
  .catch(err => {
    console.error(' Erro no MongoDB:', err.message);
    process.exit(1);
  });
